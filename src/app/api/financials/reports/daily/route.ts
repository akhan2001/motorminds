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
    const startOfDay = `${targetDate}T00:00:00.000Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    try {
        // Fetch paid invoices for the day
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

        // Count unique vehicles serviced
        const uniqueVehicleIds = new Set<string>();
        (invoices || []).forEach(inv => {
            if (inv.vehicle_id) {
                uniqueVehicleIds.add(inv.vehicle_id);
            }
        });
        const carsCount = uniqueVehicleIds.size;

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

        // Get vehicle details for the report
        const vehiclesServiced = (invoices || [])
            .filter(inv => inv.vehicle)
            .map(inv => ({
                id: inv.vehicle?.id,
                description: inv.vehicle ? `${inv.vehicle.year} ${inv.vehicle.make} ${inv.vehicle.model}` : 'Unknown',
                license_plate: inv.vehicle?.license_plate,
                invoice_number: inv.invoice_number,
                amount: inv.total_amount
            }))
            .filter((v, i, self) => 
                // Remove duplicates by vehicle id
                self.findIndex(x => x.id === v.id) === i
            );

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
