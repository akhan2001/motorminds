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
        // ── Completed work orders (for Cars Serviced count) ─────────────────
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
        }

        // Fetch invoices linked to the completed work orders (regardless of paid_date)
        const completedWoIds = (completedWorkOrders || []).map(wo => wo.id).filter(Boolean);
        let workOrderInvoiceMap: Record<string, { id: string; invoice_number: string | null; total_amount: number; payments: any[] | null; payment_method: string | null; status: string }> = {};

        if (completedWoIds.length > 0) {
            const { data: woInvoices } = await supabase
                .from("invoices_table")
                .select("work_order_id, id, invoice_number, total_amount, payments, payment_method, status")
                .eq("shop_id", shopId)
                .in("work_order_id", completedWoIds);

            (woInvoices || []).forEach((inv: any) => {
                if (inv.work_order_id) workOrderInvoiceMap[inv.work_order_id] = inv;
            });
        }

        const uniqueVehicleIds = new Set<string>();
        (completedWorkOrders || []).forEach(wo => {
            if (wo.vehicle_id) uniqueVehicleIds.add(wo.vehicle_id);
        });
        const carsCount = uniqueVehicleIds.size;
        const workOrdersCompletedCount = (completedWorkOrders || []).length;

        // ── Paid invoices for the day (by paid_date — database-level filter) ──
        const { data: invoices, error: invoicesError } = await supabase
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
            .eq("status", "paid")
            .gte("paid_date", startOfDay)
            .lte("paid_date", endOfDay);

        if (invoicesError) {
            console.error("Error fetching invoices for daily report:", invoicesError);
            throw invoicesError;
        }

        // Work order IDs that already contributed revenue via a paid invoice on this day.
        // Exclude their advance payments to avoid double-counting.
        const workOrderIdsWithPaidInvoiceInDay = new Set(
            (invoices || []).map((inv: any) => inv.work_order_id).filter(Boolean)
        );

        // ── Advance payments (work orders without paid invoices today) ───────
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
            if (workOrderIdsWithPaidInvoiceInDay.has(wo.id)) return;
            const payments = (wo.advance_payments as any[] | null) || [];
            payments.forEach((p: any) => {
                if (p.deleted) return;
                const paymentDateStr = p.payment_date ? p.payment_date.slice(0, 10) : "";
                if (paymentDateStr === targetDate) {
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

        // ── Revenue + payment method breakdown ───────────────────────────────
        let invoiceRevenue = 0;
        const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};

        (invoices || []).forEach((inv: any) => {
            const payments = inv.payments as any[] | null;
            if (payments && Array.isArray(payments) && payments.length > 0) {
                payments.forEach((payment: any) => {
                    if (payment.deleted) return;
                    const paymentDateStr = payment.payment_date ? payment.payment_date.slice(0, 10) : "";
                    if (paymentDateStr !== targetDate) return;
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
                // Legacy fallback: no payments array — invoice is already filtered by paid_date
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

        // ── Credits/refunds ──────────────────────────────────────────────────
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

        // ── Invoice refunds issued on targetDate ─────────────────────────────
        const { data: invoicesWithRefunds } = await supabase
            .from("invoices_table")
            .select("id, refunds")
            .eq("shop_id", shopId);

        let invoiceRefundsTotal = 0;
        (invoicesWithRefunds || []).forEach((inv: any) => {
            ((inv.refunds as any[]) || []).forEach((r: any) => {
                if (r.deleted) return;
                if (r.refund_date?.slice(0, 10) !== targetDate) return;
                invoiceRefundsTotal += Number(r.amount) || 0;
            });
        });

        const totalRevenue = invoiceRevenue + advancePaymentsTotal;

        const totalTax = (invoices || []).reduce(
            (sum: number, inv: any) => sum + (Number(inv.tax_amount) || 0),
            0
        );
        const totalSubtotal = (invoices || []).reduce(
            (sum: number, inv: any) => sum + (Number(inv.subtotal) || 0),
            0
        );

        // ── Payments Received section ─────────────────────────────────────────
        // One row per completed work order with its linked invoice.
        const paymentsToday = (completedWorkOrders || []).map((wo: any) => {
            const vehicle = Array.isArray(wo.vehicle) ? wo.vehicle[0] : wo.vehicle;
            const customer = Array.isArray(wo.customer) ? wo.customer[0] : wo.customer;
            const invoice = workOrderInvoiceMap[wo.id] ?? null;

            // Build payments list from invoice
            const invoicePayments = invoice
                ? ((invoice.payments as any[] | null) || [])
                    .filter((p: any) => !p.deleted)
                    .map((p: any) => ({
                        amount: Number(p.amount) || 0,
                        payment_method: p.payment_method || "other",
                        payment_date: p.payment_date ?? null,
                    }))
                : [];

            // Fallback: if no payments array but legacy payment_method exists
            if (invoice && invoicePayments.length === 0 && invoice.payment_method) {
                invoicePayments.push({
                    amount: Number(invoice.total_amount) || 0,
                    payment_method: invoice.payment_method,
                    payment_date: null,
                });
            }

            return {
                invoice_id: invoice?.id ?? null,
                invoice_number: invoice?.invoice_number ?? null,
                invoice_status: invoice?.status ?? null,
                invoice_total: invoice ? Number(invoice.total_amount) : null,
                work_order_id: wo.id,
                description: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Unknown",
                license_plate: vehicle?.license_plate ?? null,
                customer_name: (customer as { customer_name?: string } | null)?.customer_name || "Unknown",
                payments: invoicePayments,
            };
        }).filter((v: any) => v.description !== "Unknown" || v.invoice_id);

        // ── Payment method breakdown formatting ───────────────────────────────
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
                invoicesCount: (invoices || []).length,
                totalRevenue,
                totalSubtotal,
                totalTax,
                advancePaymentsTotal,
                creditsRefundsTotal,
                invoiceRefundsTotal,
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
