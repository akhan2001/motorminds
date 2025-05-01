import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { NextRequest } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
const { messages, work_order_data, shop_id, task_id } = await req.json();

// Create system message with repair order context
const systemMessage = {
    role: 'system', 
    content: `You are Mia AI, an advanced assistant for automotive repair shops. You're analyzing a specific work order.

    WORK ORDER DATA: ${JSON.stringify(work_order_data, null, 2)}

    Your job is to:
    1. Analyze the work order and provide insights
    2. Identify upsell opportunities based on the vehicle and current work
    3. Flag important issues that need attention
    4. Suggest customer communication approaches
    5. Answer mechanic questions about this work order

    In your first response, and whenever asked for insights, provide a JSON object with:
    - upsellSuggestions: array of objects with {title, description, estimatedValue}
    - flags: array of objects with {type: "important"|"urgent"|"optional", message}
    - customerActions: array of objects with {title, message}

    Format the JSON like this:
    \`\`\`json
    {
        "upsellSuggestions": [...],
        "flags": [...],
        "customerActions": [...]
    }
    \`\`\`

    AFTER providing the JSON, give a friendly, concise summary of your insights.
    For all other questions, provide helpful, concise responses focused on the specific work order.`
};

// Add system message to the beginning of the messages array
const messagesWithSystem = [systemMessage, ...messages];

    try {
    // Ask OpenAI for a non-streaming completion
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messagesWithSystem,
        temperature: 0.7,
        max_tokens: 1000,
    });

    // Get the response content
    const content = response.choices[0].message.content;

    // Return a regular JSON response
    return NextResponse.json({
            role: "assistant",
            content: content
        });
    } catch (error) {
        console.error("OpenAI API error:", error);
        return NextResponse.json(
            { error: "There was an error processing your request" },
            { status: 500 }
        );
    }
}