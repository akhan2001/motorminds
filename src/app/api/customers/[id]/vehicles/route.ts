import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();
        
        // Check if customer exists and is accessible (organization-aware)
        const { data: shopData } = await supabase
            .from('shops')
            .select('organization_id')
            .eq('id', shopId)
            .single()

        let customerQuery = supabase
            .from('customers')
            .select('id, shop_id, organization_id')
            .eq('id', id)

        // Apply organization-aware filter
        if (shopData?.organization_id) {
            // MSO shop: allow customers from same organization or same shop
            customerQuery = customerQuery.or(`organization_id.eq.${shopData.organization_id},shop_id.eq.${shopId}`)
        } else {
            // Non-MSO shop: only same shop
            customerQuery = customerQuery.eq('shop_id', shopId)
        }

        const { data: customer, error: customerError } = await customerQuery.maybeSingle();

        if (customerError || !customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Get vehicles from customer_vehicles table
        const { data: vehicles, error: vehiclesError } = await supabase
            .from('customer_vehicles')
            .select('*')
            .eq('customer_id', id)
            .order('year', { ascending: false });

        if (vehiclesError) {
            return NextResponse.json({ error: vehiclesError.message }, { status: 500 });
        }

        return NextResponse.json(vehicles || []);

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { make, model, year, license_plate, vin, color } = body;

        const supabase = await createClient();
        
        // First verify the customer is accessible (organization-aware)
        const { data: shopData } = await supabase
            .from('shops')
            .select('organization_id')
            .eq('id', shopId)
            .single()

        let customerQuery = supabase
            .from('customers')
            .select('id, shop_id, organization_id')
            .eq('id', id)

        // Apply organization-aware filter
        if (shopData?.organization_id) {
            // MSO shop: allow customers from same organization or same shop
            customerQuery = customerQuery.or(`organization_id.eq.${shopData.organization_id},shop_id.eq.${shopId}`)
        } else {
            // Non-MSO shop: only same shop
            customerQuery = customerQuery.eq('shop_id', shopId)
        }

        const { data: customer, error: customerError } = await customerQuery.single();

        if (customerError || !customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Create vehicle
        const { data: vehicle, error: vehicleError } = await supabase
            .from('customer_vehicles')
            .insert({
                customer_id: id,
                make,
                model,
                year,
                license_plate,
                vin,
                color
            })
            .select()
            .single();

        if (vehicleError) {
            return NextResponse.json({ error: vehicleError.message }, { status: 500 });
        }

        return NextResponse.json(vehicle);

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
