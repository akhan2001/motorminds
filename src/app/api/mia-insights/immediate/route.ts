import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ImmediateInsights, InsightPriority, FlagType } from '@/app/mia/types/MiaInsights';
import { supabase } from '@/lib/supabase';
import rateLimiter from '@/lib/rate-limiter';

const limiter = rateLimiter({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 1000, // More lenient rate limiting
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Function to validate the structure of insights
function validateInsights(data: any): data is ImmediateInsights {
    // Check if the object has the required properties
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.upsell_suggestions)) return false;
    if (!Array.isArray(data.flags)) return false;
    if (typeof data.summary !== 'string') return false;
    if (!data.work_order_analysis || typeof data.work_order_analysis !== 'object') return false;
    
    // Validate work order analysis structure
    const analysis = data.work_order_analysis;
    if (typeof analysis.current_work_assessment !== 'string') return false;
    if (!Array.isArray(analysis.related_systems)) return false;
    if (typeof analysis.mileage_considerations !== 'string') return false;
    if (typeof analysis.timing_recommendations !== 'string') return false;
    
    // Validate each upsell suggestion
    for (const suggestion of data.upsell_suggestions) {
        if (typeof suggestion.title !== 'string') return false;
        if (typeof suggestion.description !== 'string') return false;
        if (typeof suggestion.estimatedValue !== 'number') return false;
        if (!['high', 'medium', 'low'].includes(suggestion.priority)) return false;
        if (!['immediate', 'preventive', 'safety', 'seasonal'].includes(suggestion.category)) return false;
    }
    
    // Validate each flag
    for (const flag of data.flags) {
        if (!['warning', 'urgent', 'info'].includes(flag.type)) return false;
        if (typeof flag.message !== 'string') return false;
        if (!['safety', 'maintenance', 'cost', 'timing'].includes(flag.category)) return false;
    }
    
    return true;
}

// Technical default insights
function createDefaultInsights(): ImmediateInsights {
    return {
        upsell_suggestions: [{
            title: "Comprehensive Diagnostic Inspection",
            description: "Multi-point diagnostic inspection to identify potential issues before they become major repairs. Includes fluid analysis, belt/hose inspection, and system performance checks.",
            estimatedValue: 150,
            priority: "medium",
            category: "preventive"
        }, {
            title: "Maintenance Service Package",
            description: "Age-appropriate maintenance services including filter replacements, fluid changes, and wear item inspection based on vehicle mileage and service history.",
            estimatedValue: 250,
            priority: "medium", 
            category: "preventive"
        }],
        flags: [{
            type: "info",
            message: "Vehicle age and mileage suggest proactive maintenance to prevent costly repairs",
            category: "maintenance"
        }],
        work_order_analysis: {
            current_work_assessment: "Current service in progress. Recommend comprehensive inspection to identify additional maintenance needs.",
            related_systems: ["Engine", "Transmission", "Cooling System", "Brake System"],
            mileage_considerations: "At this service interval, consider inspecting wear items and preventive maintenance components",
            timing_recommendations: "Complete current work, then schedule follow-up inspection within 30 days"
        },
        summary: "Technical diagnostic and preventive maintenance recommendations based on vehicle service requirements"
    };
}

