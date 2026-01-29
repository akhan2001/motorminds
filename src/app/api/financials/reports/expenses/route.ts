import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    
    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate'); // YYYY-MM-DD format
    const endDateStr = searchParams.get('endDate'); // YYYY-MM-DD format
    const shopId = searchParams.get('shopId');
    // Timezone offset in minutes from frontend (e.g., 300 for EST = UTC-5)
    const tzOffset = parseInt(searchParams.get('timezoneOffset') || '0', 10);

    if (!startDateStr || !endDateStr || !shopId) {
        return new NextResponse('Missing required query parameters: startDate, endDate, shopId', { status: 400 });
    }

    /**
     * Check if a string is a date-only format (YYYY-MM-DD) without time
     */
    const isDateOnly = (dateString: string): boolean => {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    };

    /**
     * Convert UTC timestamp to local date (YYYY-MM-DD) using timezone offset
     * For date-only strings (YYYY-MM-DD), return as-is since they're already local dates
     * For full timestamps, apply timezone conversion
     */
    const toLocalDate = (dateString: string | null | undefined): string | null => {
        if (!dateString) return null;
        
        // If it's already a date-only string (YYYY-MM-DD), return it directly
        // These are local dates and should NOT be timezone-converted
        if (isDateOnly(dateString)) {
            return dateString;
        }
        
        // For full timestamps, apply timezone conversion
        const utc = new Date(dateString);
        const local = new Date(utc.getTime() - (tzOffset * 60 * 1000));
        const y = local.getUTCFullYear();
        const m = String(local.getUTCMonth() + 1).padStart(2, '0');
        const d = String(local.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    /**
     * Check if timestamp's LOCAL date falls within the date range
     */
    const matchesDateRange = (dateString: string | null | undefined): boolean => {
        if (!dateString) return false;
        const localDate = toLocalDate(dateString);
        if (!localDate) return false;
        return localDate >= startDateStr && localDate <= endDateStr;
    };

    try {
        // Query a wider range for general expenses to ensure we capture all records
        // Then filter in memory to match exact dates
        const startDateObj = new Date(startDateStr + 'T00:00:00.000Z');
        const endDateObj = new Date(endDateStr + 'T00:00:00.000Z');
        const dayBefore = new Date(startDateObj);
        dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
        const dayAfter = new Date(endDateObj);
        dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
        
        const queryStart = dayBefore.toISOString().split('T')[0];
        const queryEnd = dayAfter.toISOString().split('T')[0];

        // 1. Fetch general expenses (one_time_costs)
        const { data: allGeneralExpenses, error: generalExpensesError } = await supabase
            .from('one_time_costs')
            .select('*')
            .eq('shop_id', shopId)
            .gte('cost_date', queryStart)
            .lte('cost_date', queryEnd)
            .order('cost_date', { ascending: false });
        
        // Filter to only include records where the date matches the target range
        const generalExpenses = (allGeneralExpenses || []).filter((item: any) => 
            matchesDateRange(item.cost_date)
        );

        if (generalExpensesError) throw generalExpensesError;

        // 2. Fetch work order expenses (item_type = 'expense')
        // work_order_items has its own shop_id column
        // We fetch all and filter by date client-side using expense_cost_date
        const { data: workOrderExpenses, error: workOrderExpensesError } = await supabase
            .from('work_order_items')
            .select(`
                id,
                work_order_id,
                shop_id,
                description,
                quantity,
                unit_price,
                total_price,
                item_type,
                expense_vendor,
                expense_invoice_number,
                expense_cost_date,
                expense_tax_amount,
                expense_payment_method,
                is_billable,
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
            .eq('item_type', 'expense')
            .or('active.eq.true,active.is.null')
            .order('created_at', { ascending: false });

        if (workOrderExpensesError) {
            console.error('Work order expenses error:', workOrderExpensesError);
            throw workOrderExpensesError;
        }

        // Filter work order expenses by date range (using expense_cost_date or created_at)
        // Use date-only comparison to avoid timezone issues
        const filteredWorkOrderExpenses = (workOrderExpenses || []).filter((item: any) => {
            const itemDate = item.expense_cost_date || item.created_at;
            return matchesDateRange(itemDate);
        });

        // 3. Fetch parts expenses (item_type = 'part' with unit_cost) - COGS
        // Filter by work order created_at date
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
        // Use date-only comparison to avoid timezone issues
        const filteredPartsExpenses = (partsExpenses || []).filter((item: any) => {
            return matchesDateRange(item.created_at);
        });

        // 4. Get all work order IDs to check invoice status
        const workOrderIds = new Set<string>();
        filteredWorkOrderExpenses.forEach((item: any) => {
            if (item.work_order_id) {
                workOrderIds.add(item.work_order_id);
            }
        });
        filteredPartsExpenses.forEach((item: any) => {
            if (item.work_order_id) {
                workOrderIds.add(item.work_order_id);
            }
        });

        // 5. Fetch invoices for these work orders to check payment status
        let workOrderInvoiceMap = new Map<string, { hasInvoice: boolean; isPaid: boolean }>();
        
        if (workOrderIds.size > 0) {
            const { data: invoices, error: invoicesError } = await supabase
                .from('invoices_table')
                .select('id, work_order_id, status')
                .in('work_order_id', Array.from(workOrderIds));

            if (invoicesError) {
                console.error('Error fetching invoices:', invoicesError);
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

        // 6. Process work order expenses with payment status
        const processedWorkOrderExpenses = filteredWorkOrderExpenses.map((item: any) => {
            const invoiceInfo = workOrderInvoiceMap.get(item.work_order_id) || { hasInvoice: false, isPaid: false };
            const vehicle = item.work_order?.vehicle;
            const rawDate = item.expense_cost_date || item.created_at;
            
            return {
                id: item.id,
                type: 'work_order_expense',
                description: item.description,
                vendor: item.expense_vendor || 'N/A',
                invoice_number: item.expense_invoice_number || '',
                date: toLocalDate(rawDate) || rawDate, // Return local date
                amount: item.total_price || 0,
                tax: item.expense_tax_amount || 0,
                payment_method: item.expense_payment_method || '',
                work_order_id: item.work_order_id,
                work_order_title: item.work_order?.title || 'Work Order',
                work_order_status: item.work_order?.status,
                vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : null,
                license_plate: vehicle?.license_plate,
                has_invoice: invoiceInfo.hasInvoice,
                is_paid: invoiceInfo.isPaid,
            };
        });

        // 7. Process parts expenses (COGS) with payment status
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
                date: toLocalDate(item.created_at) || item.created_at, // Return local date
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

        // 8. Process general expenses
        const processedGeneralExpenses = (generalExpenses || []).map((item: any) => ({
            id: item.id,
            type: 'general_expense',
            description: item.description || item.cost_name || 'Expense',
            vendor: item.cost_name || 'N/A',
            invoice_number: item.invoice_number || '',
                date: toLocalDate(item.cost_date) || item.cost_date, // Return local date
            amount: item.amount || 0,
            tax: item.tax_amount || 0,
            category: item.category || 'Other',
            payment_method: item.payment_method || '',
            notes: item.notes || '',
            is_paid: true,
        }));

        // 9. Calculate totals
        const generalExpensesTotal = processedGeneralExpenses.reduce((sum, e) => sum + e.amount, 0);
        const generalExpensesTax = processedGeneralExpenses.reduce((sum, e) => sum + e.tax, 0);

        const workOrderExpensesTotal = processedWorkOrderExpenses.reduce((sum, e) => sum + e.amount, 0);
        const workOrderExpensesTax = processedWorkOrderExpenses.reduce((sum, e) => sum + e.tax, 0);
        const workOrderExpensesPaid = processedWorkOrderExpenses.filter(e => e.is_paid);
        const workOrderExpensesPaidTotal = workOrderExpensesPaid.reduce((sum, e) => sum + e.amount, 0);

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
            startDate: startDateStr,
            endDate: endDateStr,
        });

    } catch (error) {
        console.error('Error generating expense report:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
