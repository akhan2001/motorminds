import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

export interface UnifiedExpenseItem {
    id: string
    source: 'work_order' | 'general'
    item_type: 'part' | 'expense' | 'general_expense'
    description: string
    quantity: number
    unit_price: number
    total_cost: number | null
    total_price: number | null
    supplier: string | null
    vendor: string | null
    payment_method: string | null
    notes: string | null
    category: string | null
    part_number: string | null
    created_at: string
    work_order_id: string | null
    work_order: { id: string; work_order_number: string; title: string | null } | null
}

/**
 * Unified API endpoint for fetching both work order items (parts/expenses)
 * and one-time costs (general expenses) for the Parts & Expenses page
 * 
 * Supports filtering by:
 * - search: Search in description or work order number
 * - startDate/endDate: Date range filter
 * - supplier: Filter by supplier/vendor name
 * - itemType: Filter by item type (part, expense, general_expense)
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    
    // Get shop ID from query or user context
    let shopId = searchParams.get("shop_id");
    if (!shopId) {
        shopId = await getShopIdForUser();
    }
    
    if (!shopId) {
        return NextResponse.json({ error: "shop_id is required" }, { status: 400 });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const includeGeneral = searchParams.get("includeGeneral") === "true";
    
    // Filter parameters
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const supplierFilter = searchParams.get("supplier") || "";
    const itemTypeFilter = searchParams.get("itemType") || "";

    try {
        // Fetch work order items (parts and expenses)
        // Include new expense fields for expense items
        let workOrderItemsQuery = supabase
            .from('work_order_items')
            .select(`
                id,
                item_type,
                description,
                part_number,
                quantity,
                unit_price,
                unit_cost,
                total_cost,
                total_price,
                supplier,
                category,
                notes,
                created_at,
                work_order_id,
                expense_subtotal,
                expense_tax_amount,
                expense_tax_included,
                expense_payment_method,
                expense_vendor,
                expense_invoice_number,
                expense_parts_description,
                expense_cost_date,
                work_order:work_orders(id, work_order_number, title)
            `, { count: 'exact' })
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        // Apply item type filter for work order items
        if (itemTypeFilter === 'part') {
            workOrderItemsQuery = workOrderItemsQuery.eq('item_type', 'part');
        } else if (itemTypeFilter === 'expense') {
            workOrderItemsQuery = workOrderItemsQuery.eq('item_type', 'expense');
        } else if (itemTypeFilter !== 'general_expense') {
            // If not filtering for general_expense only, include both parts and expenses
            workOrderItemsQuery = workOrderItemsQuery.in('item_type', ['part', 'expense']);
        } else {
            // If filtering for general_expense only, don't fetch work order items
            workOrderItemsQuery = workOrderItemsQuery.in('item_type', []);
        }

        // Note: Search filter is applied post-fetch to include work order number matching

        // Apply date filter
        if (startDate) {
            workOrderItemsQuery = workOrderItemsQuery.gte('created_at', `${startDate}T00:00:00`);
        }
        if (endDate) {
            workOrderItemsQuery = workOrderItemsQuery.lte('created_at', `${endDate}T23:59:59`);
        }

        // Apply supplier filter (check both supplier and expense_vendor)
        if (supplierFilter) {
            workOrderItemsQuery = workOrderItemsQuery.or(
                `supplier.ilike.%${supplierFilter}%,expense_vendor.ilike.%${supplierFilter}%`
            );
        }

        // Fetch one-time costs if includeGeneral is true and not filtering for specific WO item types
        let oneTimeCosts: any[] = [];
        if (includeGeneral && (!itemTypeFilter || itemTypeFilter === 'general_expense')) {
            let otcQuery = supabase
                .from('one_time_costs')
                .select('*')
                .eq('shop_id', shopId)
                .order('created_at', { ascending: false });

            // Apply search filter to one_time_costs
            if (search) {
                otcQuery = otcQuery.ilike('cost_name', `%${search}%`);
            }

            // Apply date filter to one_time_costs
            if (startDate) {
                otcQuery = otcQuery.gte('cost_date', startDate);
            }
            if (endDate) {
                otcQuery = otcQuery.lte('cost_date', endDate);
            }

            // Apply supplier/vendor filter to one_time_costs
            if (supplierFilter) {
                otcQuery = otcQuery.ilike('vendor', `%${supplierFilter}%`);
            }

            const { data: otcData, error: otcError } = await otcQuery;
            if (otcError) throw otcError;
            oneTimeCosts = otcData || [];
        }

        const { data: workOrderItems, error: woiError } = await workOrderItemsQuery;

        if (woiError) throw woiError;

        // Transform work order items to unified format
        // For expense items, use expense fields that mirror one_time_costs
        let transformedWOItems: UnifiedExpenseItem[] = (workOrderItems || []).map((item: any) => ({
            id: item.id,
            source: 'work_order' as const,
            item_type: item.item_type,
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total_cost: item.total_cost,
            total_price: item.total_price,
            // For expense items, prefer expense_vendor over supplier; for parts, use supplier
            supplier: item.item_type === 'expense' 
                ? (item.expense_vendor || item.supplier) 
                : item.supplier,
            vendor: item.item_type === 'expense' 
                ? (item.expense_vendor || item.supplier) 
                : null,
            payment_method: item.item_type === 'expense' 
                ? item.expense_payment_method 
                : null,
            notes: item.notes,
            category: item.category,
            // For expense items, prefer expense_invoice_number over part_number
            part_number: item.item_type === 'expense' 
                ? (item.expense_invoice_number || item.part_number) 
                : item.part_number,
            created_at: item.item_type === 'expense' && item.expense_cost_date 
                ? item.expense_cost_date 
                : item.created_at,
            work_order_id: item.work_order_id,
            work_order: item.work_order
        }));

        // Apply work order number search filter (post-fetch since we can't filter on joined columns)
        if (search) {
            const searchLower = search.toLowerCase();
            transformedWOItems = transformedWOItems.filter(item => 
                item.description.toLowerCase().includes(searchLower) ||
                (item.work_order?.work_order_number?.toLowerCase().includes(searchLower))
            );
        }

        // Transform one-time costs to unified format
        const transformedOTC: UnifiedExpenseItem[] = oneTimeCosts.map((item: any) => ({
            id: item.id,
            source: 'general' as const,
            item_type: 'general_expense' as const,
            description: item.cost_name,
            quantity: 1,
            unit_price: item.amount || 0,
            total_cost: item.amount,
            total_price: item.amount,
            supplier: null,
            vendor: item.vendor,
            payment_method: item.payment_method,
            notes: item.notes,
            category: item.category,
            part_number: null,
            created_at: item.created_at || item.cost_date,
            work_order_id: null,
            work_order: null
        }));

        // Combine and sort by created_at descending
        const allItems = [...transformedWOItems, ...transformedOTC].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Apply pagination
        const totalCount = allItems.length;
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        const paginatedItems = allItems.slice(from, to);

        // Calculate stats
        const stats = {
            totalItems: totalCount,
            partsCount: allItems.filter(i => i.item_type === 'part').length,
            expensesCount: allItems.filter(i => i.item_type === 'expense').length,
            generalExpensesCount: allItems.filter(i => i.item_type === 'general_expense').length
        };

        return NextResponse.json({
            data: paginatedItems,
            count: totalCount,
            stats,
            page,
            pageSize
        }, { status: 200 });
    } catch (err: any) {
        console.error('Error fetching unified expenses:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
