import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CreateSupplierRequest } from '@/app/(features)/suppliers/types/supplier'

// GET - List all suppliers for the shop
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get user and shop ID
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get shop ID from user metadata or headers
        const shopId = request.headers.get('x-shop-id') || user.user_metadata?.shop_id
        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
        }

        // Fetch suppliers
        const { data: suppliers, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'active')
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching suppliers:', error)
            return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
        }

        return NextResponse.json({ suppliers: suppliers || [] })
    } catch (error) {
        console.error('Suppliers GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create a new supplier
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get user and shop ID
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const shopId = request.headers.get('x-shop-id') || user.user_metadata?.shop_id
        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
        }

        const body: CreateSupplierRequest = await request.json()

        // Validate required fields
        if (!body.name?.trim()) {
            return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
        }

        // Create supplier
        const { data: supplier, error } = await supabase
            .from('suppliers')
            .insert({
                shop_id: shopId,
                name: body.name.trim(),
                contact_person: body.contact_person?.trim(),
                phone_number: body.phone_number?.trim(),
                email: body.email?.trim(),
                address: body.address || {},
                account_number: body.account_number?.trim(),
                notes: body.notes?.trim(),
                status: 'active'
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating supplier:', error)
            return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
        }

        return NextResponse.json({ supplier }, { status: 201 })
    } catch (error) {
        console.error('Suppliers POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
