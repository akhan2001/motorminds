import { supabase } from '@/lib/supabase';
import { ImmediateInsights } from '../types/MiaInsights';

/**
 * Adds insights to the mia_customer_insights table
 */
export async function addToMiaCustomerInsights(
    workOrderId: string,
    shopId: string,
    insights: ImmediateInsights,
    timeframe: 'immediate' | 'future' = 'immediate'
) {
    try {
        // 1. Get customer and vehicle IDs from the repair order
        const { data: repairOrder, error: orderError } = await supabase
            .from('repair_orders')
            .select('customer_id, vehicle_id')
            .eq('id', workOrderId)
            .single();

        if (orderError || !repairOrder) {
            console.error('Error fetching repair order for insights table:', orderError);
            return {
                success: false,
                error: 'Unable to get repair order data'
            };
        }

        // 2. Calculate the highest priority from upsell suggestions
        let highestPriority = 'low';
        let totalEstimatedValue = 0;
        
        if (insights.upsell_suggestions && insights.upsell_suggestions.length > 0) {
            // Find highest priority
            if (insights.upsell_suggestions.some(s => s.priority === 'high')) {
                highestPriority = 'high';
            } else if (insights.upsell_suggestions.some(s => s.priority === 'medium')) {
                highestPriority = 'medium';
            }
            
            // Calculate total estimated value
            totalEstimatedValue = insights.upsell_suggestions.reduce(
                (sum, suggestion) => sum + suggestion.estimatedValue, 
                0
            );
        }

        // 3. Insert into mia_customer_insights table
        const { data, error } = await supabase
            .from('mia_customer_insights')
            .insert({
                customer_id: repairOrder.customer_id,
                vehicle_id: repairOrder.vehicle_id,
                shop_id: shopId,
                generated_from: 'mia_ai',
                repair_order_id: workOrderId,
                analysis: insights,
                summary: insights.summary,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                timeframe: timeframe,
                priority: highestPriority,
                status: 'new',
                recommended_follow_up_date: timeframe === 'immediate' 
                    ? new Date().toISOString() 
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later for future
                estimated_value: totalEstimatedValue,
                confidence_score: 0.85 // Default confidence score
            })
            .select()
            .single();

        if (error) {
            console.error('Error inserting into mia_customer_insights:', error);
            return {
                success: false,
                error: 'Failed to save to mia_customer_insights'
            };
        }

        return {
            success: true,
            data,
            message: 'Successfully added to mia_customer_insights'
        };
    } catch (error) {
        console.error('Error in addToMiaCustomerInsights:', error);
        return {
            success: false,
            error: 'Failed to process mia_customer_insights request'
        };
    }
}
