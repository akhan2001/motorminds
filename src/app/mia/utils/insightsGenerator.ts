import { supabase } from '@/lib/supabase';
import { ImmediateInsights, LongTermInsights, InsightsResponse } from '../types/MiaInsights';
import { addToMiaCustomerInsights } from './miaCustomerInsightsUtil';

/**
 * Generates Mia insights for a specific work order
 */
export async function generateMiaInsights(workOrderId: string, shopId: string, term: string) {
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
        const response = await fetch(`/api/mia-insights/${term}`, {
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
            let insightsTableResult;
            if (term === 'immediate') {
                insightsTableResult = await addToMiaCustomerInsights(
                    workOrderId,
                    shopId,
                    result.insights as ImmediateInsights
                );
            } else {
                insightsTableResult = await addToMiaCustomerInsights(
                    workOrderId,
                    shopId,
                    result.insights as LongTermInsights
                );
            }

            // 3. Add ID to insights_ids[] in repair_order_details table
            const { data: currentDetails, error: fetchError } = await supabase
                .from('repair_order_details')
                .select('insights_ids')
                .eq('repair_order_id', workOrderId)
                .single();

            if (fetchError) {
                console.error('Error fetching current insights_ids:', fetchError);
            } else {
                // Append the new ID to the existing array (or create a new array if null)
                const currentIds = currentDetails.insights_ids || [];
                
                // Only add if not already in the array
                if (!currentIds.includes(insightsTableResult.data?.id)) {
                    const { error: updateError } = await supabase
                        .from('repair_order_details')
                        .update({
                            insights_ids: [...currentIds, insightsTableResult.data?.id]
                        })
                        .eq('repair_order_id', workOrderId);
                        
                    if (updateError) {
                        console.error('Error updating insights_ids array:', updateError);
                    }
                }
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
export async function getOrGenerateMiaInsights(workOrderId: string, shopId: string, term: string): Promise<InsightsResponse> {
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
        return generateMiaInsights(workOrderId, shopId, term);
    } catch (error) {
        console.error('Error in getOrGenerateMiaInsights:', error);
        return {
            success: false,
            error: 'Failed to retrieve or generate insights'
        };
    }
}

export async function generateImmediateAnalysis(workOrderData: any, miaCustomerInsightId: string) {
    try {
        // Call the API to generate the immediate insights
        const response = await fetch('/api/mia-insights/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ workOrderData: workOrderData }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from insights API:', errorText);
            return {
                success: false,
                error: 'Failed to generate insights'
            };
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to generate insights');
        }

        console.log(result);
        
        const insights = result.insights as ImmediateInsights;
        
        // Calculate priority based on the insights
        let priority = 'medium';
        const hasUrgentFlag = insights.flags.some(flag => flag.type === 'urgent');
        const hasHighPriority = insights.upsell_suggestions.some(sugg => sugg.priority === 'high');
        
        if (hasUrgentFlag || hasHighPriority) {
            priority = 'high';
        }
        
        // Update the mia_customer_insights table with the new analysis
        if (miaCustomerInsightId) {
            const { error: updateError } = await supabase
                .from('mia_customer_insights')
                .update({
                    analysis: insights,
                    summary: insights.summary,
                    priority: priority,
                    updated_at: new Date().toISOString()
                })
                .eq('id', miaCustomerInsightId);
            
            console.log("Updated mia_customer_insights by id", miaCustomerInsightId);
                
            if (updateError) {
                console.error('Error updating mia_customer_insights:', updateError);
                throw new Error('Failed to update insights in database');
            }
        } else if (workOrderData) {
            // If no miaCustomerInsightId was provided but we have workOrderData,
            // try to find and update the record by repair_order_id
            const { error: updateError } = await supabase
                .from('mia_customer_insights')
                .update({
                    analysis: insights,
                    summary: insights.summary,
                    priority: priority,
                    updated_at: new Date().toISOString()
                })
                .eq('repair_order_id', workOrderData.id);
            
            console.log("Updated mia_customer_insights by repair_order_id", workOrderData.id);
                
            if (updateError) {
                console.error('Error updating mia_customer_insights by repair_order_id:', updateError);
                throw new Error('Failed to update insights in database');
            }
        }

        return {
            success: true,
            insights
        };
    } catch (error) {
        console.error('Error in generateImmediateAnalysis:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate insights'
        };
    }
}
