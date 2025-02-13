import { NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


export async function POST(req: Request) {

    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get("supabase-auth-token");

    // if (!isAuthenticated) {
    //     return NextResponse.json({
    //         message: "Unauthorized"
    //     }, { status: 401 });
    // }

    const request = await req.json();

    if (!request?.text) {
        return NextResponse.json({
            message: "Invalid Request: Missing key text"
        }, { status: 422 });
    }

    try {
        const result = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: request.text,
        });

        const embedding = result.data[0].embedding;
        const tokens = result.usage.total_tokens;

        return NextResponse.json({
            tokens,
            embedding,
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            message: "Error generating embedding"
        }, { status: 400 });
    }
}
