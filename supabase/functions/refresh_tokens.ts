// @ts-nocheck
// deno-fmt-ignore-file
// 4 space indentation
// Supabase Edge Function: refresh_tokens
// Schedules daily to refresh soon-to-expire Meta page tokens

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as crypto from "https://deno.land/std@0.203.0/crypto/mod.ts";

// -- simple AES-GCM helpers -------------------------------------------------
const ENC_KEY = (Deno.env.get("ENCRYPTION_SECRET_KEY") ?? "CHANGE_ME_32_BYTE_LONG_SECRET__").slice(0, 32);

async function encrypt(text: string) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(ENC_KEY), "AES-GCM", false, ["encrypt"]);
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
    return `${btoa(String.fromCharCode(...new Uint8Array(cipher)))}::${btoa(String.fromCharCode(...iv))}`;
}

async function decrypt(payload: string) {
    const [cipherB64, ivB64] = payload.split("::");
    const cipher = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(ENC_KEY), "AES-GCM", false, ["decrypt"]);
    const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(plainBuf);
}

// -------------------------------------------------------------------------

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRole);

const GRAPH_BASE = "https://graph.facebook.com/v18.0";

/**
 * Extend long-lived page token. Meta docs: GET /oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=TOKEN
 */
async function refreshToken(oldToken: string) {
    const params = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: Deno.env.get("META_APP_ID")!,
        client_secret: Deno.env.get("META_APP_SECRET")!,
        fb_exchange_token: oldToken
    });
    const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.access_token as string;
}

Deno.serve(async () => {
    // Select tokens older than 45 days (rough heuristic)
    const { data, error } = await supabase
        .from("connected_pages")
        .select("id, access_token, updated_at")
        .filter("platform", "eq", "facebook");

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });

    for (const row of data) {
        const ageDays = (Date.now() - new Date(row.updated_at).getTime()) / 86_400_000;
        if (ageDays < 45) continue; // still fresh
        const decrypted = await decrypt(row.access_token);
        const newToken = await refreshToken(decrypted);
        if (!newToken) continue;
        const encrypted = await encrypt(newToken);
        await supabase
            .from("connected_pages")
            .update({ access_token: encrypted, updated_at: new Date().toISOString() })
            .eq("id", row.id);
    }

    return new Response(JSON.stringify({ status: "done" }));
}); 