import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shop_id");
    const startDateStr = searchParams.get("start_date");
    const endDateStr = searchParams.get("end_date");

    if (!shopId) {
        return NextResponse.json({ error: "shop_id is required" }, { status: 400 });
    }

    try {
        // Fetch archived invoices with invoice_items for accurate totals
        let invoicesQuery = supabase
            .from("invoices_table")
            .select(`
                id,
                invoice_number,
                display_id,
                status,
                total_amount,
                subtotal,
                tax_amount,
                tax_rate,
                discount_amount,
                amount_paid,
                outstanding_balance,
                created_at,
                updated_at,
                issue_date,
                invoice_items,
                customer:customers(id, customer_name),
                vehicle:customer_vehicles(id, year, make, model, license_plate)
            `)
            .eq("shop_id", shopId)
            .eq("archived", true)
            .order("updated_at", { ascending: false });

        if (startDateStr && endDateStr) {
            invoicesQuery = invoicesQuery
                .gte("updated_at", startDateStr)
                .lte("updated_at", endDateStr);
        }

        const { data: archivedInvoices, error: invoicesError } = await invoicesQuery;

        if (invoicesError) {
            console.error("Error fetching archived invoices:", invoicesError);
            throw invoicesError;
        }

        // Calculate correct totals from invoice items
        const invoicesWithCalculatedTotals = (archivedInvoices || []).map((invoice) => {
            const items = invoice.invoice_items || [];
            // Only include active items, exclude expense items (tracking only)
            const activeItems = items.filter((item: any) => item.active !== false && item.item_type !== 'expense');
            
            // Calculate subtotal: add regular items, subtract discounts
            const subtotal = activeItems.reduce((sum: number, item: any) => {
                if (item.item_type === 'discount') return sum - (item.total_price || 0);
                return sum + (item.total_price || 0);
            }, 0);
            
            const taxRate = invoice.tax_rate || 0.13;
            const tax = subtotal * taxRate;
            const total = subtotal + tax - (invoice.discount_amount || 0);
            
            return {
                ...invoice,
                calculated_subtotal: subtotal,
                calculated_tax: tax,
                calculated_total: total,
                // Remove invoice_items from response to reduce payload
                invoice_items: undefined
            };
        });

        // Fetch archived work orders
        // Note: work_orders doesn't have a total_price column - totals are calculated from items
        let workOrdersQuery = supabase
            .from("work_orders")
            .select(`
                id,
                title,
                status,
                archived_at,
                archived_by,
                created_at,
                updated_at,
                customer:customers(id, customer_name),
                vehicle:customer_vehicles(id, year, make, model, license_plate)
            `)
            .eq("shop_id", shopId)
            .eq("archived", true)
            .order("archived_at", { ascending: false });

        if (startDateStr && endDateStr) {
            workOrdersQuery = workOrdersQuery
                .gte("archived_at", startDateStr)
                .lte("archived_at", endDateStr);
        }

        const { data: archivedWorkOrders, error: workOrdersError } = await workOrdersQuery;

        if (workOrdersError) {
            console.error("Error fetching archived work orders:", workOrdersError);
            throw workOrdersError;
        }

        // Fetch archived expenses (one-time costs)
        // Note: archived_at might not exist, so we order by cost_date as fallback
        let archivedExpenses: any[] = [];
        try {
            let expensesQuery = supabase
                .from("one_time_costs")
                .select("*")
                .eq("shop_id", shopId)
                .eq("archived", true)
                .order("cost_date", { ascending: false });

            // Don't filter by archived_at date since it might not exist
            // Just get all archived expenses

            const { data, error: expensesError } = await expensesQuery;

            if (expensesError) {
                console.error("Error fetching archived expenses:", expensesError);
                // Don't throw - expenses might not have archived column yet
            } else {
                archivedExpenses = data || [];
            }
        } catch (expenseErr) {
            console.error("Error in expenses query:", expenseErr);
            // Continue without expenses data
        }

        // Calculate totals using calculated values
        const invoicesTotalAmount = invoicesWithCalculatedTotals.reduce(
            (sum, inv) => sum + (inv.calculated_total || 0), 
            0
        );
        // Work orders don't store total_price - totals are calculated from items
        // We don't have an efficient way to calculate this here, so just report count
        const workOrdersTotalAmount = 0;
        const expensesTotalAmount = archivedExpenses.reduce(
            (sum, exp) => sum + (Number(exp.amount) || 0), 
            0
        );

        return NextResponse.json({
            invoices: invoicesWithCalculatedTotals,
            workOrders: archivedWorkOrders || [],
            expenses: archivedExpenses,
            summary: {
                invoicesCount: invoicesWithCalculatedTotals.length,
                invoicesTotalAmount,
                workOrdersCount: (archivedWorkOrders || []).length,
                workOrdersTotalAmount,
                expensesCount: archivedExpenses.length,
                expensesTotalAmount,
            }
        }, { status: 200 });

    } catch (err: any) {
        console.error("Error in archived report:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
