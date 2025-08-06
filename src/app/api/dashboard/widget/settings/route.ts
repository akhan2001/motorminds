import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

export async function GET(request: Request) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('shops')
            .select('widget_config, authorized_domains')
            .eq('id', shopId)
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch (e) {
        const error = e as Error;
        console.error("Settings API Error:", error.message);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { widget_config, authorized_domains } = await request.json();

        const supabase = await createClient();
        const { error } = await supabase
            .from('shops')
            .update({ widget_config, authorized_domains })
            .eq('id', shopId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (e) {
        const error = e as Error;
        console.error("Settings API Error:", error.message);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
