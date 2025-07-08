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
    
    // Validate each upsell suggestion
    for (const suggestion of data.upsell_suggestions) {
        if (typeof suggestion.title !== 'string') return false;
        if (typeof suggestion.description !== 'string') return false;
        if (typeof suggestion.estimatedValue !== 'number') return false;
        if (!['high', 'medium', 'low'].includes(suggestion.priority)) return false;
    }
    
    // Validate each flag
    for (const flag of data.flags) {
        if (!['warning', 'urgent', 'info'].includes(flag.type)) return false;
        if (typeof flag.message !== 'string') return false;
    }
    
    return true;
}

// Function to create a default structure if validation fails
function createDefaultInsights(): ImmediateInsights {
    return {
        upsell_suggestions: [],
        flags: [],
        summary: "Unable to generate structured insights from this work order."
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
            You are Mia, an AI assistant for auto repair shops. Analyze this work order data and provide immediate upsell suggestions and service recommendations.

            ${shopData?.shop_about ? `Shop Information: ${shopData.shop_about}` : ''}

            Work Order: ${JSON.stringify(workOrderData)}

            Your task:
            1. Generate a list of immediate upsell opportunities that are relevant to the current visit
            2. Identify any maintenance flags or warnings
            3. Create a brief summary

            ${shopData?.shop_about ? 'IMPORTANT: Customize your suggestions based on the shop\'s specialties and services mentioned in the shop information.' : ''}

            CRITICAL: Your entire response must be ONLY a valid JSON object with EXACTLY this structure:
            {
            "upsell_suggestions": [
                {
                "title": "string",
                "description": "string",
                "estimatedValue": number,
                "priority": "high" | "medium" | "low"
                }
            ],
            "flags": [
                {
                "type": "warning" | "urgent" | "info",
                "message": "string"
                }
            ],
            "summary": "string"
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
