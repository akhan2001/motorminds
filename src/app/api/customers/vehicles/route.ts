// API routes for customer vehicles
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET /api/customers/vehicles?customerId=xyz
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')

        if (!customerId) {
            return NextResponse.json(
                { error: 'Customer ID is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if customer exists in customers table
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq('id', customerId)
            .maybeSingle();

        if (customerError || !customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Get vehicles from customer_vehicles table
        const { data: vehicles, error } = await supabase
            .from('customer_vehicles')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch vehicles' },
                { status: 500 }
            )
        }

        return NextResponse.json({ vehicles: vehicles || [] })

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/customers/vehicles
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { 
            customerId, 
            year, 
            make, 
            model, 
            vin, 
            licensePlate, 
            engineType, 
            color, 
            mileage 
        } = body

        // Validate required fields
        if (!customerId || !year || !make || !model) {
            return NextResponse.json(
                { error: 'Customer ID, year, make, and model are required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Create vehicle payload
        const vehiclePayload = {
            customer_id: customerId,
            year: parseInt(year),
            make: make.trim(),
            model: model.trim(),
            vin: vin?.trim() || null,
            license_plate: licensePlate?.trim() || null,
            engine_type: engineType?.trim() || null,
            color: color?.trim() || null,
            mileage: mileage ? parseInt(mileage) : null,
        }

        // Insert vehicle
        const { data: vehicle, error } = await supabase
            .from('customer_vehicles')
            .insert([vehiclePayload])
            .select()
            .single()

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json(
                { error: 'Failed to create vehicle' },
                { status: 500 }
            )
        }

        return NextResponse.json({ vehicle }, { status: 201 })

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
