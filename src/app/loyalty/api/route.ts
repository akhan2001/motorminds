import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST a new reward
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("This is the body", body);
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

        console.log(data);
        return NextResponse.json(data);
    } catch (err) {
        console.log(err);
        return NextResponse.json({ error: err }, { status: 500 });
    }
}