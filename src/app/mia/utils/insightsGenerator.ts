import { supabase } from '@/lib/supabase';
import { ImmediateInsights, InsightsResponse } from '../types/MiaInsights';
import { addToMiaCustomerInsights } from './miaCustomerInsightsUtil';

/**
 * Generates Mia insights for a specific work order
 */
export async function generateMiaInsights(workOrderId: string, shopId: string) {
    try {
        // Step 1: Fetch the work order data
        const { data: workOrder, error: workOrderError } = await supabase
            .from('repair_orders')
            .select(`
                *,
                repair_order_details(*),
                customers(
                    *,
                    customer_vehicles(*)
                )
            `)
            .eq('id', workOrderId)
            .eq('shop_id', shopId)
            .single();

        if (workOrderError || !workOrder) {
            console.error('Error fetching work order:', workOrderError);
            return {
                success: false,
                error: 'Unable to fetch work order data'
            };
        }

        // Step 2: Call the insights API
        const response = await fetch('/api/mia-insights/immediate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ workOrderData: workOrder }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from insights API:', errorText);
            return {
                success: false,
                error: 'Failed to generate insights'
            };
        }

        const result: InsightsResponse = await response.json();

        // Step 3: Update the repair order with the insights
        if (result.success && result.insights) {
            const { error: updateError } = await supabase
                .from('repair_order_details')
                .update({
                    mia_insights: result.insights,
                    insights_status: 'generated'
                })
                .eq('repair_order_id', workOrderId);

            if (updateError) {
                console.error('Error updating repair order with insights:', updateError);
                return {
                    success: false,
                    error: 'Failed to save insights to database'
                };
            }
            
            // 2. Add to mia_customer_insights table
            const insightsTableResult = await addToMiaCustomerInsights(
                workOrderId,
                shopId,
                result.insights as ImmediateInsights
            );
            
            if (!insightsTableResult.success) {
                console.error('Error adding to mia_customer_insights:', insightsTableResult.error);
                // Continue execution even if this fails
            }
        }

        return result;
    } catch (error) {
        console.error('Error in generateMiaInsights:', error);
        return {
            success: false,
            error: 'Failed to process insights request'
        };
    }
}

/**
 * Gets existing insights or generates new ones
 */
export async function getOrGenerateMiaInsights(workOrderId: string, shopId: string): Promise<InsightsResponse> {
    try {
        // First check if we already have insights
        const { data: existingInsights, error: insightsError } = await supabase
            .from('repair_order_details')
            .select('mia_insights, insights_status')
            .eq('repair_order_id', workOrderId)
            .single();

        // If we have valid insights, return them
        if (!insightsError && existingInsights?.mia_insights && existingInsights?.insights_status === 'generated') {
            return {
                success: true,
                insights: existingInsights.mia_insights as ImmediateInsights
            };
        }

        // Otherwise generate new insights
        return generateMiaInsights(workOrderId, shopId);
    } catch (error) {
        console.error('Error in getOrGenerateMiaInsights:', error);
        return {
            success: false,
            error: 'Failed to retrieve or generate insights'
        };
    }
}
