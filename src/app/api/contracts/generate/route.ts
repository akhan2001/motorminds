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
            You are a legal assistant for an auto shop. Your task is to generate ONLY the body text for a service contract that will fit on a single page.
            
            IMPORTANT CONSTRAINTS:
            - Maximum 6-8 short paragraphs (each 2-3 sentences)
            - Keep content concise and professional
            - Use clear, simple language
            - Do NOT include title, headers, footers, customer/shop info, or signature lines
            
            The contract should cover work type: "${generationParams.workType}".

            Include these clauses based on the requirements:
            ${generationParams.includeDamageDisclaimer ? '- Pre-existing damage disclaimer' : ''}
            ${generationParams.authorizeWork ? `- Work authorization up to $${generationParams.maxAuthAmount || 'specified amount'}` : ''}
            ${generationParams.informWarrantyVoid ? '- Warranty void notification' : ''}
            ${generationParams.includeNoWarrantyClause ? '- No warranty clause unless specified' : ''}

            Generate concise contract body text (6-8 short paragraphs maximum). Each paragraph should be 2-3 sentences. Use **bold** for important terms.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [{ role: "system", content: prompt }],
            max_tokens: 800, // Limit response length
            temperature: 0.3, // More consistent output
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