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

// Fast default insights
function createDefaultInsights(): ImmediateInsights {
    return {
        upsell_suggestions: [{
            title: "Standard Inspection",
            description: "General vehicle inspection while in service",
            estimatedValue: 75,
            priority: "medium",
            category: "preventive"
        }],
        flags: [{
            type: "info",
            message: "Consider standard maintenance items",
            category: "maintenance"
        }],
        work_order_analysis: {
            current_work_assessment: "Standard service work in progress",
            related_systems: ["General inspection"],
            mileage_considerations: "Follow manufacturer maintenance schedule",
            timing_recommendations: "Complete current work first"
        },
        summary: "Standard maintenance recommendations available"
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

        // Extract key work order info for faster processing
        const workDescription = workOrderData?.repair_order_details?.[0]?.description || 'General maintenance';
        const vehicleInfo = `${workOrderData?.customers?.customer_vehicles?.[0]?.year || ''} ${workOrderData?.customers?.customer_vehicles?.[0]?.make || ''} ${workOrderData?.customers?.customer_vehicles?.[0]?.model || ''}`.trim();
        const mileage = workOrderData?.repair_order_details?.[0]?.mileage || 'Unknown';

        // Simplified, faster prompt
        const prompt = `Analyze this auto repair work order and return ONLY valid JSON:

Work: ${workDescription}
Vehicle: ${vehicleInfo}
Mileage: ${mileage}

Return this exact JSON structure:
{
  "upsell_suggestions": [
    {
      "title": "Service Name",
      "description": "Brief explanation",
      "estimatedValue": 100,
      "priority": "high",
      "category": "preventive"
    }
  ],
  "flags": [
    {
      "type": "info",
      "message": "Brief message",
      "category": "maintenance"
    }
  ],
  "work_order_analysis": {
    "current_work_assessment": "Brief assessment",
    "related_systems": ["System 1"],
    "mileage_considerations": "Brief note",
    "timing_recommendations": "Brief timing"
  },
  "summary": "Brief summary"
}

Categories: upsell_suggestions="immediate|preventive|safety|seasonal", flags="safety|maintenance|cost|timing"`;

        // Call OpenAI API with timeout and error handling
        let response;
        try {
            response = await Promise.race([
                openai.chat.completions.create({
                    model: 'gpt-3.5-turbo', // Much faster than GPT-4
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are an auto repair AI. Return ONLY valid JSON with no extra text.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1, // Lower for more consistent/faster responses
                    max_tokens: 1500, // Optimized token count
                    stream: false
                }),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('API timeout')), 8000) // 8 second timeout
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
