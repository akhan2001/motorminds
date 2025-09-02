import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "@/utils/cors";

export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params;

    if (!shopId) {
        return new NextResponse(JSON.stringify({ error: "Shop ID is required" }), { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
    }

    // Use service role key for widget access (no authentication required)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: shop, error } = await supabase
        .from("shops")
        .select("widget_config, shop_name")
        .eq("id", shopId)
        .single();

    if (error || !shop) {
        return new NextResponse(JSON.stringify({ error: "Shop not found" }), { 
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const defaultConfig = {
        primaryColor: "#3b82f6",
        headerText: `Chat with ${shop.shop_name || 'us'}!`,
        logoUrl: null,
        welcomeMessage: "Hello! How can we help you today?",
        position: "bottom-right",
    };

    const config = { ...defaultConfig, ...(shop.widget_config || {}) };

    return new NextResponse(JSON.stringify(config), { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}