export async function POST(req: Request) {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    try {
        // Skip rate limiting for better performance in development
        // await limiter.check(new NextResponse(), ip);
        
        // Extract work order data and shop ID from request
        const { workOrderData, shopId } = await req.json();
        
        if (!workOrderData) {
            return NextResponse.json(
                { success: false, error: 'Work order data is required' },
                { status: 400 }
            );
        }

        if (!shopId) {
            return NextResponse.json(
                { success: false, error: 'Shop ID is required' },
                { status: 400 }
            );
        }

        // Get shop information
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('shop_about')
            .eq('id', shopId)
            .single();

        if (shopError) {
            console.error('Error fetching shop data:', shopError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch shop information' },
                { status: 500 }
            );
        }

        // Extract comprehensive vehicle and work order details
        // Find the correct vehicle using vehicle_id, not just the first one
        const matchingVehicle = workOrderData?.vehicle_id && workOrderData?.customers?.customer_vehicles 
            ? workOrderData.customers.customer_vehicles.find((v: any) => v.id === workOrderData.vehicle_id)
            : null;
        // Fallback to first vehicle if no matching vehicle found
        const vehicle = matchingVehicle || workOrderData?.customers?.customer_vehicles?.[0] || {};
        const workDetails = workOrderData?.repair_order_details?.[0] || {};
        
        const year = vehicle.year || 'Unknown';
        const make = vehicle.make || 'Unknown';
        const model = vehicle.model || 'Unknown';
        const engine = vehicle.engine_type || 'Unknown';
        const vin = vehicle.vin || 'Unknown';
        const mileage = workDetails.mileage || 'Unknown';
        const workDescription = workDetails.description || 'General maintenance';
        const symptoms = workDetails.notes || '';
        const laborDescription = workDetails.labour || '';

        // Enhanced technical prompt for vehicle-specific insights
        const prompt = `You are an expert automotive diagnostician. Analyze this work order for a specific vehicle and provide highly technical, actionable insights.

        VEHICLE: ${year} ${make} ${model}
        ENGINE: ${engine}
        VIN: ${vin}
        MILEAGE: ${mileage}
        ISSUE: ${workDescription}
        SYMPTOMS: ${symptoms}
        CURRENT WORK: ${laborDescription}

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
            "description": "Technical explanation of why this specific vehicle needs this service, including known common failures for this make/model/year",
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
            "current_work_assessment": "Technical diagnosis of the specific issue for this vehicle, referencing common problems for this make/model/year",
            "related_systems": ["Specific systems to check on this vehicle"],
            "mileage_considerations": "What typically fails at this mileage on this specific vehicle",
            "timing_recommendations": "Optimal timing for repairs considering vehicle age and known failure patterns"
              },
        "summary": "Technical summary with specific diagnosis and vehicle-known issues"
            }

        Focus on technical accuracy and vehicle-specific knowledge. Reference common issues for this exact vehicle.`;

        // Call OpenAI API with timeout and error handling
        let response;
        try {
            response = await Promise.race([
                openai.chat.completions.create({
                    model: 'gpt-3.5-turbo', // Much faster than GPT-4
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are an expert automotive diagnostician with 20+ years experience. You have deep knowledge of specific vehicle make/model common issues, failure patterns, and technical specifications. Provide highly specific, actionable insights. Return ONLY valid JSON.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.2, // Slightly higher for more detailed technical responses
                    max_tokens: 2500, // Increased for comprehensive technical insights
                    stream: false
                }),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('API timeout')), 12000) // 12 second timeout for detailed responses
                )
            ]);
        } catch (error) {
            console.error('OpenAI API error or timeout:', error);
            return NextResponse.json({
                success: true,
                insights: createDefaultInsights()
            });
        }

        // Fast response parsing
        const aiResponse = response.choices[0]?.message?.content?.trim();
        if (!aiResponse) {
            return NextResponse.json({
                success: true,
                insights: createDefaultInsights()
            });
        }

        // Quick JSON extraction and parsing
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(aiResponse);
        } catch (e) {
            // Quick regex to extract JSON
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
        
        // Fast validation with auto-fix
        let insights: ImmediateInsights;
        if (parsedResponse && typeof parsedResponse === 'object') {
            // Quick fix for common issues
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
        } else {
            insights = createDefaultInsights();
        }

        // Return the insights
        return NextResponse.json({
            success: true,
            insights
        });
    } catch (error: any) {
        if (error.message === 'Rate limit exceeded') {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }
        
        console.error('Error generating immediate insights:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: `Failed to generate insights: ${errorMessage}` },
            { status: 500 }
        );
    }
}
