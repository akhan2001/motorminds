import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { decrypt } from "@/lib/encryption";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN ?? "MOTORMINDS_META_VERIFY";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("VERIFY-HANDSHAKE", {
        mode,
        token,
        VERIFY_TOKEN
    });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Verification failed", { status: 403 });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Basic guard
        if (!body.entry) return NextResponse.json({ status: "ignored" });

        for (const entry of body.entry) {
            const platform = entry.messaging ? "facebook" : "instagram"; // crude detection
            const messagingEvents = entry.messaging ?? entry.changes ?? [];

            for (const event of messagingEvents) {
                // Extract standard fields. For IG direct, shape differs but we'll normalise.
                const senderId = event.sender?.id ?? event.value?.sender_id;
                const threadId = event.sender?.id ?? event.value?.thread_id;
                const messageText = event.message?.text ?? event.value?.message ?? "";
                const timestampMs = event.timestamp ?? event.time;
                const pageId = entry.id ?? event.recipient?.id;

                // look up shop by connected_pages
                const { data: pageRows } = await supabase
                    .from("connected_pages")
                    .select("shop_id, access_token, platform")
                    .eq("page_id", pageId)
                    .limit(1);
                if (!pageRows || pageRows.length === 0) continue; // unknown page
                const { shop_id: shopId } = pageRows[0];

                await supabase.from("direct_messages").insert({
                    shop_id: shopId,
                    platform,
                    sender_id: senderId,
                    thread_id: threadId,
                    message: messageText,
                    direction: "inbound",
                    timestamp: new Date(parseInt(timestampMs, 10)).toISOString()
                });
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (err) {
        console.error("Webhook error", err);
        return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
} 