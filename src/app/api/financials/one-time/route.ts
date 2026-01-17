import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET one-time costs or filter by date range
export async function GET(req: NextRequest) {
    const supabase = await createClient();
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

// POST create new expense
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { 
            shop_id, 
            cost_name, 
            amount, 
            subtotal,
            tax_amount,
            tax_included,
            category, 
            cost_date,
            payment_method = 'credit_card', // Default to credit card
            vendor,
            invoice_number,
            parts_description,
            warranty,
            notes
        } = body;

        if (!shop_id || !cost_name || !amount || !cost_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const insertData: Record<string, any> = { 
            shop_id, 
            cost_name, 
            amount, 
            category, 
            cost_date,
            payment_method,
            vendor: vendor || null,
            notes: notes || null
        };

        // Add new fields if provided
        if (subtotal !== undefined) insertData.subtotal = subtotal;
        if (tax_amount !== undefined) insertData.tax_amount = tax_amount;
        if (tax_included !== undefined) insertData.tax_included = tax_included;
        if (invoice_number) insertData.invoice_number = invoice_number;
        if (parts_description) insertData.parts_description = parts_description;
        if (warranty) insertData.warranty = warranty;

        const { data, error } = await supabase
            .from("one_time_costs")
            .insert(insertData)
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
        const supabase = await createClient();
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

// PUT update an existing expense
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { 
            id, 
            cost_name, 
            amount, 
            subtotal,
            tax_amount,
            tax_included,
            category, 
            cost_date, 
            payment_method, 
            vendor, 
            invoice_number,
            parts_description,
            warranty,
            notes 
        } = body;

        if (!id || !cost_name || !amount || !cost_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updateData: Record<string, any> = { 
            cost_name, 
            amount, 
            category, 
            cost_date 
        };

        // Only include optional fields if provided
        if (payment_method !== undefined) updateData.payment_method = payment_method;
        if (vendor !== undefined) updateData.vendor = vendor || null;
        if (notes !== undefined) updateData.notes = notes || null;
        if (subtotal !== undefined) updateData.subtotal = subtotal;
        if (tax_amount !== undefined) updateData.tax_amount = tax_amount;
        if (tax_included !== undefined) updateData.tax_included = tax_included;
        if (invoice_number !== undefined) updateData.invoice_number = invoice_number || null;
        if (parts_description !== undefined) updateData.parts_description = parts_description || null;
        if (warranty !== undefined) updateData.warranty = warranty || null;

        const { data, error } = await supabase
            .from("one_time_costs")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Supabase error updating expense:", error);
            return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Expense not found or no changes needed" }, { status: 404 });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (err: any) {
        console.error("Error in PUT /api/financials/one-time:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
} 