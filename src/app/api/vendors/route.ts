import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET vendors for a shop
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shop_id");
    const activeOnly = searchParams.get("active") !== "false";

    if (!shopId) {
        return NextResponse.json({ error: "shop_id is required" }, { status: 400 });
    }

    try {
        let query = supabase
            .from("vendors")
            .select("*")
            .eq("shop_id", shopId)
            .order("vendor_name", { ascending: true });

        if (activeOnly) {
            query = query.eq("is_active", true);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST create new vendor
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { 
            shop_id, 
            vendor_name, 
            vendor_code,
            contact_name,
            contact_email,
            contact_phone,
            address,
            city,
            province,
            postal_code,
            website,
            payment_terms,
            notes,
            organization_id
        } = body;

        if (!shop_id || !vendor_name) {
            return NextResponse.json({ error: "shop_id and vendor_name are required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("vendors")
            .insert({ 
                shop_id, 
                vendor_name: vendor_name.trim(),
                vendor_code: vendor_code?.trim() || null,
                contact_name: contact_name?.trim() || null,
                contact_email: contact_email?.trim() || null,
                contact_phone: contact_phone?.trim() || null,
                address: address?.trim() || null,
                city: city?.trim() || null,
                province: province?.trim() || null,
                postal_code: postal_code?.trim() || null,
                website: website?.trim() || null,
                payment_terms: payment_terms?.trim() || null,
                notes: notes?.trim() || null,
                organization_id: organization_id || null,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            // Handle unique constraint violation
            if (error.code === '23505') {
                return NextResponse.json({ error: "A vendor with this name already exists" }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT update existing vendor
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { 
            id,
            vendor_name, 
            vendor_code,
            contact_name,
            contact_email,
            contact_phone,
            address,
            city,
            province,
            postal_code,
            website,
            payment_terms,
            notes,
            is_active
        } = body;

        if (!id || !vendor_name) {
            return NextResponse.json({ error: "id and vendor_name are required" }, { status: 400 });
        }

        const updateData: Record<string, any> = { 
            vendor_name: vendor_name.trim(),
            updated_at: new Date().toISOString()
        };

        // Only include optional fields if provided
        if (vendor_code !== undefined) updateData.vendor_code = vendor_code?.trim() || null;
        if (contact_name !== undefined) updateData.contact_name = contact_name?.trim() || null;
        if (contact_email !== undefined) updateData.contact_email = contact_email?.trim() || null;
        if (contact_phone !== undefined) updateData.contact_phone = contact_phone?.trim() || null;
        if (address !== undefined) updateData.address = address?.trim() || null;
        if (city !== undefined) updateData.city = city?.trim() || null;
        if (province !== undefined) updateData.province = province?.trim() || null;
        if (postal_code !== undefined) updateData.postal_code = postal_code?.trim() || null;
        if (website !== undefined) updateData.website = website?.trim() || null;
        if (payment_terms !== undefined) updateData.payment_terms = payment_terms?.trim() || null;
        if (notes !== undefined) updateData.notes = notes?.trim() || null;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data, error } = await supabase
            .from("vendors")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE vendor (soft delete by setting is_active = false)
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { id, hard_delete = false } = body;

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        if (hard_delete) {
            // Hard delete - actually remove from database
            const { error } = await supabase.from("vendors").delete().eq("id", id);
            if (error) throw error;
        } else {
            // Soft delete - just mark as inactive
            const { error } = await supabase
                .from("vendors")
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
