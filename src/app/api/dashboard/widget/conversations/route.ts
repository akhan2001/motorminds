import { NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
    try {
        const shopId = await getShopIdForUser();

        if (!shopId) {
            console.error("Dashboard conversations API: Unauthorized - no session or shop_id found.");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error("Dashboard conversations API: Supabase error -", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Parse messages JSON for each conversation
        const parsedConversations = conversations?.map(convo => {
            let messages = [];
            try {
                if (typeof convo.messages === 'string') {
                    messages = JSON.parse(convo.messages);
                } else if (Array.isArray(convo.messages)) {
                    messages = convo.messages;
                }
            } catch (parseError) {
                console.error("Error parsing messages for conversation", convo.id, parseError);
                messages = [];
            }
            
            return {
                ...convo,
                messages: Array.isArray(messages) ? messages : []
            };
        }) || [];

        return NextResponse.json(parsedConversations);

    } catch (e) {
        const error = e as Error;
        console.error("Dashboard conversations API: Unexpected error -", error.message);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
