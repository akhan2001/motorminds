import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";

export async function GET(request: Request, { params }: { params: { shopId: string } }) {
    const { shopId } = params;

    if (!shopId) {
        return new NextResponse(JSON.stringify({ error: "Shop ID is required" }), { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
    }

    const supabase = await createClient();
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

