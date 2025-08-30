import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { encrypt } from "@/lib/encryption";

const GRAPH = "https://graph.facebook.com/v18.0";

export async function POST(req: NextRequest) {
    try {
        const { userToken, shopId } = await req.json();
        if (!userToken || !shopId) {
            return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
        }

        /* 1 ▸ long-lived user token */
        const q1 = new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: process.env.META_APP_ID!,
            client_secret: process.env.META_APP_SECRET!,
            fb_exchange_token: userToken
        });

        const longUserResp = await fetch(`${GRAPH}/oauth/access_token?${q1}`);
        const { access_token: longUser } = await longUserResp.json();
        if (!longUser) {
            return NextResponse.json({ error: "exchange_failed" }, { status: 400 });
        }

        /* 2 ▸ list Pages */
        const pagesResp = await fetch(`${GRAPH}/me/accounts?access_token=${longUser}`);
        const pages = await pagesResp.json();

        if (!pages.data?.length) {
            return NextResponse.json({ error: "no_pages" }, { status: 400 });
        }

        const { id: pageId, access_token: pageToken } = pages.data[0];

        /* 3 ▸ insert, update on conflict */
        const rowPayload = {
            shop_id: shopId,
            page_id: pageId,
            ig_id: null,
            access_token: encrypt(pageToken),
            platform: "facebook"
        };

        let { error: insertError } = await supabaseAdmin
            .from("connected_pages")
            .insert(rowPayload);

        if (insertError) {
            const { code } = insertError as any;
            if (code === "23505" || insertError.message?.includes("duplicate")) {
                const { error: updateError } = await supabaseAdmin
                    .from("connected_pages")
                    .update(rowPayload)
                    .eq("shop_id", shopId);
                if (updateError) {
                    console.error("Supabase update error", updateError);
                }
            } else {
                console.error("Supabase insert error", insertError);
            }
        }

        /* 4 ▸ subscribe Page to webhooks (optional, dev only) */
        await fetch(`${GRAPH}/${pageId}/subscribed_apps`, {
            method: "POST",
            body: new URLSearchParams({
                subscribed_fields: "messages,messaging_postbacks",
                access_token: pageToken
            })
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("Facebook exchange error", error);
        return NextResponse.json({ error: error.message ?? "internal_error" }, { status: 500 });
    }
} 