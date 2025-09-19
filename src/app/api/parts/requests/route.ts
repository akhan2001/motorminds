import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { CreatePartsRequestRequest } from '@/app/(features)/parts/types/parts'

// GET - List all parts requests for the shop
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplier_id')
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('parts_requests')
      .select('*')
      .eq('shop_id', shopId)

    if (status) {
      query = query.eq('status', status)
    }

    // Filter by supplier if provided (check supplier_info JSONB)
    if (supplierId) {
      query = query.contains('supplier_info', { supplier_id: supplierId })
    }

    query = query.order('created_at', { ascending: false })

    const { data: partsRequests, error } = await query

    if (error) {
      console.error('Error fetching parts requests:', error)
      return NextResponse.json({ error: 'Failed to fetch parts requests' }, { status: 500 })
    }

    return NextResponse.json({ partsRequests: partsRequests || [] })
  } catch (error) {
    console.error('Parts requests GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new parts request
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

		const body: CreatePartsRequestRequest = await request.json()

		// Validate required fields
		if (!body.supplier_info?.supplier_name?.trim()) {
			return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
		}
		if (!body.parts_requested || body.parts_requested.length === 0) {
			return NextResponse.json({ error: 'At least one part is required' }, { status: 400 })
		}

		// Validate each part
		for (const part of body.parts_requested) {
			if (!part.part_number?.trim()) {
				return NextResponse.json({ error: 'Part number is required for all parts' }, { status: 400 })
			}
			if (!part.part_name?.trim()) {
				return NextResponse.json({ error: 'Part name is required for all parts' }, { status: 400 })
			}
			if (!part.quantity || part.quantity <= 0) {
				return NextResponse.json({ error: 'Valid quantity is required for all parts' }, { status: 400 })
			}
		}

		// Calculate total estimated price
		const totalEstimatedPrice = body.parts_requested.reduce((total, part) => {
			return total + ((part.estimated_price || 0) * part.quantity)
		}, 0)

		// Create parts request
		const { data: partsRequest, error } = await supabase
			.from('parts_requests')
			.insert({
				shop_id: shopId,
				user_id: user.id,
				vehicle_info: body.vehicle_info || {},
				parts_requested: body.parts_requested,
				supplier_info: body.supplier_info,
				total_estimated_price: totalEstimatedPrice,
				priority: body.priority || 'normal',
				notes: body.notes?.trim(),
				customer_notes: body.customer_notes?.trim(),
				status: 'pending'
			})
			.select('*')
			.single()

		if (error) {
			console.error('Error creating parts request:', error)
			return NextResponse.json({ error: 'Failed to create parts request' }, { status: 500 })
		}

		return NextResponse.json({ partsRequest }, { status: 201 })
	} catch (error) {
		console.error('Parts requests POST error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
