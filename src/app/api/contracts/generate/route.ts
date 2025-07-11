import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { shop, customer, vehicle, title, generationParams } = await req.json();

        if (!title || !generationParams) {
            return NextResponse.json({ message: 'Missing title or generation parameters' }, { status: 400 });
        }

        let prompt = `
            You are a legal assistant for an auto shop. Your task is to generate ONLY the body text for a service contract based on the following parameters.
            The tone should be formal and clear. The output should consist of only the text of the contract clauses, separated by newlines.
            Do NOT include a title, headers, footers, placeholders for shop/customer/vehicle information, or signature lines.

            The contract should be tailored for the following type of work: "${generationParams.workType}".

            Please incorporate the following clauses based on these instructions:
            - Disclaimer for pre-existing damage: ${generationParams.includeDamageDisclaimer ? 'Yes' : 'No'}
            - Authorization for work up to a certain amount: ${generationParams.authorizeWork ? 'Yes' : 'No'}
            - If authorization is granted, the maximum amount is: ${generationParams.maxAuthAmount ? `$${generationParams.maxAuthAmount}` : 'Not specified'}
            - Inform customer that work may void warranties: ${generationParams.informWarrantyVoid ? 'Yes' : 'No'}
            - No warranty provided unless specified: ${generationParams.includeNoWarrantyClause ? 'Yes' : 'No'}

            Generate only the contract's body text now.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [{ role: "system", content: prompt }],
        });

        const generated_text = completion.choices[0]?.message?.content?.trim();

        if (!generated_text) {
            throw new Error('Failed to generate contract text');
        }

        return NextResponse.json({ generated_text });

    } catch (error: any) {
        console.error('Error generating contract text:', error);
        return NextResponse.json({ message: error.message || 'Failed to generate contract text' }, { status: 500 });
    }
} 