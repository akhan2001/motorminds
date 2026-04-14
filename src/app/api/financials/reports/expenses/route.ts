import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { formatDateForFilter } from '@/lib/utils/date';

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const shopId = searchParams.get('shopId');

    if (!startDate || !endDate || !shopId) {
        return new NextResponse('Missing required query parameters: startDate, endDate, shopId', { status: 400 });
    }

    const startDateStr = formatDateForFilter(startDate);
    const endDateStr = formatDateForFilter(endDate);

    try {
        // 1. General & invoice-linked expenses
        const { data: generalExpensesData, error: generalExpensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('shop_id', shopId)
            .in('source_type', ['general', 'invoice'])
            .or('archived.eq.false,archived.is.null')
            .gte('expense_date', startDateStr)
            .lte('expense_date', endDateStr)
            .order('expense_date', { ascending: false });

        if (generalExpensesError) {
            console.error('General expenses error:', generalExpensesError);
            throw generalExpensesError;
        }

        // 2. Work order expenses
        const { data: workOrderExpensesData, error: workOrderExpensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('shop_id', shopId)
            .eq('source_type', 'work_order')
            .or('archived.eq.false,archived.is.null')
            .gte('expense_date', startDateStr)
            .lte('expense_date', endDateStr)
            .order('expense_date', { ascending: false });

        if (workOrderExpensesError) {
            console.error('Work order expenses error:', workOrderExpensesError);
            throw workOrderExpensesError;
        }

        // 2b. Fetch work orders (for vehicle + status context)
        const expenseWorkOrderIds = new Set<string>();
        (workOrderExpensesData || []).forEach((expense: any) => {
            if (expense.work_order_id) expenseWorkOrderIds.add(expense.work_order_id);
        });

        let workOrdersMap = new Map<string, any>();
        if (expenseWorkOrderIds.size > 0) {
            const { data: workOrders, error: workOrdersError } = await supabase
                .from('work_orders')
                .select(`
                    id,
                    title,
                    status,
                    created_at,
                    vehicle_id,
                    vehicle:customer_vehicles (
                        year,
                        make,
                        model,
                        license_plate
                    )
                `)
                .in('id', Array.from(expenseWorkOrderIds));

            if (workOrdersError) {
                console.error('Error fetching work orders for expenses:', workOrdersError);
            } else {
                (workOrders || []).forEach((wo: any) => workOrdersMap.set(wo.id, wo));
            }
        }

        // 3. Parts expenses (COGS) — from work_order_items
        const { data: partsExpenses, error: partsExpensesError } = await supabase
            .from('work_order_items')
            .select(`
                id,
                work_order_id,
                shop_id,
                description,
                quantity,
                unit_price,
                unit_cost,
                total_price,
                item_type,
                part_number,
                supplier,
                active,
                created_at,
                work_order:work_orders (
                    id,
                    title,
                    status,
                    created_at,
                    vehicle_id,
                    vehicle:customer_vehicles (
                        year,
                        make,
                        model,
                        license_plate
                    )
                )
            `)
            .eq('shop_id', shopId)
            .eq('item_type', 'part')
            .or('active.eq.true,active.is.null')
            .not('unit_cost', 'is', null)
            .gt('unit_cost', 0)
            .order('created_at', { ascending: false });

        if (partsExpensesError) {
            console.error('Parts expenses error:', partsExpensesError);
            throw partsExpensesError;
        }

        const filteredPartsExpenses = (partsExpenses || []).filter((item: any) => {
            const itemDateStr = formatDateForFilter(item.created_at);
            return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
        });

        // 4. Process general expenses
        // Expenses are already paid — status is driven by resolution_type / refund_amount only
        const processedGeneralExpenses = (generalExpensesData || []).map((item: any) => ({
            id: item.id,
            type: 'general_expense' as const,
            source_type: item.source_type as 'general' | 'invoice',
            description: item.description || 'Expense',
            vendor: item.vendor || 'N/A',
            invoice_number: item.invoice_number || '',
            date: item.expense_date,
            amount: Number(item.total) || 0,
            tax: Number(item.tax_amount) || 0,
            category: item.category || 'Other',
            payment_method: item.payment_method || '',
            notes: item.notes || '',
            invoice_id: item.invoice_id || null,
            refund_amount: Number(item.refund_amount) || null,
            resolution_type: item.resolution_type || null,
        }));

        // 5. Process work order expenses
        const processedWorkOrderExpenses = (workOrderExpensesData || []).map((item: any) => {
            const workOrder = item.work_order_id ? workOrdersMap.get(item.work_order_id) : null;
            const vehicle = workOrder?.vehicle;

            return {
                id: item.id,
                type: 'work_order_expense' as const,
                description: item.description,
                vendor: item.vendor || 'N/A',
                invoice_number: item.invoice_number || '',
                date: item.expense_date,
                amount: Number(item.total) || 0,
                tax: Number(item.tax_amount) || 0,
                payment_method: item.payment_method || '',
                work_order_id: item.work_order_id,
                work_order_title: workOrder?.title || 'Work Order',
                work_order_status: workOrder?.status || null,
                vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : null,
                license_plate: vehicle?.license_plate || null,
                refund_amount: Number(item.refund_amount) || null,
                resolution_type: item.resolution_type || null,
            };
        });

        // 6. Process parts (COGS)
        const processedPartsExpenses = filteredPartsExpenses.map((item: any) => {
            const vehicle = item.work_order?.vehicle;
            const totalCost = (item.unit_cost || 0) * (item.quantity || 1);

            return {
                id: item.id,
                type: 'parts_cost' as const,
                description: item.description,
                part_number: item.part_number || '',
                supplier: item.supplier || 'N/A',
                date: item.created_at,
                quantity: item.quantity || 1,
                unit_cost: item.unit_cost || 0,
                total_cost: totalCost,
                sale_price: item.total_price || 0,
                profit: (item.total_price || 0) - totalCost,
                work_order_id: item.work_order_id,
                work_order_title: item.work_order?.title || 'Work Order',
                work_order_status: item.work_order?.status || null,
                vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : null,
                license_plate: vehicle?.license_plate || null,
            };
        });

        // 7. Totals
        const generalExpensesTotal = processedGeneralExpenses.reduce((sum, e) => {
            const refund = e.refund_amount || 0;
            return sum + Math.max(0, e.amount - refund);
        }, 0);
        const generalExpensesTax = processedGeneralExpenses.reduce((sum, e) => sum + e.tax, 0);

        const workOrderExpensesTotal = processedWorkOrderExpenses.reduce((sum, e) => {
            const refund = e.refund_amount || 0;
            return sum + Math.max(0, e.amount - refund);
        }, 0);
        const workOrderExpensesTax = processedWorkOrderExpenses.reduce((sum, e) => sum + e.tax, 0);

        const partsExpensesTotal = processedPartsExpenses.reduce((sum, e) => sum + e.total_cost, 0);
        const partsProfitTotal = processedPartsExpenses.reduce((sum, e) => sum + e.profit, 0);

        // 8. Credits & Refunds (supplier-side, separate table)
        const { data: creditsRefundsData, error: creditsError } = await supabase
            .from('credits_refunds')
            .select('*')
            .eq('shop_id', shopId)
            .or('archived.eq.false,archived.is.null')
            .gte('refund_date', startDateStr)
            .lte('refund_date', endDateStr)
            .order('refund_date', { ascending: false });

        if (creditsError) {
            console.error('Credits/refunds fetch error:', creditsError);
        }

        const creditsRefunds = creditsRefundsData || [];
        const creditsRefundsTotal = creditsRefunds.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        const processedCreditsRefunds = creditsRefunds.map((item: any) => ({
            id: item.id,
            supplier: item.supplier || 'N/A',
            reason: item.reason,
            amount: Number(item.amount) || 0,
            refund_date: item.refund_date,
            status: item.status,
            notes: item.notes || '',
        }));

        const grandTotal = generalExpensesTotal + workOrderExpensesTotal + partsExpensesTotal;
        const netExpenses = grandTotal - creditsRefundsTotal;

        return NextResponse.json({
            generalExpenses: processedGeneralExpenses,
            workOrderExpenses: processedWorkOrderExpenses,
            partsExpenses: processedPartsExpenses,
            creditsRefunds: processedCreditsRefunds,
            summary: {
                generalExpenses: {
                    count: processedGeneralExpenses.length,
                    total: generalExpensesTotal,
                    tax: generalExpensesTax,
                },
                workOrderExpenses: {
                    count: processedWorkOrderExpenses.length,
                    total: workOrderExpensesTotal,
                    tax: workOrderExpensesTax,
                },
                partsExpenses: {
                    count: processedPartsExpenses.length,
                    totalCost: partsExpensesTotal,
                    totalProfit: partsProfitTotal,
                },
                creditsRefunds: {
                    count: processedCreditsRefunds.length,
                    total: creditsRefundsTotal,
                },
                grandTotal,
                netExpenses,
            },
            startDate,
            endDate,
        });

    } catch (error) {
        console.error('Error generating expense report:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
