import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all rewards
export async function GET() {
    const { data, error } = await supabase.from("rewards").select("*");
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}

// POST a new reward
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const { name, description, points_required, shop_id } = body;

        if (!name || !description || !points_required || !shop_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
    
        const { data } = await supabase
            .from("rewards")
            .insert({
                name,
                description,
                points_required,
                shop_id,
                is_active: true
            })
            .select();

        return NextResponse.json(data);
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: err }, { status: 500 });
    }
}

// Get number of rewards
export async function GET_REWARDS_COUNT(shop_id: string) {
    const { data, error } = await supabase
    .from("rewards")
    .select("*", { count: "exact" })
    .eq("shop_id", shop_id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}
