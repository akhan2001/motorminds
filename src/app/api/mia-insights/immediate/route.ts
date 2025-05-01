import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ImmediateInsights, InsightPriority, FlagType } from '@/app/mia/types/MiaInsights';

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
    try {
        // Extract work order data from request
        const { workOrderData } = await req.json();
        
        if (!workOrderData) {
            return NextResponse.json(
                { success: false, error: 'Work order data is required' },
                { status: 400 }
            );
        }

        // Construct the prompt for AI with explicit structure requirements
        const prompt = `
            You are Mia, an AI assistant for auto repair shops.
            Based on this work order data, provide immediate upsell suggestions and service recommendations.
            
            Work Order: ${JSON.stringify(workOrderData)}
            
            Generate a list of immediate upsell opportunities that:
            1. Are relevant to the current visit
            2. Would be quick to perform
            3. Provide value to both the customer and shop
            
            Also identify any maintenance flags or warnings.
            
            CRITICAL: Return ONLY a valid JSON object with EXACTLY this structure:
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
            
            The response MUST include all these fields and follow this exact structure.
        `;

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a diagnostic AI for auto repair shops. You only respond with valid JSON in the specified format.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1000,
            response_format: { type: "json_object" } // Enforce JSON response
        });

        // Extract and parse the AI response
        const aiResponse = response.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error('Empty response from AI');
        }

        // Parse the JSON response
        const parsedResponse = JSON.parse(
            aiResponse.replace(/```json|```/g, '').trim()
        );
        
        // Validate the structure
        let insights: ImmediateInsights;
        if (validateInsights(parsedResponse)) {
            insights = parsedResponse;
        } else {
            console.warn('AI response did not match expected structure, using default', parsedResponse);
            insights = createDefaultInsights();
        }

        // Return the insights
        return NextResponse.json({
            success: true,
            insights
        });
    } catch (error) {
        console.error('Error generating immediate insights:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate insights' },
            { status: 500 }
        );
    }
}
