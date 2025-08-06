import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import jwt from "jsonwebtoken";
import { corsHeaders } from "@/utils/cors";

export async function POST(request: Request) {
    const { shopId, domain } = await request.json();

    if (!shopId || !domain) {
        return new NextResponse(JSON.stringify({ error: "shopId and domain are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabase = createClient();
    const { data: shop, error } = await supabase
        .from("shops")
        .select("authorized_domains")
        .eq("id", shopId)
        .single();

    if (error || !shop) {
        return new NextResponse(JSON.stringify({ error: "Shop not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const authorizedDomains = shop.authorized_domains || [];
    if (!authorizedDomains.includes(domain)) {
        return new NextResponse(JSON.stringify({ error: "Domain not authorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const token = jwt.sign(
        { shopId, domain, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, // 1 hour expiration
        process.env.WIDGET_JWT_SECRET!
    );

    const { data: config } = await supabase
        .from("shops")
        .select("shop_name, shop_logo_url")
        .eq("id", shopId)
        .single();

    return new NextResponse(JSON.stringify({ 
        token, 
        config: {
            primaryColor: "#3b82f6",
            headerText: `Welcome to ${config?.shop_name || 'our shop'}!`
        }
    }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}
