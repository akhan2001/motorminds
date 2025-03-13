import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client (safe on server-side)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: Request) {
    try {
        const { input } = await request.json();
        
        if (!input) {
            return NextResponse.json(
                { error: 'Input is required' },
                { status: 400 }
            );
        }
        
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `Extract customer information according to the schema provided:
                    {
                        "customer_name": "string",
                        "customer_phone": "string",
                        "customer_email": "string",
                        "customer_address": "string"
                    }
                    Return ONLY valid JSON without any explanation or markdown. Leave fields empty if not found.`
                },
                {
                    role: "user",
                    content: input
                }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" },
        });
        
        const content = response.choices[0].message.content;
        if (!content) {
            return NextResponse.json(
                { error: 'Failed to parse customer info' },
                { status: 500 }
            );
        }
        
        const parsedData = JSON.parse(content);
        return NextResponse.json(parsedData);
    } catch (error) {
        console.error("Error in parse-customer-info API:", error);
        return NextResponse.json(
            { error: 'An error occurred while parsing the customer info' },
            { status: 500 }
        );
    }
}