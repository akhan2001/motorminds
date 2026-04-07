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
        targetDate = dateStr || getTorontoDateString();
        const bounds = getTorontoDayBoundsUTC(targetDate);
        startOfDay = bounds.start;
        endOfDay = bounds.end;
    }

    try {
        // ── Completed work orders (for Cars Serviced count only) ─────────────────
        const { data: completedWorkOrders, error: workOrdersError } = await supabase
            .from("work_orders")
            .select("id, vehicle_id")
            .eq("shop_id", shopId)
            .eq("status", "completed")
            .gte("completed_at", startOfDay)
            .lte("completed_at", endOfDay);

        if (workOrdersError) {
            console.error("Error fetching work orders for daily report:", workOrdersError);
        }

        const uniqueVehicleIds = new Set<string>();
        (completedWorkOrders || []).forEach(wo => {
            if (wo.vehicle_id) uniqueVehicleIds.add(wo.vehicle_id);
        });
        const carsCount = uniqueVehicleIds.size;
        const workOrdersCompletedCount = (completedWorkOrders || []).length;

        // ── All recent invoices (paid or partially paid within 1 year) ───────────
        // Used for: revenue, breakdown, paymentsToday section, and advance dedup.
        // We fetch a 1-year window so historical daily reports correctly show
        // payments that were made on old invoices that are now fully paid.
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

        const { data: recentInvoices, error: invoicesError } = await supabase
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
                payments,
                status,
                vehicle_id,
                customer_id,
                vehicle:customer_vehicles(id, year, make, model, license_plate),
                customer:customers(id, customer_name)
            `)
            .eq("shop_id", shopId)
            .in("status", ["paid", "partially_paid"])
            .or(`paid_date.is.null,paid_date.gte.${oneYearAgo}`);

        if (invoicesError) {
            console.error("Error fetching invoices for daily report:", invoicesError);
            throw invoicesError;
        }

        // Filter to invoices that have at least one payment on targetDate
        const invoicesWithPaymentsToday = (recentInvoices || []).filter((inv: any) =>
            ((inv.payments as any[]) || []).some(
                (p: any) => !p.deleted && p.payment_date?.slice(0, 10) === targetDate
            )
        );

        // Work order IDs that have been invoiced — advance payments for these are already
        // captured in the invoice's payments[] array (merged at invoice creation), so we
        // must not double-count them from work_order.advance_payments.
        const workOrderIdsWithInvoice = new Set(
            (recentInvoices || []).map((inv: any) => inv.work_order_id).filter(Boolean)
        );

        // ── Advance payments (work orders without invoices only) ─────────────────
        const { data: workOrdersWithAdvance, error: advanceError } = await supabase
            .from("work_orders")
            .select("id, advance_payments")
            .eq("shop_id", shopId);

        if (advanceError) {
            console.error("Error fetching work orders for advance payments:", advanceError);
        }

        let advancePaymentsTotal = 0;
        const advancePaymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
        (workOrdersWithAdvance || []).forEach((wo) => {
            if (workOrderIdsWithInvoice.has(wo.id)) return; // already captured via invoice
            const payments = (wo.advance_payments as any[] | null) || [];
            payments.forEach((p: any) => {
                if (p.deleted) return;
                if (p.payment_date?.slice(0, 10) !== targetDate) return;
                const amount = Number(p.amount) || 0;
                advancePaymentsTotal += amount;
                const method = p.payment_method || "other";
                if (!advancePaymentMethodBreakdown[method]) {
                    advancePaymentMethodBreakdown[method] = { count: 0, amount: 0 };
                }
                advancePaymentMethodBreakdown[method].count += 1;
                advancePaymentMethodBreakdown[method].amount += amount;
            });
        });

        // ── Revenue + payment method breakdown ───────────────────────────────────
        // Sum only payments received on targetDate (by payment_date) so that
        // totalRevenue always matches the payment method breakdown total.
        let invoiceRevenue = 0;
        const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};

        invoicesWithPaymentsToday.forEach((inv: any) => {
            const payments = inv.payments as any[] | null;
            if (payments && Array.isArray(payments) && payments.length > 0) {
                payments.forEach((payment: any) => {
                    if (payment.deleted) return;
                    if (payment.payment_date?.slice(0, 10) !== targetDate) return;
                    const amount = Number(payment.amount) || 0;
                    invoiceRevenue += amount;
                    const method = payment.payment_method || "other";
                    if (!paymentMethodBreakdown[method]) {
                        paymentMethodBreakdown[method] = { count: 0, amount: 0 };
                    }
                    paymentMethodBreakdown[method].count += 1;
                    paymentMethodBreakdown[method].amount += amount;
                });
            } else {
                // Legacy fallback: no payments array — use invoice-level fields
                const method = inv.payment_method || "other";
                if (!paymentMethodBreakdown[method]) {
                    paymentMethodBreakdown[method] = { count: 0, amount: 0 };
                }
                paymentMethodBreakdown[method].count += 1;
                paymentMethodBreakdown[method].amount += Number(inv.total_amount) || 0;
                invoiceRevenue += Number(inv.total_amount) || 0;
            }
        });

        // Merge advance payment breakdown
        Object.entries(advancePaymentMethodBreakdown).forEach(([method, data]) => {
            if (!paymentMethodBreakdown[method]) {
                paymentMethodBreakdown[method] = { count: 0, amount: 0 };
            }
            paymentMethodBreakdown[method].count += data.count;
            paymentMethodBreakdown[method].amount += data.amount;
        });

        // ── Credits/refunds ──────────────────────────────────────────────────────
        const { data: creditsRefundsData } = await supabase
            .from("credits_refunds")
            .select("amount")
            .eq("shop_id", shopId)
            .in("status", ["processed", "reconciled"])
            .eq("refund_date", targetDate)
            .or("archived.eq.false,archived.is.null");

        const creditsRefundsTotal = (creditsRefundsData || []).reduce(
            (sum, c) => sum + Number(c.amount || 0),
            0
        );

        const totalRevenue = invoiceRevenue + advancePaymentsTotal;

        // Tax/subtotal: only from invoices fully paid that have payments today
        const totalTax = invoicesWithPaymentsToday
            .filter((inv: any) => inv.status === "paid")
            .reduce((sum: number, inv: any) => sum + (Number(inv.tax_amount) || 0), 0);
        const totalSubtotal = invoicesWithPaymentsToday
            .filter((inv: any) => inv.status === "paid")
            .reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);

        // ── Payments Received section ─────────────────────────────────────────────
        // One row per invoice that had a payment on targetDate.
        // Shows only the payments from targetDate (not all historical payments).
        const paymentsToday = invoicesWithPaymentsToday.map((inv: any) => {
            const vehicle = Array.isArray(inv.vehicle) ? inv.vehicle[0] : inv.vehicle;
            const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;

            const todaysPayments = ((inv.payments as any[]) || [])
                .filter((p: any) => !p.deleted && p.payment_date?.slice(0, 10) === targetDate)
                .map((p: any) => ({
                    amount: Number(p.amount) || 0,
                    payment_method: p.payment_method || "other",
                    payment_date: p.payment_date ?? null,
                }));

            return {
                invoice_id: inv.id,
                invoice_number: inv.invoice_number,
                invoice_status: inv.status,
                invoice_total: Number(inv.total_amount),
                work_order_id: inv.work_order_id ?? null,
                description: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Unknown",
                license_plate: vehicle?.license_plate ?? null,
                customer_name: (customer as { customer_name?: string } | null)?.customer_name || "Unknown",
                payments: todaysPayments,
            };
        });

        // ── Payment method breakdown formatting ───────────────────────────────────
        const breakdownTotal = Object.values(paymentMethodBreakdown).reduce((sum, d) => sum + d.amount, 0);
        const paymentMethods = Object.entries(paymentMethodBreakdown).map(([method, data]) => ({
            method,
            label: formatPaymentMethodLabel(method),
            count: data.count,
            amount: data.amount,
            percentage: breakdownTotal > 0 ? (data.amount / breakdownTotal) * 100 : 0,
        })).sort((a, b) => b.amount - a.amount);

        return NextResponse.json({
            date: targetDate,
            summary: {
                carsCount,
                workOrdersCompletedCount,
                invoicesCount: invoicesWithPaymentsToday.length,
                totalRevenue,
                totalSubtotal,
                totalTax,
                advancePaymentsTotal,
                creditsRefundsTotal,
            },
            paymentMethods,
            paymentsToday,
        }, { status: 200 });

    } catch (err: any) {
        console.error("Error in daily report:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function formatPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
        credit_card: "Credit Card",
        debit_card: "Debit Card",
        debit: "Debit",
        cash: "Cash",
        check: "Check",
        bank_transfer: "Bank Transfer",
        e_transfer: "E-Transfer",
        other: "Other",
    };
    return labels[method] || method.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
