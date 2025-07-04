import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET one-time costs or filter by date range
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shop_id");
    const startDateStr = searchParams.get("start_date");
    const endDateStr = searchParams.get("end_date");

    if (!shopId) {
        return NextResponse.json({ error: "shop_id is required" }, { status: 400 });
    }

    try {
        // If a date range is supplied, filter by cost_date
        let query = supabase
            .from("one_time_costs")
            .select("*")
            .eq("shop_id", shopId);

        if (startDateStr && endDateStr) {
            query = query.gte("cost_date", startDateStr).lte("cost_date", endDateStr);
        }

        const { data, error } = await query.order("cost_date", { ascending: false });
        if (error) throw error;

        return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST create new one-time cost
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { shop_id, cost_name, amount, category, cost_date } = body;

        if (!shop_id || !cost_name || !amount || !cost_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("one_time_costs")
            .insert({ shop_id, cost_name, amount, category, cost_date })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE remove a one-time cost by id
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const { error } = await supabase.from("one_time_costs").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
} 