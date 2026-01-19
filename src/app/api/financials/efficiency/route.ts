import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
    calculateCOGS,
    aggregateRevenueBreakdown,
    type InvoiceTableRecord
} from "../_utils/invoice-calculations";

// GET all active fixed costs for a shop, or calculate efficiency metrics with date range
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');

    if (!shopId) {
        return new NextResponse(JSON.stringify({ error: 'shop_id is required' }), { status: 400 });
    }

    // Set default date range to the last 30 days if not provided
    const endDate = endDateStr ? new Date(endDateStr + 'T23:59:59.999Z') : new Date();
    const startDate = startDateStr ? new Date(startDateStr + 'T00:00:00Z') : new Date(new Date().setDate(new Date().getDate() - 30));
    
    // If no date range, just return the list of fixed costs for management
    if (!startDateStr || !endDateStr) {
         const { data, error } = await supabase
            .from('fixed_costs')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching fixed costs:', error);
            return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
        }
        return new NextResponse(JSON.stringify(data), { status: 200 });
    }

    // If date range is provided, calculate full efficiency metrics
    try {
        // 1. Fetch all relevant data in parallel - using invoices_table now
        const [
            { data: revenueData, error: revenueError },
            { data: fixedCostsData, error: fixedCostsError },
            { data: oneTimeCostsData, error: oneTimeCostsError }
        ] = await Promise.all([
            // Use invoices_table with new field names
            supabase
                .from('invoices_table')
                .select(`
                    id,
                    invoice_number,
                    shop_id,
                    status,
                    total_amount,
                    subtotal,
                    tax_amount,
                    discount_amount,
                    labor_total,
                    parts_total,
                    services_total,
                    fees_total,
                    invoice_items,
                    paid_date,
                    created_at
                `)
                .eq('shop_id', shopId)
                .eq('status', 'paid') // lowercase in new table
                .gte('paid_date', startDate.toISOString())
                .lte('paid_date', endDate.toISOString()),
            supabase.from('fixed_costs').select('*').eq('shop_id', shopId),
            supabase.from('one_time_costs').select('*').eq('shop_id', shopId)
        ]);
        
        if (revenueError || fixedCostsError || oneTimeCostsError) {
             throw new Error(revenueError?.message || fixedCostsError?.message || oneTimeCostsError?.message || "An error occured");
        }

        // Cast to typed records
        const typedRevenueData = (revenueData || []) as InvoiceTableRecord[];

        // 2. Calculate totals using new structure
        const revenueBreakdown = aggregateRevenueBreakdown(typedRevenueData);
        const totalRevenue = revenueBreakdown.totalRevenue;
        
        // Calculate Cost of Goods Sold (COGS) from invoice_items
        const totalCogs = typedRevenueData.reduce((acc, invoice) => {
            const cogsBreakdown = calculateCOGS(invoice.invoice_items);
            return acc + cogsBreakdown.totalCOGS;
        }, 0);

        // Generate recurring cost occurrences and calculate total in one go
        const recurringCostOccurrences = (fixedCostsData ?? []).flatMap(cost => {
            const occurrences: any[] = [];
            if (!cost.start_date) return [];
            const costStartDate = new Date(cost.start_date + 'T00:00:00Z');
            let currentDate = new Date(costStartDate);
            while (currentDate <= endDate) {
                if (currentDate >= startDate) {
                    // Each occurrence gets a specific date
                    occurrences.push({ ...cost, date: currentDate.toISOString().split('T')[0] });
                }
                const lastDate = currentDate.getTime();
                switch (cost.frequency) {
                    case 'daily': currentDate.setDate(currentDate.getDate() + 1); break;
                    case 'weekly': currentDate.setDate(currentDate.getDate() + 7); break;
                    case 'monthly': currentDate.setMonth(currentDate.getMonth() + 1); break;
                    case 'quarterly': currentDate.setMonth(currentDate.getMonth() + 3); break;
                    case 'yearly': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
                    default: currentDate = new Date(endDate.getTime() + 1); break;
                }
                if (currentDate.getTime() === lastDate) break;
            }
            return occurrences;
        });
        const totalRecurringCosts = recurringCostOccurrences.reduce((acc, c) => acc + c.amount, 0);

        // Filter one-time costs and calculate total
        const filteredOneTimeCosts = (oneTimeCostsData ?? []).filter(c => {
            const d = new Date(c.cost_date + 'T00:00:00Z');
            return d >= startDate && d <= endDate;
        });
        const totalOneTimeCosts = filteredOneTimeCosts.reduce((acc, c) => acc + c.amount, 0);
        
        const totalOperatingExpenses = totalRecurringCosts + totalOneTimeCosts + totalCogs;
        
        const netProfit = totalRevenue - totalOperatingExpenses;

        // Generate historical data for charts using actual cost occurrences
        const historicalData: Array<{ date: string; Costs: number; Revenue: number }> = [];
        const costsByDate = new Map<string, number>();
        const revenueByDate = new Map<string, number>();

        typedRevenueData.forEach((inv) => {
            if (inv.paid_date) {
                const date = new Date(inv.paid_date).toISOString().split('T')[0];
                const existingRevenue = revenueByDate.get(date) || 0;
                revenueByDate.set(date, existingRevenue + Number(inv.total_amount || 0));
                
                // Add COGS to the daily costs
                const invoiceCogs = calculateCOGS(inv.invoice_items).totalCOGS;

                if (invoiceCogs > 0) {
                    const existingCosts = costsByDate.get(date) || 0;
                    costsByDate.set(date, existingCosts + invoiceCogs);
                }
            }
        });

        recurringCostOccurrences.forEach(cost => {
            const date = cost.date; 
            const existing = costsByDate.get(date) || 0;
            costsByDate.set(date, existing + cost.amount);
        });

        filteredOneTimeCosts.forEach(cost => {
            const date = cost.cost_date;
            const existing = costsByDate.get(date) || 0;
            costsByDate.set(date, existing + cost.amount);
        });

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayStr = d.toISOString().split('T')[0];
            const dailyCosts = costsByDate.get(dayStr) || 0;
            const dailyRevenue = revenueByDate.get(dayStr) || 0;
            historicalData.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                Costs: dailyCosts,
                Revenue: dailyRevenue,
            });
        }

        // 5. Return comprehensive data object with granular revenue breakdown
        return new NextResponse(JSON.stringify({
            totalRevenue,
            totalOperatingExpenses,
            netProfit,
            historicalData,
            // Cost breakdown
            costBreakdown: {
                cogs: totalCogs,
                recurring: totalRecurringCosts,
                oneTime: totalOneTimeCosts,
            },
            // Granular revenue breakdown from invoices_table
            revenueBreakdown: {
                labor: revenueBreakdown.laborRevenue,
                parts: revenueBreakdown.partsRevenue,
                services: revenueBreakdown.servicesRevenue,
                fees: revenueBreakdown.feesRevenue,
                subtotal: revenueBreakdown.subtotal,
                tax: revenueBreakdown.taxAmount,
                discount: revenueBreakdown.discountAmount,
            },
            // Detailed breakdown
            breakdown: {
                revenue: typedRevenueData.map(inv => ({
                    invoice_number: inv.invoice_number,
                    total_amount: inv.total_amount,
                    labor_total: inv.labor_total,
                    parts_total: inv.parts_total,
                    services_total: inv.services_total,
                    fees_total: inv.fees_total,
                    paid_date: inv.paid_date,
                    created_at: inv.created_at,
                    // Include invoice_items for COGS breakdown
                    invoice_items: inv.invoice_items
                })),
                fixedCosts: recurringCostOccurrences,
                oneTimeCosts: filteredOneTimeCosts,
            },
            // Meta
            invoiceCount: typedRevenueData.length,
            dateRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            }
        }), { status: 200 });

    } catch (error: any) {
        console.error("[EFFICIENCY_GET_ERROR]", error);
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST a new fixed cost
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { shop_id, cost_name, amount, frequency, category, start_date } = body;

        if (!shop_id || !cost_name || !amount || !frequency || !category || !start_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("fixed_costs")
            .insert({ shop_id, cost_name, amount, frequency, category, start_date })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// UPDATE an existing fixed cost
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { id, cost_name, amount, frequency, category, start_date } = body;

        if (!id || !cost_name || !amount || !frequency || !category || !start_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("fixed_costs")
            .update({ cost_name, amount, frequency, category, start_date })
            .eq('id', id)
            .select();

        if (error) {
            console.error("Supabase error updating fixed cost:", error);
            return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
        }
        
        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Cost not found or no changes needed" }, { status: 404 });
        }

        return NextResponse.json(data[0], { status: 200 });

    } catch (err: any) {
        console.error("Error in PUT /api/financials/efficiency:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE a fixed cost
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }
        
        const { error } = await supabase
            .from('fixed_costs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting fixed cost:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        return NextResponse.json({ message: "Cost deleted successfully" }, { status: 200 });

    } catch (err: any) {
         return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
