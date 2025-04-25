import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ImmediateInsights } from '@/app/mia/types/MiaInsights';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        // Construct the prompt for AI
        const prompt = `
            You are Mia, an AI assistant for auto repair shops.
            Based on this work order data, provide immediate upsell suggestions and service recommendations that is relevant, quick and cost effective.
            
            Work Order: ${JSON.stringify(workOrderData)}
            
            Generate a list of immediate upsell opportunities that:
            1. Are relevant to the current visit
            2. Would be quick to perform
            3. Provide value to both the customer and shop
            
            Also identify any maintenance flags or warnings.
            
            Return ONLY a valid JSON object.
        `;

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a diagnostic AI for auto repair shops.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1000,
        });

        // Extract and parse the AI response
        const aiResponse = response.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error('Empty response from AI');
        }

        // Parse the JSON response
        const insights: ImmediateInsights = JSON.parse(
            aiResponse.replace(/```json|```/g, '').trim()
        );

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
