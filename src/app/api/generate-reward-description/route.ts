import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { title } = await req.json();

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that generates concise, engaging descriptions for mechanic shop rewards and promotions. Keep the descriptions clear, professional, and focused on the value for the customer."
                },
                {
                    role: "user",
                    content: `Generate a brief, engaging description (2-3 sentences) for a mechanic shop reward titled: "${title}". The description should explain what the customer gets and any basic terms.`
                }
            ],
            temperature: 0.7,
            max_tokens: 150,
        });

        const description = completion.choices[0]?.message?.content?.trim();

        if (!description) {
            throw new Error('Failed to generate description');
        }

        return NextResponse.json({ description });
    } catch (error) {
        console.error('Error generating description:', error);
        return NextResponse.json(
            { error: 'Failed to generate description' },
            { status: 500 }
        );
    }
} 