import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Get work orders assigned to a specific technician
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ technicianId: string }> }
) {
    try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { technicianId } = await params
        const { searchParams } = new URL(req.url)
        const shopId = searchParams.get('shop_id')

        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 })
        }

        if (!technicianId) {
            return NextResponse.json({ error: 'Technician ID is required' }, { status: 400 })
        }

        // Verify user has access to this shop
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (userData.shop_id !== shopId) {
            return NextResponse.json({ error: 'Forbidden - Access denied to this shop' }, { status: 403 })
        }

        // Verify technician belongs to the shop
        const { data: technician, error: technicianError } = await supabase
            .from('employees')
            .select('id, shop_id')
            .eq('id', technicianId)
            .single()

        if (technicianError || !technician) {
            return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
        }

        if (technician.shop_id !== shopId) {
            return NextResponse.json({ error: 'Forbidden - Technician does not belong to this shop' }, { status: 403 })
        }

        // Fetch work orders assigned to this technician
        const { data: workOrders, error } = await supabase
            .from('work_orders')
            .select('id, work_order_number, title, status, priority, created_at, updated_at')
            .eq('shop_id', shopId)
            .eq('assigned_technician_id', technicianId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching work orders:', error)
            return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 })
        }

        return NextResponse.json({ workOrders: workOrders || [] })
    } catch (error) {
        console.error('Work orders by technician GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

