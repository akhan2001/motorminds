import { supabase } from '@/lib/supabase';
import { ImmediateInsights, LongTermInsights } from '../types/MiaInsights';

/**
 * Adds insights to the mia_customer_insights table
 */
export async function addToMiaCustomerInsights(
    workOrderId: string,
    shopId: string,
    insights: ImmediateInsights | LongTermInsights
) {
    try {
        // First, get the customer_id from the work order
        const { data: workOrderData, error: workOrderError } = await supabase
            .from('repair_orders')
            .select('customer_id, vehicle_id')
            .eq('id', workOrderId)
            .single();

        if (workOrderError || !workOrderData) {
            console.error('Error fetching work order data:', workOrderError);
            return { 
                success: false, 
                error: 'Failed to fetch customer ID from work order'
            };
        }

        // Insert the insights into mia_customer_insights
        const { data, error } = await supabase
            .from('mia_customer_insights')
            .insert({
                customer_id: workOrderData.customer_id,
                vehicle_id: workOrderData.vehicle_id,
                shop_id: shopId,
                repair_order_id: workOrderId,
                analysis: insights,
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding to mia_customer_insights:', error);
            return {
                success: false,
                error: 'Failed to insert insights'
            };
        }

        return {
            success: true,
            data
        };
    } catch (error) {
        console.error('Error in addToMiaCustomerInsights:', error);
        return {
            success: false,
            error: 'An unexpected error occurred'
        };
    }
}
