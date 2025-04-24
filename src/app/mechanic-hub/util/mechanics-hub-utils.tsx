import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export async function createWorkOrder(workOrderData: any) {
    const { data, error } = await supabase
        .from("repair_orders")
        .insert(workOrderData)
        .select()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getRepairOrders(shopId: string) {
    const { data, error } = await supabase
        .from("repair_orders")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
    
    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function openRepairOrder(orderId: string) {
    const { data, error } = await supabase
        .from("repair_orders")
        .update({ status: "open" })
        .eq("id", orderId)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

/**
 * Creates a customer retention record with AI-generated insights
 * @param workOrderId The ID of the work order to create retention for
 * @param shopId The shop ID for the retention record
 * @returns The newly created retention record ID or null if creation failed
 */
export async function createCustomerRetention(workOrderId: string, shopId: string) {
    if (!workOrderId || !shopId) {
        console.error("Missing required parameters for customer retention creation");
        return null;
    }
    
    const newRetentionId = uuidv4();
    
    try {
        // First, get the work order details
        const { data: workOrderData, error: workOrderError } = await supabase
            .from("repair_orders")
            .select(`
                *,
                repair_order_details(*),
                customers(*),
                customer_vehicles(*)
            `)
            .eq("id", workOrderId)
            .single();
        
        if (workOrderError || !workOrderData) {
            console.error("Failed to fetch work order data:", workOrderError);
            return null;
        }
        
        const customerId = workOrderData.customer_id;
        const vehicleId = workOrderData.vehicle_id;
        const repairDetails = workOrderData.repair_order_details?.[0] || {};
        
        // Generate AI insights for this work order
        const insightsResponse = await fetch("/mechanic-hub/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{
                    id: '1',
                    role: 'assistant',
                    content: "Analyze this work order for retention opportunities:"
                }],
                work_order_data: workOrderData,
                shop_id: shopId
            })
        });

        // Process AI response
        let insightsData = {};
        let summary = "";
        
        if (insightsResponse.ok) {
            const data = await insightsResponse.json();
            if (data.content) {
                // Parse JSON from AI response
                const jsonMatch = data.content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch && jsonMatch[1]) {
                    insightsData = JSON.parse(jsonMatch[1]);
                    // Get summary text (after the JSON)
                    summary = data.content.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
                }
            }
        }

        // Calculate retention timeframe based on service type
        const taskName = repairDetails.description || '';
        const labor = repairDetails.labour || '';
        const taskPriority = repairDetails.task_priority || '';
        const totalAmount = parseFloat(repairDetails.labour_cost || 0) + parseFloat(repairDetails.parts_cost || 0);

        // Determine appropriate follow-up date
        const followupDate = new Date();
        if (taskName.toLowerCase().includes('oil change') || 
            labor.toLowerCase().includes('oil change')) {
            // Short-term: Oil changes typically need follow-up in 3 months
            followupDate.setMonth(followupDate.getMonth() + 3);
        } else if (taskPriority === 'high' || totalAmount > 500) {
            // Mid-term: Major repairs need quicker follow-up
            followupDate.setMonth(followupDate.getMonth() + 1);
        } else {
            // Long-term: Default follow-up in 6 months
            followupDate.setMonth(followupDate.getMonth() + 6);
        }
        
        // Determine retention timeframe category
        const currentDate = new Date();
        const daysDifference = Math.round((followupDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let timeframe = "long_term"; // Default
        if (daysDifference <= 0) {
            timeframe = "immediate";
        } else if (daysDifference <= 90) { // 3 months
            timeframe = "mid_term";
        }
        
        const customerEmail = workOrderData.customers?.customer_email;
        
        // Create the retention record
        const { data, error: retentionErr } = await supabase
            .from("customer_retention")
            .insert({
                id: newRetentionId,
                shop_id: shopId,
                work_order_id: workOrderId,
                customer_id: customerId,
                vehicle_id: vehicleId,
                
                status: 'pending',
                priority: insightsData.flags?.some((f: any) => f.type === 'urgent') ? 'high' : 'medium',
                timeframe: timeframe,
                
                recommended_followup_date: followupDate.toISOString().split('T')[0],
                next_service_due_date: followupDate.toISOString().split('T')[0],
                
                insights_json: insightsData,
                summary: summary,
                
                // Determine preferred contact method from customer data
                contact_method_preference: customerEmail ? 'email' : 'phone',
            })
            .select()
            .single();
        
        if (retentionErr) {
            console.error("Error creating retention record:", retentionErr);
            return null;
        }
        
        return data;
        
    } catch (error) {
        console.error("Failed to create retention record:", error);
        return null;
    }
}
