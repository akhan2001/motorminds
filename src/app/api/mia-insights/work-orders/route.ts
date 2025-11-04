import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { ImmediateInsights, InsightsResponse } from '@/app/(features)/ai/mia-insights/types/mia-insights';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Create service role client to bypass RLS for debugging
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to validate the structure of insights
function validateInsights(data: any): data is ImmediateInsights {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.upsell_suggestions)) return false;
    if (!Array.isArray(data.flags)) return false;
    if (typeof data.summary !== 'string') return false;
    if (!data.work_order_analysis || typeof data.work_order_analysis !== 'object') return false;
    
    const analysis = data.work_order_analysis;
    if (typeof analysis.current_work_assessment !== 'string') return false;
    if (!Array.isArray(analysis.related_systems)) return false;
    if (typeof analysis.mileage_considerations !== 'string') return false;
    if (typeof analysis.timing_recommendations !== 'string') return false;
    
    return true;
}


export async function POST(req: Request) {
    try {
        const { workOrderId, shopId } = await req.json();
        
        if (!workOrderId || !shopId) {
            return NextResponse.json(
                { success: false, error: 'Work order ID and shop ID are required' },
                { status: 400 }
            );
        }

        // Check if insights already exist to avoid regeneration
        const { data: existingInsights } = await supabase
            .from('mia_insights')
            .select('id')
            .eq('work_order_id', workOrderId)
            .eq('shop_id', shopId)
            .maybeSingle();

        if (existingInsights) {
            return NextResponse.json({
                success: false,
                error: 'Insights already exist for this work order'
            }, { status: 409 });
        }

        // Get work order data with conditional customer join based on customer_type
        const { data: workOrder, error: workOrderError } = await supabase
            .from('work_orders')
            .select(`
                id,
                work_order_number,
                created_at,
                updated_at,
                started_at,
                completed_at,
                shop_id,
                customer_id,
                vehicle_id,
                appointment_id,
                assigned_technician_id,
                title,
                description,
                status,
                priority,
                attachments,
                tags,
                notes,
                customer_type,
                walk_in_vehicle_info,
                customers(
                    id,
                    customer_name,
                    customer_phone,
                    customer_email,
                    customer_address,
                    customer_vehicles(
                        id,
                        year,
                        make,
                        model,
                        vin,
                        license_plate,
                        color,
                        mileage,
                        engine_type
                    )
                ),
                work_order_items(
                    id,
                    work_order_id,
                    shop_service_id,
                    item_type,
                    description,
                    part_number,
                    quantity,
                    unit_price,
                    total_price,
                    unit_cost,
                    total_cost,
                    supplier,
                    category,
                    warranty_period,
                    notes,
                    labor_hours,
                    technician_id,
                    created_at,
                    completed_at
                )
            `)
            .eq('id', workOrderId)
            .eq('shop_id', shopId)
            .maybeSingle();

        if (workOrderError) {
            console.error('Error fetching work order:', workOrderError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch work order data' },
                { status: 500 }
            );
        }

        if (!workOrder) {
            return NextResponse.json(
                { success: false, error: 'Work order not found' },
                { status: 404 }
            );
        }

        // Extract vehicle and customer info based on customer_type
        let vehicle: any = {};
        let customerName = 'Unknown Customer';
        let customerPhone = '';
        let customerEmail = '';

        if (workOrder.customer_type === 'walk_in') {
            // Use walk_in_vehicle_info for walk-in customers
            vehicle = workOrder.walk_in_vehicle_info || {};
            customerName = 'Walk-in Customer';
        } else {
            // Use customer relationship for registered customers
            const customer = Array.isArray(workOrder.customers) 
                ? workOrder.customers[0] 
                : workOrder.customers;
            
            if (customer) {
                customerName = customer.customer_name || 'Unknown Customer';
                customerPhone = customer.customer_phone || '';
                customerEmail = customer.customer_email || '';
                
                // Find vehicle from customer_vehicles array
                vehicle = customer.customer_vehicles?.find(
                    (v: any) => v.id === workOrder.vehicle_id
                ) || {};
            }
        }

        const workItems = workOrder.work_order_items || [];
        
        const year = vehicle.year || 'Unknown';
        const make = vehicle.make || 'Unknown';
        const model = vehicle.model || 'Unknown';
        const engine = vehicle.engine_type || 'Unknown';
        const vin = vehicle.vin || 'Unknown';
        const mileage = vehicle.mileage || 'Unknown';
        
        // Build work description from work order items
        const workDescription = workItems.map((item: any) => item.description).join(', ') || 'General maintenance';
        const symptoms = workOrder.notes || '';
        const laborDescription = workItems.filter((item: any) => item.item_type === 'labor').map((item: any) => item.description).join(', ') || '';

        // Extract additional work order context
        const workOrderNumber = workOrder.work_order_number || 'Unknown';
        const workOrderTitle = workOrder.title || 'Work Order';
        const workOrderDescription = workOrder.description || '';
        const workOrderStatus = workOrder.status || 'unknown';
        const workOrderPriority = workOrder.priority || 'medium';
        const workOrderTags = workOrder.tags || [];
        const assignedTechnician = workOrder.assigned_technician_id || null;

        // Enhanced technical prompt with complete work order context
        const prompt = `You are an expert automotive diagnostician. Analyze this work order for a specific vehicle and provide highly technical, actionable insights.

        WORK ORDER DETAILS:
        - Number: ${workOrderNumber}
        - Title: ${workOrderTitle}
        - Status: ${workOrderStatus}
        - Priority: ${workOrderPriority}
        - Customer: ${customerName} (${customerPhone})
        - Assigned Technician: ${assignedTechnician || 'Not assigned'}
        - Tags: ${workOrderTags.join(', ') || 'None'}

        VEHICLE INFORMATION:
        - Year/Make/Model: ${year} ${make} ${model}
        - Engine: ${engine}
        - VIN: ${vin}
        - License Plate: ${vehicle.license_plate || 'Not provided'}
        - Color: ${vehicle.color || 'Not specified'}
        - Mileage (kms): ${mileage}

        WORK DETAILS:
        - Description: ${workOrderDescription}
        - Services: ${workDescription}
        - Symptoms/Notes: ${symptoms}
        - Labor: ${laborDescription}

        Provide vehicle-specific diagnosis considering:
        1. Known common issues for this exact make/model/year
        2. Technical root causes based on symptoms
        3. Specific parts that commonly fail on this vehicle
        4. Diagnostic tests specific to this issue and vehicle
        5. Cost estimates for labor and parts

        Return ONLY valid JSON:
        {
        "upsell_suggestions": [
            {
            "title": "Specific Service/Part Name",
            "description": "Technical explanation of why this specific vehicle needs this service",
            "estimatedValue": 400,
            "priority": "high",
            "category": "immediate"
            }
        ],
        "flags": [
            {
            "type": "urgent",
            "message": "Vehicle-specific warning based on symptoms and known issues",
            "category": "safety"
            }
        ],
        "work_order_analysis": {
            "current_work_assessment": "Technical diagnosis of the specific issue for this vehicle",
            "related_systems": ["Specific systems to check on this vehicle"],
            "mileage_considerations": "What typically fails at this mileage on this specific vehicle",
            "timing_recommendations": "Optimal timing for repairs considering vehicle age and known failure patterns"
        },
        "summary": "Technical summary with specific diagnosis and vehicle-known issues"
        }

        Focus on technical accuracy and vehicle-specific knowledge.`;

        // Call OpenAI API
        let response;
        try {
            response = await Promise.race([
                openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are an expert automotive diagnostician with 20+ years experience. Provide highly specific, actionable insights. Return ONLY valid JSON.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.2,
                    max_tokens: 2500,
                    stream: false
                }),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('API timeout')), 30000)
                )
            ]);
        } catch (error) {
            console.error('OpenAI API error or timeout:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to generate insights due to AI service error'
            }, { status: 500 });
        }

        // Parse AI response
        const aiResponse = response.choices[0]?.message?.content?.trim();
        if (!aiResponse) {
            return NextResponse.json({
                success: false,
                error: 'No response from AI service'
            }, { status: 500 });
        }

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(aiResponse);
        } catch (e) {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    parsedResponse = JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    parsedResponse = null;
                }
            } else {
                parsedResponse = null;
            }
        }
        
        // Validate and fix insights
        let insights: ImmediateInsights;
        if (parsedResponse && typeof parsedResponse === 'object') {
            if (Array.isArray(parsedResponse.upsell_suggestions)) {
                parsedResponse.upsell_suggestions = parsedResponse.upsell_suggestions.map((suggestion: any) => ({
                    title: suggestion.title || 'Service Recommendation',
                    description: suggestion.description || 'Recommended service',
                    estimatedValue: Number(suggestion.estimatedValue) || 100,
                    priority: ['high', 'medium', 'low'].includes(suggestion.priority) ? suggestion.priority : 'medium',
                    category: ['immediate', 'preventive', 'safety', 'seasonal'].includes(suggestion.category) ? suggestion.category : 'preventive'
                }));
            } else {
                parsedResponse.upsell_suggestions = [];
            }
            
            if (!Array.isArray(parsedResponse.flags)) {
                parsedResponse.flags = [];
            }
            
            if (!parsedResponse.work_order_analysis) {
                parsedResponse.work_order_analysis = {
                    current_work_assessment: 'Work order analysis',
                    related_systems: [],
                    mileage_considerations: 'Standard maintenance recommended',
                    timing_recommendations: 'Complete current work first'
                };
            }
            
            if (!parsedResponse.summary) {
                parsedResponse.summary = 'Work order analyzed successfully';
            }
            
            insights = parsedResponse as ImmediateInsights;
            
            // Validate the final insights structure
            if (!validateInsights(insights)) {
                return NextResponse.json({
                    success: false,
                    error: 'Invalid insights structure from AI service'
                }, { status: 500 });
            }
        } else {
            return NextResponse.json({
                success: false,
                error: 'Invalid response format from AI service'
            }, { status: 500 });
        }

        // Save insights to database
        try {
            const { data: savedInsight, error: saveError } = await supabase
                .from('mia_insights')
                .insert({
                    work_order_id: workOrderId,
                    shop_id: shopId,
                    customer_id: workOrder.customer_id,
                    vehicle_id: workOrder.vehicle_id,
                    analysis: insights,
                    summary: insights.summary,
                    priority: insights.flags?.some(f => f.type === 'urgent') ? 'high' : 'medium',
                    status: 'active',
                    timeframe: 'immediate'
                })
                .select()
                .single();

            if (saveError) {
                console.error('Error saving insights:', saveError);
                // Still return insights but warn about save failure
                return NextResponse.json({
                    success: true,
                    insights,
                    warning: 'Insights generated but failed to save to database'
                });
            }

            return NextResponse.json({
                success: true,
                insights
            });
        } catch (saveError) {
            console.error('Error saving insights to database:', saveError);
            // Return insights even if save fails
            return NextResponse.json({
                success: true,
                insights,
                warning: 'Insights generated but failed to save to database'
            });
        }

    } catch (error: any) {
        console.error('Error generating work order insights:', error);
        return NextResponse.json(
            { success: false, error: `Failed to generate insights: ${error.message}` },
            { status: 500 }
        );
    }
}
