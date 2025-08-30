import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';

// Types
interface CreateCustomerRequest {
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    customer_address?: string;
    customer_vehicle?: any;
    license_plate?: string;
    notes?: string;
    tags?: string[];
}

// GET /api/customers - Search customers
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const phone = searchParams.get('phone');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId)
            .order('updated_at', { ascending: false })
            .limit(limit);

        if (phone) {
            // Search by exact phone number
            query = query.eq('customer_phone', phone);
        } else if (search) {
            // Full-text search on name and email
            query = query.textSearch('customers_search_idx', search);
        }

        const { data: customers, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
        }

        return NextResponse.json({ customers });

    } catch (error) {
        console.error('GET /api/customers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const body: CreateCustomerRequest = await request.json();
        const { 
            customer_name, 
            customer_email, 
            customer_phone, 
            customer_address,
            customer_vehicle,
            license_plate,
            notes,
            tags 
        } = body;

        // Validate required fields
        if (!customer_name) {
            return NextResponse.json({ 
                error: 'Missing required field: customer_name' 
            }, { status: 400 });
        }

        // Check if customer with same phone number already exists
        if (customer_phone) {
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('shop_id', shopId)
                .eq('customer_phone', customer_phone)
                .maybeSingle();

            if (existingCustomer) {
                return NextResponse.json({ 
                    error: 'Customer with this phone number already exists' 
                }, { status: 409 });
            }
        }

        // Create customer
        const { data: customer, error } = await supabase
            .from('customers')
            .insert({
                shop_id: shopId,
                customer_name,
                customer_email: customer_email || null,
                customer_phone: customer_phone || null,
                customer_address: customer_address || null,
                customer_vehicle: customer_vehicle || null,
                license_plate: license_plate || null,
                notes: notes || null,
                tags: tags || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create customer:', error);
            return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            customer 
        });

    } catch (error) {
        console.error('POST /api/customers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/customers/:id - Update customer (for future use)
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('id');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        const { data: customer, error } = await supabase
            .from('customers')
            .update({
                ...body,
                updated_at: new Date().toISOString(),
            })
            .eq('id', customerId)
            .eq('shop_id', shopId)
            .select()
            .single();

        if (error) {
            console.error('Failed to update customer:', error);
            return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            customer 
        });

    } catch (error) {
        console.error('PUT /api/customers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}