import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ImmediateInsights, InsightPriority, FlagType } from '@/app/mia/types/MiaInsights';
import { supabase } from '@/lib/supabase';
import rateLimiter from '@/lib/rate-limiter';

const limiter = rateLimiter({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
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

// Function to create a default structure if validation fails
function createDefaultInsights(): ImmediateInsights {
    return {
        upsell_suggestions: [],
        flags: [],
        work_order_analysis: {
            current_work_assessment: "Unable to assess current work from available data.",
            related_systems: [],
            mileage_considerations: "No mileage data available for analysis.",
            timing_recommendations: "Complete current work before additional services."
        },
        summary: "Unable to generate comprehensive insights from this work order data."
    };
}

export async function POST(req: Request) {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    try {
        await limiter.check(new NextResponse(), ip);
        
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

        // Construct the prompt for AI with explicit structure requirements and shop customization
        const prompt = `
            You are Mia, an expert automotive diagnostic AI assistant with 20+ years of hands-on repair experience. Analyze this work order with detailed technical knowledge and provide specific diagnostic insights.

            ${shopData?.shop_about ? `Shop Specialties: ${shopData.shop_about}` : ''}

            WORK ORDER ANALYSIS:
            ${JSON.stringify(workOrderData, null, 2)}

            CRITICAL DIAGNOSTIC REQUIREMENTS:
            1. For inspection work: Provide SPECIFIC potential causes, not generic "could be X or Y" statements
            2. For symptom-based work: Give detailed technical analysis of what specific components likely cause those symptoms
            3. For maintenance work: Identify related systems that typically fail around the same service intervals
            4. Use your technical expertise to make educated assessments based on symptoms, mileage, and vehicle type

            TECHNICAL ANALYSIS APPROACH:
            - Sounds/symptoms: Match specific noises to likely component failures
            - Mileage-based: Identify components that typically fail at current mileage intervals
            - Related systems: Components that should be checked when accessing the current repair area
            - Preventive opportunities: Parts that commonly fail soon after current repair if not addressed

            PROVIDE DETAILED INSIGHTS INCLUDING:
            - Specific component diagnoses based on symptoms (not just "needs inspection")
            - Technical explanations of WHY certain parts likely need attention
            - Proactive maintenance based on access points during current repair
            - Safety-critical items that should be checked while vehicle is serviced
            - Cost-effective bundling opportunities (parts accessed during current work)
            - Customer education on WHY these services matter

            ${shopData?.shop_about ? 'IMPORTANT: Prioritize services that align with shop specialties and technical capabilities.' : ''}

            RETURN ONLY a valid JSON object with this EXACT structure:
            {
              "upsell_suggestions": [
                {
                  "title": "string",
                  "description": "string - explain WHY this relates to current work",
                  "estimatedValue": number,
                  "priority": "high" | "medium" | "low",
                  "category": "immediate" | "preventive" | "safety" | "seasonal"
                }
              ],
              "flags": [
                {
                  "type": "warning" | "urgent" | "info",
                  "message": "string - specific to this work order",
                  "category": "safety" | "maintenance" | "cost" | "timing"
                }
              ],
              "work_order_analysis": {
                "current_work_assessment": "string - analysis of the work being done",
                "related_systems": ["string"] - other systems to check while vehicle is here,
                "mileage_considerations": "string - what to expect at this mileage",
                "timing_recommendations": "string - best time for additional work"
              },
              "summary": "string - focused summary of this specific work order and opportunities"
            }

            DO NOT include any text, explanations, or markdown formatting outside of this JSON object.
        `;

        // Call OpenAI API
        let response;
        try {
            response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a diagnostic AI for auto repair shops. You MUST respond with ONLY valid JSON without any markdown formatting, explanation, or additional text. Your entire response should be a single JSON object that can be directly parsed.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 1000
            });
        } catch (openaiError) {
            console.error('OpenAI API error:', openaiError);
            // If the model doesn't exist or there's another model-specific issue,
            // try with a different model
            try {
                console.log('Attempting fallback to GPT-3.5 model...');
                response = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are a diagnostic AI for auto repair shops. You MUST respond with ONLY valid JSON without any markdown formatting, explanation, or additional text. Your entire response should be a single JSON object that can be directly parsed.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.2,
                    max_tokens: 1000
                });
            } catch (fallbackError) {
                console.error('Fallback model also failed:', fallbackError);
                throw new Error(`OpenAI API failed: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`);
            }
        }

        // Extract and parse the AI response
        const aiResponse = response.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error('Empty response from AI');
        }

        // Parse the JSON response - improved parsing logic to handle different formats
        let parsedResponse;
        try {
            // First try to parse the raw response
            parsedResponse = JSON.parse(aiResponse.trim());
        } catch (e) {
            // If direct parsing fails, try to extract JSON from markdown code blocks
            const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    parsedResponse = JSON.parse(jsonMatch[1].trim());
                } catch (e2) {
                    console.error('Failed to parse JSON from code block:', e2);
                    parsedResponse = null;
                }
            } else {
                // Try one more approach - find anything that looks like JSON
                const possibleJson = aiResponse.match(/(\{[\s\S]*\})/);
                if (possibleJson && possibleJson[1]) {
                    try {
                        parsedResponse = JSON.parse(possibleJson[1].trim());
                    } catch (e3) {
                        console.error('Failed to parse JSON from possible match:', e3);
                        parsedResponse = null;
                    }
                } else {
                    console.error('Could not find valid JSON in response');
                    parsedResponse = null;
                }
            }
        }
        
        // Validate the structure
        let insights: ImmediateInsights;
        if (parsedResponse && validateInsights(parsedResponse)) {
            insights = parsedResponse;
        } else {
            console.warn('AI response did not match expected structure or could not be parsed, using default', parsedResponse);
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
