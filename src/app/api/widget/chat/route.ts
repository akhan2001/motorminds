import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";

const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

const WIDGET_TEMPLATE = `
You are a friendly and professional customer service assistant for {shop_name}.
You are an auto repair shop assistant helping customers with their automotive needs.

Shop Information:
- Business Name: {shop_name}
- Location: {shop_address}
- Phone: {shop_phone}
- Services: {services_offered}
- Operating Hours: {operating_hours}
- About: {shop_about}

Your goal is to:
- Answer customer questions about automotive services
- Provide information about {shop_name}'s services and capabilities
- Help customers understand pricing and scheduling
- Be helpful and professional representing {shop_name}

Keep your responses concise and helpful. When customers ask about appointments or specific services, 
provide the shop's contact information: {shop_phone}

Current Conversation:
{chat_history}

User: {input}
Assistant:`;


export async function POST(req: NextRequest) {
    const { messages, conversation_id, shopId } = await req.json();
    
    if (!shopId) {
        return new NextResponse(JSON.stringify({ error: "Shop ID is required" }), { 
            status: 400, 
            headers: corsHeaders 
        });
    }

    // Fetch shop information
    const supabase = await createClient();
    const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("shop_name, shop_address, shop_phone, shop_about, services_offered, operating_hours")
        .eq("id", shopId)
        .single();

    if (shopError || !shop) {
        return new NextResponse(JSON.stringify({ error: "Shop not found" }), { 
            status: 404, 
            headers: corsHeaders 
        });
    }

    // Format shop information for the AI prompt
    const shopInfo = {
        shop_name: shop.shop_name || "the shop",
        shop_address: shop.shop_address || "Contact us for location details",
        shop_phone: shop.shop_phone || "Contact us for phone number",
        shop_about: shop.shop_about || "We provide professional automotive repair services",
        services_offered: shop.services_offered ? 
            (Array.isArray(shop.services_offered) ? shop.services_offered.join(", ") : 
             typeof shop.services_offered === 'object' ? Object.values(shop.services_offered).join(", ") :
             shop.services_offered.toString()) : "General automotive repair services",
        operating_hours: shop.operating_hours ? 
            (typeof shop.operating_hours === 'object' ? 
             Object.entries(shop.operating_hours).map(([day, hours]) => `${day}: ${hours}`).join(", ") :
             shop.operating_hours.toString()) : "Contact us for operating hours"
    };

    const model = new ChatOpenAI({ temperature: 0.7, modelName: "gpt-3.5-turbo" });
    const prompt = PromptTemplate.fromTemplate(WIDGET_TEMPLATE);
    const parser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(parser);

    const chatHistory = messages.slice(0, -1).map(formatMessage).join("\n");
    const latestMessage = messages[messages.length - 1].content;
    
    const stream = await chain.stream({
        chat_history: chatHistory,
        input: latestMessage,
        ...shopInfo
    });

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
