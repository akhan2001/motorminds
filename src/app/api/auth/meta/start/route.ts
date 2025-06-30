import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI || "https://motorminds.ca/api/auth/meta/callback";
    if (!appId) {
        return NextResponse.json({ error: "META_APP_ID not configured" }, { status: 500 });
    }

    const shopId = request.nextUrl.searchParams.get("shopId") ?? "";
    const statePayload = {
        nonce: crypto.randomBytes(8).toString("hex"),
        shopId
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

    const scopes = [
        "pages_show_list",
        "pages_manage_metadata",
        "pages_messaging"
        // "instagram_basic",
        // "instagram_manage_messages"
    ].join(",");

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&state=${state}&scope=${scopes}`;

    // Optionally store state in cookies for CSRF protection
    const response = NextResponse.redirect(authUrl);
    response.headers.set("Set-Cookie", `meta_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    return response;
} 