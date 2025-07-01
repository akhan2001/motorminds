import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// Helper to calculate recurring costs over a period
function calculateTotalRecurringCost(costs: any[], startDate: Date, endDate: Date): number {
    let total = 0;
    const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

    costs.forEach(cost => {
        const costStartDate = new Date(cost.start_date);
        if (costStartDate > endDate) return;

        let ratePerDay = 0;
        switch (cost.frequency) {
            case 'daily':    ratePerDay = cost.amount; break;
            case 'weekly':   ratePerDay = cost.amount / 7; break;
            case 'monthly':  ratePerDay = cost.amount / 30.44; break; // Average days in a month
            case 'quarterly':ratePerDay = cost.amount / 91.31; break; // Average days in a quarter
            case 'yearly':   ratePerDay = cost.amount / 365.25; break; // Account for leap years
        }
        
        const effectiveStartDate = costStartDate > startDate ? costStartDate : startDate;
        const durationInDays = (endDate.getTime() - effectiveStartDate.getTime()) / (1000 * 3600 * 24);
        
        if (durationInDays > 0) {
            total += durationInDays * ratePerDay;
        }
    });

    return total;
}

// GET all active fixed costs for a shop
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');

    if (!shopId) {
        return new NextResponse(JSON.stringify({ error: 'shop_id is required' }), { status: 400 });
    }

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
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // 1. Fetch all relevant data in parallel
        const [
            { data: revenueData, error: revenueError },
            { data: payrollData, error: payrollError },
            { data: fixedCostsData, error: fixedCostsError }
        ] = await Promise.all([
            supabase.from('invoices').select('created_at, amount, parts_cost, labour_cost').eq('shop_id', shopId).gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
            supabase.from('employees').select('salary_or_wage, pay_frequency').eq('shop_id', shopId).is('termination_date', null),
            supabase.from('fixed_costs').select('*').eq('shop_id', shopId)
        ]);
        
        if (revenueError || payrollError || fixedCostsError) {
             throw new Error(revenueError?.message || payrollError?.message || fixedCostsError?.message || "An error occured");
        }

        // 2. Calculate totals
        const totalRevenue = revenueData?.reduce((acc, inv) => acc + inv.amount, 0) ?? 0;
        const totalCogs = revenueData?.reduce((acc, inv) => acc + (inv.parts_cost ?? 0) + (inv.labour_cost ?? 0), 0) ?? 0;
        
        const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        const totalPayroll = payrollData?.reduce((acc, emp) => {
            let dailyRate = 0;
            if (emp.pay_frequency === 'hourly') dailyRate = emp.salary_or_wage * 8; // Assuming 8-hour day
            if (emp.pay_frequency === 'salary') dailyRate = emp.salary_or_wage / 365;
            return acc + (dailyRate * daysInPeriod);
        }, 0) ?? 0;
        
        const totalFixedCosts = calculateTotalRecurringCost(fixedCostsData ?? [], startDate, endDate);
        
        const grossProfit = totalRevenue - totalCogs;
        const netProfit = grossProfit - totalPayroll - totalFixedCosts;

        // 4. Generate historical data for charts
        const historicalData = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayStr = d.toISOString().split('T')[0];
            const dailyRevenue = revenueData?.filter(inv => inv.created_at.startsWith(dayStr)).reduce((acc, inv) => acc + inv.amount, 0) ?? 0;
            const dailyCogs = revenueData?.filter(inv => inv.created_at.startsWith(dayStr)).reduce((acc, inv) => acc + (inv.parts_cost ?? 0) + (inv.labour_cost ?? 0), 0) ?? 0;
            
            const dailyPayroll = payrollData?.reduce((acc, emp) => {
                 let dailyRate = 0;
                 if (emp.pay_frequency === 'hourly') dailyRate = emp.salary_or_wage * 8;
                 if (emp.pay_frequency === 'salary') dailyRate = emp.salary_or_wage / 365;
                 return acc + dailyRate;
            }, 0) ?? 0;
            
            const dailyFixedCosts = calculateTotalRecurringCost(fixedCostsData ?? [], d, d);

            historicalData.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                Revenue: dailyRevenue,
                Costs: dailyCogs + dailyPayroll + dailyFixedCosts,
            });
        }

        // 5. Return comprehensive data object
        return new NextResponse(JSON.stringify({
            totalRevenue,
            totalCogs,
            totalPayroll,
            totalFixedCosts,
            grossProfit,
            netProfit,
            historicalData,
        }), { status: 200 });

    } catch (error: any) {
        console.error('Error calculating efficiency:', error);
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// POST a new fixed cost
export async function POST(req: NextRequest) {
    try {
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