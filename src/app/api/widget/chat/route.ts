import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import jwt from "jsonwebtoken";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";

const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

const WIDGET_TEMPLATE = `
You are a friendly and professional customer service assistant for an auto repair shop.
Your goal is to answer customer questions, provide information about the shop, and help them schedule appointments.

Keep your responses concise and helpful. If you cannot answer a question, offer to connect the user with a member of the shop's staff.

Current Conversation:
{chat_history}

User: {input}
Assistant:`;


async function verifyToken(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7);
    try {
        return jwt.verify(token, process.env.WIDGET_JWT_SECRET!);
    } catch (error) {
        return null;
    }
}

export async function POST(req: NextRequest) {
    const decodedToken = await verifyToken(req);
    if (!decodedToken) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    
    const { messages, conversation_id } = await req.json();
    // @ts-ignore
    const { shopId } = decodedToken;

    const model = new ChatOpenAI({ temperature: 0.7, modelName: "gpt-3.5-turbo" });
    const prompt = PromptTemplate.fromTemplate(WIDGET_TEMPLATE);
    const parser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(parser);

    const chatHistory = messages.slice(0, -1).map(formatMessage).join("\n");
    const latestMessage = messages[messages.length - 1].content;
    
    const stream = await chain.stream({
        chat_history: chatHistory,
        input: latestMessage,
    });

    const supabase = await createClient();
    const newConversationId = conversation_id || crypto.randomUUID();

    let aiResponse = "";
    const responseStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                aiResponse += chunk;
                controller.enqueue(chunk);
            }

            const finalMessages = [...messages, { role: 'assistant', content: aiResponse }];
            
            await supabase.from("conversations").upsert({
                id: newConversationId,
                shop_id: shopId,
                messages: JSON.stringify(finalMessages),
                source: 'widget',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

            controller.close();
        },
    });

    return new StreamingTextResponse(responseStream, { headers: corsHeaders });
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}
