import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { encrypt } from "@/lib/encryption";

const GRAPH_BASE = "https://graph.facebook.com/v18.0";

async function exchangeCode(code: string, redirectUri: string) {
    const params = new URLSearchParams({
        client_id: process.env.META_APP_ID ?? "",
        client_secret: process.env.META_APP_SECRET ?? "",
        redirect_uri: redirectUri,
        code
    });
    const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
    if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
    return res.json();
}

async function getLongLivedUserToken(shortLived: string) {
    const params = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID ?? "",
        client_secret: process.env.META_APP_SECRET ?? "",
        fb_exchange_token: shortLived
    });
    const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function getPages(userToken: string) {
    const res = await fetch(`${GRAPH_BASE}/me/accounts?access_token=${userToken}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const redirectUri = process.env.META_REDIRECT_URI ?? "https://motorminds.ca/api/auth/meta/callback";

    if (error) {
        return NextResponse.redirect(`/messages?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    try {
        const { access_token: shortToken } = await exchangeCode(code, redirectUri);
        const { access_token: userToken } = await getLongLivedUserToken(shortToken);

        // List Pages to obtain page access tokens and IG ids
        const pagesResp = await getPages(userToken);
        const pages = pagesResp.data as any[];

        // Assume we link the first page for MVP
        if (!pages || pages.length === 0) {
            return NextResponse.redirect(`/messages?error=no_pages`);
        }

        const page = pages[0];
        const pageId = page.id;
        const pageAccessToken = page.access_token;

        // Get instagram business account id
        const igRes = await fetch(`${GRAPH_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`);
        const igJson = await igRes.json();
        const igId = igJson.instagram_business_account?.id ?? null;

        // TODO: determine shop_id from logged-in user session.
        // Placeholder: shopId from header for now.
        const shopId = request.headers.get("x-shop-id");
        if (!shopId) {
            return NextResponse.redirect(`/messages?error=shop_missing`);
        }

        // Store in Supabase
        await supabase.from("connected_pages").upsert({
            shop_id: shopId,
            page_id: pageId,
            ig_id: igId,
            access_token: encrypt(pageAccessToken),
            platform: "facebook"
        });

        return NextResponse.redirect(`/messages?connected=1`);
    } catch (err: any) {
        console.error(err);
        return NextResponse.redirect(`/messages?error=oauth_failed`);
    }
} 