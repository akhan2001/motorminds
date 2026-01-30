import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getTorontoDayBoundsUTC, getTorontoDateString } from "@/lib/utils/date";

/** Validate ISO timestamp string (UTC). Returns the string if valid, null otherwise. */
function parseIsoTimestamp(value: string | null): string | null {
    if (!value || typeof value !== "string") return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
}

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shop_id");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD format (for display)
    const isoTimestampStart = parseIsoTimestamp(searchParams.get("iso_timestamp_start"));
    const isoTimestampEnd = parseIsoTimestamp(searchParams.get("iso_timestamp_end"));

    if (!shopId) {
        return NextResponse.json({ error: "shop_id is required" }, { status: 400 });
    }

    let startOfDay: string;
    let endOfDay: string;
    let targetDate: string;

    // Prefer UTC ISO bounds from client (correct in all environments; store/send UTC)
    if (isoTimestampStart && isoTimestampEnd) {
        startOfDay = isoTimestampStart;
        endOfDay = isoTimestampEnd;
        targetDate = dateStr || startOfDay.slice(0, 10);
    } else {
        // Fallback: use Toronto timezone bounds (works correctly in both DEV and PROD)
        // This ensures a work order completed at 11:30 PM EST appears on the correct Toronto date
        targetDate = dateStr || getTorontoDateString();
        const bounds = getTorontoDayBoundsUTC(targetDate);
        startOfDay = bounds.start;
        endOfDay = bounds.end;
    }

    try {
        // Fetch work orders completed on this day (based on completed_at timestamp)
        const { data: completedWorkOrders, error: workOrdersError } = await supabase
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
            .gte("completed_at", startOfDay)
            .lte("completed_at", endOfDay);

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
        const { data: invoices, error: invoicesError } = await supabase
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
            .gte("paid_date", startOfDay)
            .lte("paid_date", endOfDay);

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
            .filter(wo => wo.vehicle)
            .map(wo => ({
                id: wo.vehicle?.id,
                work_order_id: wo.id,
                description: wo.vehicle ? `${wo.vehicle.year} ${wo.vehicle.make} ${wo.vehicle.model}` : 'Unknown',
                license_plate: wo.vehicle?.license_plate,
                work_order_title: wo.title,
                customer_name: wo.customer?.customer_name || 'Unknown'
            }));

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
