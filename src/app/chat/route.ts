import { NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_MIA_KEY,
});


export async function POST(req: Request) {

    // const cookieStore = await cookies();
    // const isAuthenticated = cookieStore.get("supabase-auth-token");
    // if (!isAuthenticated) {
    //     return NextResponse.json({
    //         message: "Unauthorized"
    //     }, { status: 401 });
    // }

    const { prompt } = await req.json();

    try {
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0, 
        });

        return NextResponse.json({ choices: completion.choices });

    } catch (error) {
        console.error(error);
    }

}