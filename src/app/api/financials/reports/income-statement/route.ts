import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    calculateTotalCOGS,
    aggregateRevenueBreakdown,
    generateRevenueDetails,
    type InvoiceTableRecord
} from '../../_utils/invoice-calculations';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const shopId = searchParams.get('shopId');

    if (!startDate || !endDate || !shopId) {
        return new NextResponse('Missing required query parameters: startDate, endDate, shopId', { status: 400 });
    }

    try {
        // Fetch revenue data from invoices_table (new structure)
        // Only get paid invoices within the date range
        const { data: revenueData, error: revenueError } = await supabase
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
            .eq('status', 'paid')
            .gte('paid_date', startDate)
            .lte('paid_date', endDate);

        if (revenueError) throw revenueError;

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

        // Cast revenue data to typed records
        const typedRevenueData = (revenueData || []) as InvoiceTableRecord[];

        // Calculate revenue breakdown using actual granular totals from invoices_table
        const revenueBreakdown = aggregateRevenueBreakdown(typedRevenueData);
        const totalRevenue = revenueBreakdown.totalRevenue;

        // Generate detailed revenue info
        const revenueDetails = generateRevenueDetails(typedRevenueData);

        // Calculate COGS from invoice_items (parts with unit_cost)
        const cogsBreakdown = calculateTotalCOGS(typedRevenueData);
        const totalCOGS = cogsBreakdown.totalCOGS;
        const cogsDetails = cogsBreakdown.details.map(item => ({
            item_name: item.description,
            quantity: item.quantity,
            unit_cost: item.unitCost,
            total_cost: item.totalCost,
            part_number: item.partNumber,
            supplier: item.supplier
        }));
        
        // Gross Profit = Revenue - COGS
        const grossProfit = totalRevenue - totalCOGS;

        // Calculate total operating expenses
        const totalOneTimeCosts = (oneTimeCosts || []).reduce((acc, item) => acc + (item.amount || 0), 0);
        
        // Prorate fixed costs based on frequency for the date range
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const totalFixedCosts = (fixedCosts || []).reduce((acc, cost) => {
            if (!cost.start_date) return acc;
            
            const costStartDate = new Date(cost.start_date);
            if (costStartDate > endDateObj) return acc; // Cost hasn't started yet
            
            let occurrences = 0;
            let currentDate = new Date(costStartDate);
            
            while (currentDate <= endDateObj) {
                if (currentDate >= startDateObj) {
                    occurrences++;
                }
                
                // Advance based on frequency
                switch (cost.frequency) {
                    case 'daily': currentDate.setDate(currentDate.getDate() + 1); break;
                    case 'weekly': currentDate.setDate(currentDate.getDate() + 7); break;
                    case 'monthly': currentDate.setMonth(currentDate.getMonth() + 1); break;
                    case 'quarterly': currentDate.setMonth(currentDate.getMonth() + 3); break;
                    case 'yearly': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
                    default: currentDate = new Date(endDateObj.getTime() + 1); break;
                }
            }
            
            return acc + ((cost.amount || 0) * occurrences);
        }, 0);
        
        const totalOperatingExpenses = totalOneTimeCosts + totalFixedCosts;

        const operatingExpenseDetails = [
            ...(oneTimeCosts || []).map(item => ({ 
                category: item.category || 'Expense', 
                cost_name: item.cost_name, 
                total_amount: item.amount 
            })),
            ...(fixedCosts || []).map(item => ({ 
                category: item.category || 'Fixed Cost', 
                cost_name: item.cost_name, 
                total_amount: item.amount 
            }))
        ];
        
        // Net Profit = Gross Profit - Operating Expenses
        const netProfit = grossProfit - totalOperatingExpenses;

        // Use actual granular totals instead of regex guessing
        const totalPartsRevenue = revenueBreakdown.partsRevenue;
        const totalLaborRevenue = revenueBreakdown.laborRevenue;
        const totalServicesRevenue = revenueBreakdown.servicesRevenue;
        const totalFeesRevenue = revenueBreakdown.feesRevenue;

        // Persist a summary row in financial_statements for historical reporting
        try {
            const statementData = {
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
            };

            const { data: upsertData, error: upsertError } = await supabase
                .from('financial_statements')
                .upsert(statementData, { onConflict: 'shop_id,statement_type,period_start_date' })
                .select('id')
                .single();

            if (upsertError) {
                console.error('Failed to upsert financial statement:', upsertError);
                // Don't throw here, we can still return the generated statement
            }

            const statementId = upsertData?.id ?? null;

            return NextResponse.json({
                statementId,
                totalRevenue,
                totalCOGS,
                grossProfit,
                totalOperatingExpenses,
                netProfit,
                // Granular revenue breakdown
                totalPartsRevenue,
                totalLaborRevenue,
                totalServicesRevenue,
                totalFeesRevenue,
                // Tax and discount info
                totalTaxAmount: revenueBreakdown.taxAmount,
                totalDiscountAmount: revenueBreakdown.discountAmount,
                totalSubtotal: revenueBreakdown.subtotal,
                // Details
                revenueDetails,
                cogsDetails,
                operatingExpenseDetails,
                // Meta
                startDate,
                endDate,
                invoiceCount: typedRevenueData.length
            });

        } catch (err) {
            console.error('Error during financial statement persistence:', err);
            // Even if persistence fails, return the statement data
            return NextResponse.json({
                statementId: null,
                totalRevenue,
                totalCOGS,
                grossProfit,
                totalOperatingExpenses,
                netProfit,
                totalPartsRevenue,
                totalLaborRevenue,
                totalServicesRevenue,
                totalFeesRevenue,
                totalTaxAmount: revenueBreakdown.taxAmount,
                totalDiscountAmount: revenueBreakdown.discountAmount,
                totalSubtotal: revenueBreakdown.subtotal,
                revenueDetails,
                cogsDetails,
                operatingExpenseDetails,
                startDate,
                endDate,
                invoiceCount: typedRevenueData.length
            });
        }

    } catch (error) {
        console.error('Error generating income statement:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
