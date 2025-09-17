// API routes for individual vehicle operations
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET /api/customers/vehicles/[vehicleId]
export async function GET(
    request: NextRequest,
    { params }: { params: { vehicleId: string } }
) {
    try {
        const { vehicleId } = params

        if (!vehicleId) {
            return NextResponse.json(
                { error: 'Vehicle ID is required' },
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

        // Get vehicle
        const { data: vehicle, error } = await supabase
            .from('customer_vehicles')
            .select('*')
            .eq('id', vehicleId)
            .single()

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json(
                { error: 'Vehicle not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ vehicle })

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/customers/vehicles/[vehicleId]
export async function PUT(
    request: NextRequest,
    { params }: { params: { vehicleId: string } }
) {
    try {
        const { vehicleId } = params
        const body = await request.json()

        if (!vehicleId) {
            return NextResponse.json(
                { error: 'Vehicle ID is required' },
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

        // Build update payload
        const updatePayload: any = {}
        
        if (body.year !== undefined) updatePayload.year = parseInt(body.year)
        if (body.make !== undefined) updatePayload.make = body.make.trim()
        if (body.model !== undefined) updatePayload.model = body.model.trim()
        if (body.vin !== undefined) updatePayload.vin = body.vin?.trim() || null
        if (body.licensePlate !== undefined) updatePayload.license_plate = body.licensePlate?.trim() || null
        if (body.engineType !== undefined) updatePayload.engine_type = body.engineType?.trim() || null
        if (body.color !== undefined) updatePayload.color = body.color?.trim() || null
        if (body.mileage !== undefined) updatePayload.mileage = body.mileage ? parseInt(body.mileage) : null

        // Update vehicle
        const { data: vehicle, error } = await supabase
            .from('customer_vehicles')
            .update(updatePayload)
            .eq('id', vehicleId)
            .select()
            .single()

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json(
                { error: 'Failed to update vehicle' },
                { status: 500 }
            )
        }

        return NextResponse.json({ vehicle })

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/customers/vehicles/[vehicleId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { vehicleId: string } }
) {
    try {
        const { vehicleId } = params

        if (!vehicleId) {
            return NextResponse.json(
                { error: 'Vehicle ID is required' },
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

        // Delete vehicle
        const { error } = await supabase
            .from('customer_vehicles')
            .delete()
            .eq('id', vehicleId)

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json(
                { error: 'Failed to delete vehicle' },
                { status: 500 }
            )
        }

        return NextResponse.json({ message: 'Vehicle deleted successfully' })

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
