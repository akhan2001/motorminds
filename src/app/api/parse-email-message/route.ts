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
                    content: `You are an assistant that helps craft professional emails.
                    
                    The user will provide a request that contains a customer mention in the format @Name (email@example.com) and a description of what they want to email about.
                    
                    Extract the recipient's name and email from the @ mention, and generate a professional email based on the context.
                    
                    Format your response according to this schema:
                    {
                        "recipient_name": "string", // The name after the @ symbol
                        "recipient_email": "string", // The email in parentheses
                        "subject": "string", // A concise, relevant subject line based on the context
                        "message": "string" // A professionally formatted email with greeting, body, and closing
                    }
                    
                    Return ONLY valid JSON without any explanation or markdown.`
                },
                {
                    role: "user",
                    content: input
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
        });
        
        const content = response.choices[0].message.content;
        if (!content) {
            return NextResponse.json(
                { error: 'Failed to parse email content' },
                { status: 500 }
            );
        }
        
        const parsedData = JSON.parse(content);
        return NextResponse.json(parsedData);
    } catch (error) {
        console.error("Error in parse-email-message API:", error);
        return NextResponse.json(
            { error: 'An error occurred while parsing the email message' },
            { status: 500 }
        );
    }
}