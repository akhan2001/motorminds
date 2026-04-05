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

    const startMs = new Date(startOfDay).getTime();
    const endMs = new Date(endOfDay).getTime();

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

        // Fetch invoices linked to the completed work orders (regardless of paid_date)
        const completedWoIds = (completedWorkOrders || []).map(wo => wo.id).filter(Boolean)
        let workOrderInvoiceMap: Record<string, { total_amount: number; payments: any[] | null; payment_method: string | null; status: string }> = {}

        if (completedWoIds.length > 0) {
            const { data: woInvoices } = await supabase
                .from('invoices_table')
                .select('work_order_id, total_amount, payments, payment_method, status')
                .eq('shop_id', shopId)
                .in('work_order_id', completedWoIds)

            ;(woInvoices || []).forEach((inv: any) => {
                if (inv.work_order_id) workOrderInvoiceMap[inv.work_order_id] = inv
            })
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

        // Fetch invoices fully paid today (for invoicesCount, tax/subtotal totals, vehiclesServiced)
        const { data: paidInvoices, error: invoicesError } = await supabase
            .from("invoices_table")
            .select(`
                id,
                invoice_number,
                work_order_id,
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

        // Fetch partially paid invoices — may have payments received today that haven't yet
        // completed the invoice. Revenue is counted per payment_date, so these matter.
        const { data: partiallyPaidInvoices, error: partialError } = await supabase
            .from("invoices_table")
            .select("id, work_order_id, total_amount, payment_method, payments")
            .eq("shop_id", shopId)
            .eq("status", "partially_paid");

        if (partialError) {
            console.error("Error fetching partially paid invoices for daily report:", partialError);
        }

        // All work order IDs that have been invoiced (paid or partial).
        // Advance payments for these WOs are already captured in the invoice's payments[] array
        // (merged at invoice creation time), so we must not double-count them.
        const workOrderIdsWithInvoice = new Set([
            ...(paidInvoices || []).map((inv: any) => inv.work_order_id).filter(Boolean),
            ...(partiallyPaidInvoices || []).map((inv: any) => inv.work_order_id).filter(Boolean),
        ]);

        // Revenue + payment method breakdown from invoice payments.
        // Use individual payment_date (not invoice paid_date) so each payment lands on the
        // correct day — e.g. a $300 cash payment made March 27 on an invoice fully paid
        // April 4 counts on March 27, not April 4.
        let invoiceRevenue = 0;
        const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
        const paidInvoiceIds = new Set((paidInvoices || []).map((inv: any) => inv.id));

        const allInvoicesForRevenue = [...(paidInvoices || []), ...(partiallyPaidInvoices || [])];
        allInvoicesForRevenue.forEach((inv: any) => {
            const payments = inv.payments as any[] | null;
            if (payments && Array.isArray(payments) && payments.length > 0) {
                payments.forEach((payment: any) => {
                    if (payment.deleted) return;
                    const paymentDateMs = payment.payment_date ? new Date(payment.payment_date).getTime() : 0;
                    if (paymentDateMs < startMs || paymentDateMs > endMs) return;
                    const amount = Number(payment.amount) || 0;
                    invoiceRevenue += amount;
                    const method = payment.payment_method || 'other';
                    if (!paymentMethodBreakdown[method]) paymentMethodBreakdown[method] = { count: 0, amount: 0 };
                    paymentMethodBreakdown[method].count += 1;
                    paymentMethodBreakdown[method].amount += amount;
                });
            } else if (paidInvoiceIds.has(inv.id)) {
                // Legacy fallback: paid invoice with no payments array — use invoice-level fields.
                // Invoice is already filtered by paid_date so this lands on the correct day.
                const method = inv.payment_method || 'other';
                if (!paymentMethodBreakdown[method]) paymentMethodBreakdown[method] = { count: 0, amount: 0 };
                paymentMethodBreakdown[method].count += 1;
                paymentMethodBreakdown[method].amount += Number(inv.total_amount) || 0;
                invoiceRevenue += Number(inv.total_amount) || 0;
            }
        });

        // Fetch work orders with advance_payments for this shop (to include in daily total)
        const { data: workOrdersWithAdvance, error: advanceError } = await supabase
            .from("work_orders")
            .select("id, advance_payments")
            .eq("shop_id", shopId);

        if (advanceError) {
            console.error("Error fetching work orders for advance payments:", advanceError);
        }

        // Sum advance payments where payment_date falls within the report day.
        // Skip work orders that have any invoice — advance payments are merged into the
        // invoice's payments[] array at invoice creation, so they're already counted above.
        let advancePaymentsTotal = 0;
        const advancePaymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
        (workOrdersWithAdvance || []).forEach((wo) => {
            if (workOrderIdsWithInvoice.has(wo.id)) return;
            const payments = (wo.advance_payments as any[] | null) || [];
            payments.forEach((p: any) => {
                if (p.deleted) return;
                const paymentDate = p.payment_date ? new Date(p.payment_date).getTime() : 0;
                if (paymentDate >= startMs && paymentDate <= endMs) {
                    const amount = Number(p.amount) || 0;
                    advancePaymentsTotal += amount;
                    const method = p.payment_method || "other";
                    if (!advancePaymentMethodBreakdown[method]) {
                        advancePaymentMethodBreakdown[method] = { count: 0, amount: 0 };
                    }
                    advancePaymentMethodBreakdown[method].count += 1;
                    advancePaymentMethodBreakdown[method].amount += amount;
                }
            });
        });

        // Merge advance payment method breakdown into main breakdown
        Object.entries(advancePaymentMethodBreakdown).forEach(([method, data]) => {
            if (!paymentMethodBreakdown[method]) {
                paymentMethodBreakdown[method] = { count: 0, amount: 0 };
            }
            paymentMethodBreakdown[method].count += data.count;
            paymentMethodBreakdown[method].amount += data.amount;
        });

        // Fetch credits/refunds for the day (processed or reconciled - money flowing back in)
        const { data: creditsRefundsData } = await supabase
            .from('credits_refunds')
            .select('amount')
            .eq('shop_id', shopId)
            .in('status', ['processed', 'reconciled'])
            .eq('refund_date', targetDate)
            .or('archived.eq.false,archived.is.null');

        const creditsRefundsTotal = (creditsRefundsData || []).reduce(
            (sum, c) => sum + Number(c.amount || 0),
            0
        );

        const totalRevenue = invoiceRevenue + advancePaymentsTotal;

        // Tax and subtotal are per-invoice properties, not per-payment.
        // Use fully paid invoices (paid today) as the basis — these are the closed transactions.
        const totalTax = (paidInvoices || []).reduce(
            (sum, inv) => sum + (Number(inv.tax_amount) || 0),
            0
        );
        const totalSubtotal = (paidInvoices || []).reduce(
            (sum, inv) => sum + (Number(inv.subtotal) || 0),
            0
        );

        // Get vehicle details from completed work orders for the report
        // Supabase may return relations as single object or array; normalize to object
        const vehiclesServiced = (completedWorkOrders || []).map((wo) => {
            const vehicle = Array.isArray(wo.vehicle) ? wo.vehicle[0] : wo.vehicle;
            const customer = Array.isArray(wo.customer) ? wo.customer[0] : wo.customer;
            const invoice = workOrderInvoiceMap[wo.id] ?? null;

            // Derive unique payment methods: prefer payments array, fallback to invoice-level field
            const paymentMethods: string[] = [];
            if (invoice) {
                const payments = invoice.payments as any[] | null;
                if (payments && payments.length > 0) {
                    const seen = new Set<string>();
                    payments.filter((p: any) => !p.deleted).forEach((p: any) => {
                        const m = p.payment_method || 'other';
                        if (!seen.has(m)) { seen.add(m); paymentMethods.push(m); }
                    });
                } else if (invoice.payment_method) {
                    paymentMethods.push(invoice.payment_method);
                }
            }

            return {
                id: vehicle?.id,
                work_order_id: wo.id,
                description: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
                license_plate: vehicle?.license_plate,
                work_order_title: wo.title,
                customer_name: (customer as { customer_name?: string } | null)?.customer_name || 'Unknown',
                paid_amount: invoice?.status === 'paid' ? (Number(invoice.total_amount) || null) : null,
                payment_method_labels: paymentMethods.map(formatPaymentMethodLabel),
            };
        }).filter((v) => v.id != null);

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
                invoicesCount: (paidInvoices || []).length,
                totalRevenue,
                totalSubtotal,
                totalTax,
                advancePaymentsTotal,
                creditsRefundsTotal,
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
