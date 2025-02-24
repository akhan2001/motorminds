import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const currentMessage = messages[messages.length - 1].content;

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: currentMessage.replace(/\n/g, ' '),
    });

    // console.log("Embedding response: ", embeddingResponse);
    const [{ embedding }] = embeddingResponse.data;

    // Query similar documents from Supabase
    const { data: documents } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 3,
    });

    // console.log("Documents: ", documents);

    // Create context from matched documents
    const context = documents ? documents.map((doc: any) => doc.content).join('\n') : '';

    // Get completion from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `You are a helpful assistant. Use this context to answer questions: ${context}`
        },
        ...messages
      ],
      stream: true,
    });

    // Stream the response
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || '';
          controller.enqueue(text);
        }
        controller.close();
      },
    });

    // Return response with CORS headers
    return new StreamingTextResponse(stream, {
      headers: {
        ...corsHeaders,
        'x-sources': Buffer.from(JSON.stringify(documents)).toString('base64'),
      },
    });

  } catch (error: any) {
    console.error('Retrieval error:', error);
    return NextResponse.json({ error: error.message }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}