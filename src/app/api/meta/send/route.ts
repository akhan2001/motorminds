import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { decrypt } from "@/lib/encryption";

const GRAPH_BASE = "https://graph.facebook.com/v18.0";

type Payload = {
    shop_id: string;
    thread_id: string;
    page_id?: string; // optional override
    text: string;
};

export async function POST(request: NextRequest) {
    const payload = (await request.json()) as Payload;
    const { shop_id: shopId, thread_id: threadId, text } = payload;
    if (!shopId || !threadId || !text) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Look up token & page from DB
    const { data, error } = await supabase
        .from("connected_pages")
        .select("page_id, access_token")
        .eq("shop_id", shopId)
        .limit(1);

    if (error || !data || data.length === 0) {
        return NextResponse.json({ error: "No connected page" }, { status: 400 });
    }

    const { page_id: pageId, access_token: encToken } = data[0];
    const pageAccessToken = decrypt(encToken);

    // Send message via Graph API
    const res = await fetch(`${GRAPH_BASE}/${pageId}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            recipient: {
                id: threadId
            },
            message: {
                text
            },
            access_token: pageAccessToken
        })
    });

    if (!res.ok) {
        const msg = await res.text();
        console.error("Meta send error", msg);
        return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }

    // Store outbound message
    await supabase.from("direct_messages").insert({
        shop_id: shopId,
        platform: "facebook",
        sender_id: pageId,
        thread_id: threadId,
        message: text,
        direction: "outbound",
        timestamp: new Date().toISOString()
    });

    return NextResponse.json({ status: "sent" });
} 