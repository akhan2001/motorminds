import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
    try {
        const { prompt, context } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const systemPrompt = `You are a helpful assistant for an auto repair shop. Generate professional, friendly SMS messages for customer follow-ups. Keep messages concise (under 160 characters if possible), use a warm tone, and include placeholders for variables like [customer_name], [vehicle.make], [vehicle.model], [shop_name], [shop_phone], [work_order.title]. The message will be sent ${context?.delay_months || 1} months after service completion.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        const message = completion.choices[0]?.message?.content || '';

        return NextResponse.json({ message });

    } catch (error: any) {
        console.error('Error generating AI message:', error);
        return NextResponse.json(
            { error: 'Failed to generate message', details: error.message },
            { status: 500 }
        );
    }
}

