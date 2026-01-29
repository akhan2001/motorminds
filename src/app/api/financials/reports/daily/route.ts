import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shop_id");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD format

    if (!shopId) {
        return NextResponse.json({ error: "shop_id is required" }, { status: 400 });
    }

    // Default to today if no date provided
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    
    // Query a wider UTC range (±1 day) to ensure we capture all records regardless of timezone
    // Then filter in memory to match the exact date
    const targetDateObj = new Date(targetDate + 'T00:00:00.000Z');
    const dayBefore = new Date(targetDateObj);
    dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
    const dayAfter = new Date(targetDateObj);
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
    
    const queryStart = dayBefore.toISOString();
    const queryEnd = dayAfter.toISOString();

    /**
     * Helper function to check if a timestamp's UTC date matches the target date
     */
    const matchesTargetDate = (timestamp: string | null | undefined): boolean => {
        if (!timestamp) return false;
        const date = new Date(timestamp);
        const utcDateStr = date.toISOString().split('T')[0];
        return utcDateStr === targetDate;
    };

    try {
        // Fetch work orders completed on this day (based on completed_at timestamp)
        // Query wider range, then filter by exact date match
        const { data: allCompletedWorkOrders, error: workOrdersError } = await supabase
            .from("work_orders")
            .select(`
                id,
                title,
                status,
                completed_at,
                vehicle_id,
                customer_id,
                vehicle:customer_vehicles(id, year, make, model, license_plate),
                customer:customers(id, customer_name)
            `)
            .eq("shop_id", shopId)
            .eq("status", "completed")
            .gte("completed_at", queryStart)
            .lte("completed_at", queryEnd);
        
        // Filter to only include records where the UTC date matches targetDate
        const completedWorkOrders = (allCompletedWorkOrders || []).filter(wo => 
            matchesTargetDate(wo.completed_at)
        );

        if (workOrdersError) {
            console.error("Error fetching work orders for daily report:", workOrdersError);
            // Don't throw - continue without work orders data
        }

        // Count unique vehicles from completed work orders (Cars Serviced)
        const uniqueVehicleIds = new Set<string>();
        (completedWorkOrders || []).forEach(wo => {
            if (wo.vehicle_id) {
                uniqueVehicleIds.add(wo.vehicle_id);
            }
        });
        const carsCount = uniqueVehicleIds.size;
        const workOrdersCompletedCount = (completedWorkOrders || []).length;

        // Fetch paid invoices for the day (for revenue calculations)
        // Query wider range, then filter by exact date match
        const { data: allInvoices, error: invoicesError } = await supabase
            .from("invoices_table")
            .select(`
                id,
                invoice_number,
                total_amount,
                subtotal,
                tax_amount,
                payment_method,
                paid_date,
                vehicle_id,
                customer_id,
                payments,
                vehicle:customer_vehicles(id, year, make, model, license_plate)
            `)
            .eq("shop_id", shopId)
            .eq("status", "paid")
            .gte("paid_date", queryStart)
            .lte("paid_date", queryEnd);
        
        // Filter to only include records where the UTC date matches targetDate
        const invoices = (allInvoices || []).filter(inv => 
            matchesTargetDate(inv.paid_date)
        );

        if (invoicesError) {
            console.error("Error fetching invoices for daily report:", invoicesError);
            throw invoicesError;
        }

        // Calculate payment method breakdown
        const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
        
        (invoices || []).forEach(inv => {
            // Check payments array first (for multiple payments)
            const payments = inv.payments as any[] | null;
            if (payments && Array.isArray(payments) && payments.length > 0) {
                payments.forEach((payment: any) => {
                    if (payment.deleted) return; // Skip deleted payments
                    const method = payment.payment_method || 'other';
                    if (!paymentMethodBreakdown[method]) {
                        paymentMethodBreakdown[method] = { count: 0, amount: 0 };
                    }
                    paymentMethodBreakdown[method].count += 1;
                    paymentMethodBreakdown[method].amount += Number(payment.amount) || 0;
                });
            } else {
                // Fallback to invoice-level payment method
                const method = inv.payment_method || 'other';
                if (!paymentMethodBreakdown[method]) {
                    paymentMethodBreakdown[method] = { count: 0, amount: 0 };
                }
                paymentMethodBreakdown[method].count += 1;
                paymentMethodBreakdown[method].amount += Number(inv.total_amount) || 0;
            }
        });

        // Calculate totals
        const totalRevenue = (invoices || []).reduce(
            (sum, inv) => sum + (Number(inv.total_amount) || 0), 
            0
        );
        const totalTax = (invoices || []).reduce(
            (sum, inv) => sum + (Number(inv.tax_amount) || 0), 
            0
        );
        const totalSubtotal = (invoices || []).reduce(
            (sum, inv) => sum + (Number(inv.subtotal) || 0), 
            0
        );

        // Get vehicle details from completed work orders for the report
        const vehiclesServiced = (completedWorkOrders || [])
            .filter(wo => wo.vehicle && !Array.isArray(wo.vehicle))
            .map(wo => {
                const vehicle = Array.isArray(wo.vehicle) ? wo.vehicle[0] : wo.vehicle;
                const customer = Array.isArray(wo.customer) ? wo.customer[0] : wo.customer;
                return {
                    id: vehicle?.id,
                    work_order_id: wo.id,
                    description: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
                    license_plate: vehicle?.license_plate,
                    work_order_title: wo.title,
                    customer_name: customer?.customer_name || 'Unknown'
                };
            });

        // Format payment method breakdown for response
        const paymentMethods = Object.entries(paymentMethodBreakdown).map(([method, data]) => ({
            method,
            label: formatPaymentMethodLabel(method),
            count: data.count,
            amount: data.amount,
            percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0
        })).sort((a, b) => b.amount - a.amount);

        return NextResponse.json({
            date: targetDate,
            summary: {
                carsCount,
                workOrdersCompletedCount,
                invoicesCount: (invoices || []).length,
                totalRevenue,
                totalSubtotal,
                totalTax,
            },
            paymentMethods,
            vehiclesServiced,
        }, { status: 200 });

    } catch (err: any) {
        console.error("Error in daily report:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function formatPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
        'credit_card': 'Credit Card',
        'debit_card': 'Debit Card',
        'debit': 'Debit',
        'cash': 'Cash',
        'check': 'Check',
        'bank_transfer': 'Bank Transfer',
        'e_transfer': 'E-Transfer',
        'other': 'Other',
    };
    return labels[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
