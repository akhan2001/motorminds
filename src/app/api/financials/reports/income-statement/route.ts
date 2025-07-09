import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies as getCookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    // Ensure we are using the async cookies() API correctly
    const cookieStore = await getCookies();
    // Cast to any to align with expected helper types (runtime safe)
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any });
    
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const shopId = searchParams.get('shopId');

    if (!startDate || !endDate || !shopId) {
        return new NextResponse('Missing required query parameters: startDate, endDate, shopId', { status: 400 });
    }

    try {
        // Fetch revenue data from invoices
        const { data: revenueData, error: revenueError } = await supabase
            .from('invoices')
            .select('invoice_number, amount, description, paid_at')
            .eq('shop_id', shopId)
            .gte('paid_at', startDate)
            .lte('paid_at', endDate);

        if (revenueError) throw revenueError;

        // Fetch Cost of Goods Sold data (COGS)
        const { data: cogsData, error: cogsError } = await supabase
            .from('cost_of_goods_sold')
            .select('item_name, item_cost, quantity')
            .eq('shop_id', shopId)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (cogsError) throw cogsError;

        // Fetch operating expenses from one_time_costs and fixed_costs tables
        const { data: oneTimeCosts, error: oneTimeCostsError } = await supabase
            .from('one_time_costs')
            .select('category, amount, cost_name, cost_date')
            .eq('shop_id', shopId)
            .gte('cost_date', startDate)
            .lte('cost_date', endDate);

        if (oneTimeCostsError) throw oneTimeCostsError;

        const { data: fixedCosts, error: fixedCostsError } = await supabase
            .from('fixed_costs')
            .select('cost_name, amount, category, frequency, start_date')
            .eq('shop_id', shopId);
        
        if (fixedCostsError) throw fixedCostsError;

        // Calculate total revenue
        const totalRevenue = revenueData.reduce((acc, item) => acc + item.amount, 0);
        const revenueDetails = revenueData.map(item => ({
            description: item.description || `Invoice #${item.invoice_number}`,
            total_amount: item.amount,
        }));

        // Calculate total COGS
        const totalCOGS = cogsData.reduce((acc, item) => acc + (item.item_cost * (item.quantity || 1)), 0);
        const cogsDetails = cogsData.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity,
            total_cost: item.item_cost * (item.quantity || 1),
        }));
        
        // Gross Profit
        const grossProfit = totalRevenue - totalCOGS;

        // Calculate total operating expenses
        const totalOneTimeCosts = oneTimeCosts.reduce((acc, item) => acc + item.amount, 0);
        // For now, sum the defined "amount" for each fixed cost. In a future enhancement, we can
        // prorate based on frequency and date range similar to the efficiency endpoint.
        const totalFixedCosts = fixedCosts.reduce((acc, item) => acc + (item.amount || 0), 0);
        const totalOperatingExpenses = totalOneTimeCosts + totalFixedCosts;

        const operatingExpenseDetails = [
            ...oneTimeCosts.map(item => ({ category: item.category || 'One-time Cost', cost_name: item.cost_name, total_amount: item.amount })),
            ...fixedCosts.map(item => ({ category: item.category || 'Fixed Cost', cost_name: item.cost_name, total_amount: item.amount }))
        ];
        
        // Net Profit
        const netProfit = grossProfit - totalOperatingExpenses;

        // Derive parts vs labor revenue (basic heuristic)
        const totalPartsRevenue = revenueDetails
            .filter((item) => /part/i.test(item.description))
            .reduce((acc, item) => acc + item.total_amount, 0);

        const totalLaborRevenue = revenueDetails
            .filter((item) => /labor|service/i.test(item.description))
            .reduce((acc, item) => acc + item.total_amount, 0);

        // Persist a summary row in financial_statements for historical reporting
        try {
            const { data: insertData, error: insertError } = await supabase
                .from('financial_statements')
                .insert({
                    shop_id: shopId,
                    statement_type: 'income_statement',
                    period_start_date: startDate,
                    period_end_date: endDate,
                    total_revenue: totalRevenue,
                    total_cogs: totalCOGS,
                    total_fixed_costs: totalFixedCosts,
                    gross_profit: grossProfit,
                    net_profit: netProfit,
                    generated_at: new Date().toISOString(),
                    total_parts_revenue: totalPartsRevenue,
                    total_labor_revenue: totalLaborRevenue,
                })
                .select('id')
                .single();

            if (insertError) {
                console.error('Failed to insert financial statement:', insertError);
            }

            const statementId = insertData?.id ?? null;

            return NextResponse.json({
                statementId,
                totalRevenue,
                totalCOGS,
                grossProfit,
                totalOperatingExpenses,
                netProfit,
                totalPartsRevenue,
                totalLaborRevenue,
                revenueDetails,
                cogsDetails,
                operatingExpenseDetails,
                startDate,
                endDate
            });

        } catch (err) {
            console.error('Error inserting financial statement:', err);
            // Even if insertion fails, return the statement data
            return NextResponse.json({
                statementId: null,
                totalRevenue,
                totalCOGS,
                grossProfit,
                totalOperatingExpenses,
                netProfit,
                totalPartsRevenue,
                totalLaborRevenue,
                revenueDetails,
                cogsDetails,
                operatingExpenseDetails,
                startDate,
                endDate
            });
        }

    } catch (error) {
        console.error('Error generating income statement:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 