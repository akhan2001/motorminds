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

    // Parse dates for filtering using local timezone (EST/America/Toronto)
    // This ensures date filtering matches what the user selected in their local timezone
    const startDateStr = formatDateForFilter(startDate); // YYYY-MM-DD in local timezone
    const endDateStr = formatDateForFilter(endDate);

    try {
        // 1. Fetch general expenses from unified expenses table (source_type = 'general')
        const { data: generalExpensesData, error: generalExpensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('shop_id', shopId)
            .eq('source_type', 'general')
            .or('archived.eq.false,archived.is.null')
            .gte('expense_date', startDateStr)
            .lte('expense_date', endDateStr)
            .order('expense_date', { ascending: false });

        if (generalExpensesError) {
            console.error('General expenses error:', generalExpensesError);
            throw generalExpensesError;
        }

        // 2. Fetch work order expenses from unified expenses table (source_type = 'work_order')
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

        // 2b. Fetch work orders with vehicles for the work order expenses
        const expenseWorkOrderIds = new Set<string>();
        (workOrderExpensesData || []).forEach((expense: any) => {
            if (expense.work_order_id) {
                expenseWorkOrderIds.add(expense.work_order_id);
            }
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
                (workOrders || []).forEach((wo: any) => {
                    workOrdersMap.set(wo.id, wo);
                });
            }
        }

        // 3. Fetch parts expenses (item_type = 'part' with unit_cost) - COGS
        // Parts remain in work_order_items table
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

        // Filter parts by date range (using item created_at)
        // Convert dates to local timezone for comparison
        const filteredPartsExpenses = (partsExpenses || []).filter((item: any) => {
            // Get the item date in local timezone as YYYY-MM-DD
            const itemDateStr = formatDateForFilter(item.created_at);
            // Compare date strings (YYYY-MM-DD format allows string comparison)
            return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
        });

        // 4. Get invoice IDs from work order expenses to check payment status
        // Use invoice_id directly from expenses table for work order expenses
        const invoiceIds = new Set<string>();
        (workOrderExpensesData || []).forEach((expense: any) => {
            if (expense.invoice_id) {
                invoiceIds.add(expense.invoice_id);
            }
        });

        // Also collect work order IDs from parts for invoice status lookup
        const workOrderIds = new Set<string>();
        filteredPartsExpenses.forEach((item: any) => {
            if (item.work_order_id) {
                workOrderIds.add(item.work_order_id);
            }
        });

        // 5. Fetch invoice statuses for work order expenses (using invoice_id)
        let invoiceStatusMap = new Map<string, string>();
        if (invoiceIds.size > 0) {
            const { data: invoices, error: invoicesError } = await supabase
                .from('invoices_table')
                .select('id, status')
                .in('id', Array.from(invoiceIds));

            if (invoicesError) {
                console.error('Error fetching invoices by ID:', invoicesError);
            } else {
                (invoices || []).forEach((inv: any) => {
                    invoiceStatusMap.set(inv.id, inv.status);
                });
            }
        }

        // 6. Fetch invoices for parts (using work_order_id)
        let workOrderInvoiceMap = new Map<string, { hasInvoice: boolean; isPaid: boolean }>();
        if (workOrderIds.size > 0) {
            const { data: invoices, error: invoicesError } = await supabase
                .from('invoices_table')
                .select('id, work_order_id, status')
                .in('work_order_id', Array.from(workOrderIds));

            if (invoicesError) {
                console.error('Error fetching invoices by work order:', invoicesError);
            } else {
                (invoices || []).forEach((inv: any) => {
                    if (inv.work_order_id) {
                        workOrderInvoiceMap.set(inv.work_order_id, {
                            hasInvoice: true,
                            isPaid: inv.status === 'paid'
                        });
                    }
                });
            }
        }

        // 7. Process general expenses - map from new expenses table schema
        const processedGeneralExpenses = (generalExpensesData || []).map((item: any) => ({
            id: item.id,
            type: 'general_expense',
            description: item.description || 'Expense',
            vendor: item.vendor || 'N/A',
            invoice_number: item.invoice_number || '',
            date: item.expense_date,
            amount: Number(item.total) || 0,
            tax: Number(item.tax_amount) || 0,
            category: item.category || 'Other',
            payment_method: item.payment_method || '',
            notes: item.notes || '',
            is_paid: true, // General expenses are considered paid when recorded
            refund_amount: Number(item.refund_amount) || null,
            resolution_type: item.resolution_type || null,
        }));

        // 8. Process work order expenses - map from new expenses table schema
        const processedWorkOrderExpenses = (workOrderExpensesData || []).map((item: any) => {
            const hasInvoice = !!item.invoice_id;
            const invoiceStatus = item.invoice_id ? invoiceStatusMap.get(item.invoice_id) : null;
            const isPaid = invoiceStatus === 'paid';
            const workOrder = item.work_order_id ? workOrdersMap.get(item.work_order_id) : null;
            const vehicle = workOrder?.vehicle;
            
            return {
                id: item.id,
                type: 'work_order_expense',
                description: item.description,
                vendor: item.vendor || 'N/A',
                invoice_number: item.invoice_number || '',
                date: item.expense_date,
                amount: Number(item.total) || 0,
                tax: Number(item.tax_amount) || 0,
                payment_method: item.payment_method || '',
                work_order_id: item.work_order_id,
                work_order_title: workOrder?.title || 'Work Order',
                work_order_status: workOrder?.status,
                vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : null,
                license_plate: vehicle?.license_plate,
                has_invoice: hasInvoice,
                is_paid: isPaid,
                refund_amount: Number(item.refund_amount) || null,
                resolution_type: item.resolution_type || null,
            };
        });

        // 9. Process parts expenses (COGS) with payment status
        const processedPartsExpenses = filteredPartsExpenses.map((item: any) => {
            const invoiceInfo = workOrderInvoiceMap.get(item.work_order_id) || { hasInvoice: false, isPaid: false };
            const vehicle = item.work_order?.vehicle;
            const totalCost = (item.unit_cost || 0) * (item.quantity || 1);
            
            return {
                id: item.id,
                type: 'parts_cost',
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
                work_order_status: item.work_order?.status,
                vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : null,
                license_plate: vehicle?.license_plate,
                has_invoice: invoiceInfo.hasInvoice,
                is_paid: invoiceInfo.isPaid,
            };
        });

        // 10. Calculate totals (accounting for refunds - net amount = total - refund_amount)
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
        const workOrderExpensesPaid = processedWorkOrderExpenses.filter(e => e.is_paid);
        const workOrderExpensesPaidTotal = workOrderExpensesPaid.reduce((sum, e) => {
            const refund = e.refund_amount || 0;
            return sum + Math.max(0, e.amount - refund);
        }, 0);

        const partsExpensesTotal = processedPartsExpenses.reduce((sum, e) => sum + e.total_cost, 0);
        const partsExpensesPaid = processedPartsExpenses.filter(e => e.is_paid);
        const partsExpensesPaidTotal = partsExpensesPaid.reduce((sum, e) => sum + e.total_cost, 0);
        const partsProfitTotal = processedPartsExpenses.reduce((sum, e) => sum + e.profit, 0);

        const grandTotal = generalExpensesTotal + workOrderExpensesTotal + partsExpensesTotal;

        return NextResponse.json({
            generalExpenses: processedGeneralExpenses,
            workOrderExpenses: processedWorkOrderExpenses,
            partsExpenses: processedPartsExpenses,
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
                    paidCount: workOrderExpensesPaid.length,
                    paidTotal: workOrderExpensesPaidTotal,
                },
                partsExpenses: {
                    count: processedPartsExpenses.length,
                    totalCost: partsExpensesTotal,
                    paidCount: partsExpensesPaid.length,
                    paidTotalCost: partsExpensesPaidTotal,
                    totalProfit: partsProfitTotal,
                },
                grandTotal,
            },
            startDate,
            endDate,
        });

    } catch (error) {
        console.error('Error generating expense report:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
