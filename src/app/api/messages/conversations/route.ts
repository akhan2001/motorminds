import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { decrypt } from "@/lib/encryption";

const GRAPH_BASE = "https://graph.facebook.com/v18.0";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    if (!shopId) {
        return NextResponse.json({ error: "shopId_required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from("connected_pages")
        .select("page_id, access_token")
        .eq("shop_id", shopId)
        .maybeSingle();

    if (error || !data) {
        return NextResponse.json({ error: "page_not_found" }, { status: 404 });
    }

    const pageId = data.page_id as string;
    const pageToken = decrypt(data.access_token as string);

    try {
        // Page profile info
        const pageInfoResp = await fetch(`${GRAPH_BASE}/${pageId}?fields=name,link,picture.type(normal)&access_token=${pageToken}`);
        const pageInfo = await pageInfoResp.json();

        const convResp = await fetch(`${GRAPH_BASE}/${pageId}/conversations?fields=senders,unread_count,updated_time&access_token=${pageToken}`);
        const convJson = await convResp.json();
        if (!convResp.ok) throw new Error(convJson.error?.message || "graph_conversations_error");
        const conversations = convJson.data ?? [];
        const convWithMsgs = await Promise.all(
            conversations.map(async (conv: any) => {
                const msgsResp = await fetch(`${GRAPH_BASE}/${conv.id}/messages?fields=from,message,created_time&limit=10&access_token=${pageToken}`);
                const msgsJson = await msgsResp.json();
                return { ...conv, messages: msgsJson.data ?? [] };
            })
        );
        return NextResponse.json({ pageInfo, conversations: convWithMsgs });
    } catch (err: any) {
        console.error("Graph API error", err);
        return NextResponse.json({ error: "graph_error", message: err.message }, { status: 500 });
    }
} 