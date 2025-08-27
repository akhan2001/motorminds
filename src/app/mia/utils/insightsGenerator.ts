import { supabase } from '@/lib/supabase';
import { ImmediateInsights, LongTermInsights, InsightsResponse } from '../types/MiaInsights';
import { addToMiaCustomerInsights } from './miaCustomerInsightsUtil';

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

        const response = await fetch(`/api/mia-insights/immediate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                workOrderData: workOrder,
                shopId: shopId 
            }),
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

        if (result.success && result.insights) {
            // Instead of updating repair_order_details, call the function that handles the upsert
            await generateImmediateAnalysis(workOrder, '');
        }

        return result;
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
        // Validate required data
        if (!workOrderData?.shop_id) {
            console.error('Missing shop_id in workOrderData:', workOrderData);
            return {
                success: false,
                error: 'Shop ID is required'
            };
        }

        // Call the API to generate the immediate insights
        const response = await fetch('/api/mia-insights/immediate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                workOrderData: workOrderData,
                shopId: workOrderData.shop_id
            }),
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

        console.log('Insights generation result:', result);
        
        const insights = result.insights as ImmediateInsights;
        
        // Calculate priority based on the insights
        let priority = 'medium';
        const hasUrgentFlag = insights.flags?.some(flag => flag.type === 'urgent') || false;
        const hasHighPriority = insights.upsell_suggestions?.some(sugg => sugg.priority === 'high') || false;
        
        if (hasUrgentFlag || hasHighPriority) {
            priority = 'high';
        }
        
        // First, check if the record exists
        let recordExists = false;
        
        if (miaCustomerInsightId) {
            // Check if the specific insight exists
            const { data: existingInsight, error: checkError } = await supabase
                .from('mia_customer_insights')
                .select('id')
                .eq('id', miaCustomerInsightId)
                .maybeSingle();
                
            recordExists = !!existingInsight;
            console.log("Checking insight by ID:", miaCustomerInsightId, "exists:", recordExists);
        } else if (workOrderData?.id) {
            // Check if insight exists for this repair order
            const { data: existingInsight, error: checkError } = await supabase
                .from('mia_customer_insights')
                .select('id')
                .eq('repair_order_id', workOrderData.id)
                .maybeSingle();
                
            recordExists = !!existingInsight;
            console.log("Checking insight by repair_order_id:", workOrderData.id, "exists:", recordExists);
        }
        
        if (recordExists) {
            // Update existing record
            const updateData = {
                analysis: insights,
                summary: insights.summary,
                priority: priority,
                updated_at: new Date().toISOString()
            };
            
            let updateResult;
            
            if (miaCustomerInsightId) {
                // Update by insight ID
                const { data, error: updateError } = await supabase
                    .from('mia_customer_insights')
                    .update(updateData)
                    .eq('id', miaCustomerInsightId)
                    .select()
                    .single();
                updateResult = { data, error: updateError };
            } else {
                // Update by repair order ID
                const { data, error: updateError } = await supabase
                    .from('mia_customer_insights')
                    .update(updateData)
                    .eq('repair_order_id', workOrderData.id)
                    .select()
                    .single();
                updateResult = { data, error: updateError };
            }
            
            if (updateResult.error) {
                console.error("Error updating Mia customer insight:", updateResult.error);
                return { success: false, error: updateResult.error.message };
            }
            return { success: true, data: updateResult.data };

        } else {
            // Create new record
            
            const vehicleId = workOrderData.vehicle_id || workOrderData.customers?.customer_vehicles?.[0]?.id;
            
            if (!workOrderData.customer_id) {
                return { success: false, error: "Customer ID is missing from the work order data." };
            }
            if (!vehicleId) {
                return { success: false, error: "Vehicle ID is missing and no vehicles are associated with the customer." };
            }

            const { data: newInsight, error: insertError } = await supabase
                .from('mia_customer_insights')
                .insert({
                    shop_id: workOrderData.shop_id,
                    customer_id: workOrderData.customer_id,
                    vehicle_id: vehicleId,
                    repair_order_id: workOrderData.id,
                    analysis: insights,
                    summary: insights.summary,
                    priority: priority,
                })
                .select()
                .single();
                
            if (insertError) {
                console.error("Error creating Mia customer insight:", insertError);
                return { success: false, error: insertError.message };
            }
            return { success: true, data: newInsight };
        }
    } catch (error: any) {
        console.error('Error in generateImmediateAnalysis:', error);
        return {
            success: false,
            error: error.message || 'Failed to process insights request'
        };
    }
}
