import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

export async function GET(request: NextRequest) {
	try {
		const shopId = await getShopIdForUser()
		if (!shopId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const query = searchParams.get('q')
		const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
		const orgOnly = searchParams.get('organization') === 'true'

		if (!query || query.trim().length < 2) {
			return NextResponse.json({ customers: [] })
		}

		const supabase = await createClient()
		const searchTerm = query.trim()

		// Get user's shop and organization info
		const { data: shopData, error: shopError } = await supabase
			.from('shops')
			.select('organization_id')
			.eq('id', shopId)
			.single()

		if (shopError) {
			console.error('Failed to get shop data:', shopError)
			return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
		}

		const organizationId = shopData?.organization_id // Can be null for non-MSO shops

		// Phone search: use RPC so "(365) 336-5383" matches "3653365383" (digits-only match)
		let phoneMatchIds: string[] | null = null
		if (searchTerm.match(/^\+?[\d\s()-]+$/)) {
			const digits = searchTerm.replace(/\D/g, '')
			if (digits.length >= 2) {
				let shopIds: string[] = [shopId]
				if (orgOnly && organizationId) {
					const { data: orgShops } = await supabase
						.from('shops')
						.select('id')
						.eq('organization_id', organizationId)
					shopIds = (orgShops || []).map((s: { id: string }) => s.id)
					if (shopIds.length === 0) shopIds = [shopId]
				}
				const { data: ids, error: rpcError } = await supabase.rpc('search_customer_ids_by_phone', {
					digits,
					shop_ids: shopIds,
				})
				if (!rpcError && ids && Array.isArray(ids)) {
					phoneMatchIds = ids.length > 0 ? (ids as string[]) : []
				}
			}
		}

		// Search customers with enhanced selection
		let dbQuery = supabase
			.from('customers')
			.select(`
				id,
				customer_name,
				customer_email,
				customer_phone,
				customer_address,
				customer_vehicle,
				license_plate,
				tags,
				shop_id,
				organization_id,
				shops:shop_id (
					shop_name
				)
			`)
			.limit(limit)

		// Filter logic based on organization status and request
		if (orgOnly && organizationId) {
			dbQuery = dbQuery.or(`organization_id.eq.${organizationId},shop_id.eq.${shopId}`)
		} else if (orgOnly && !organizationId) {
			dbQuery = dbQuery.eq('shop_id', shopId)
		} else {
			dbQuery = dbQuery.eq('shop_id', shopId)
		}

		// Apply search filter: phone uses RPC result; others use column filters
		if (phoneMatchIds !== null && phoneMatchIds.length > 0) {
			dbQuery = dbQuery.in('id', phoneMatchIds)
		} else if (phoneMatchIds !== null && phoneMatchIds.length === 0) {
			return NextResponse.json({
				customers: [],
				total: 0,
				query: searchTerm,
				organizationId: orgOnly ? organizationId : null,
				isOrganizationSearch: orgOnly && !!organizationId
			})
		} else if (searchTerm.includes('@')) {
			dbQuery = dbQuery.ilike('customer_email', `%${searchTerm}%`)
		} else {
			dbQuery = dbQuery.or(
				`customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`
			)
		}

		// Order by relevance: exact name matches first, then partial matches
		dbQuery = dbQuery.order('customer_name')

		const { data: customers, error } = await dbQuery

		if (error) {
			console.error('Customer search error:', error)
			return NextResponse.json({ error: 'Search failed' }, { status: 500 })
		}

		// Enhanced relevance scoring with shop indication
		const scoredCustomers = (customers || []).map(customer => {
			let score = 0
			const lowerQuery = searchTerm.toLowerCase()
			const lowerName = customer.customer_name.toLowerCase()

			// Boost exact matches
			if (lowerName === lowerQuery) score += 100
			// Boost name starts with query
			else if (lowerName.startsWith(lowerQuery)) score += 50
			// Boost name contains query
			else if (lowerName.includes(lowerQuery)) score += 25

			// Boost if email matches
			if (customer.customer_email?.toLowerCase().includes(lowerQuery)) score += 30

			// Boost if phone matches
			if (customer.customer_phone?.includes(searchTerm.replace(/\D/g, ''))) score += 40

			// Boost customers from current shop (for organization-wide searches)
			if (customer.shop_id === shopId) score += 20
			
			return { 
				...customer, 
				_score: score,
				isFromCurrentShop: customer.shop_id === shopId,
				shopName: (customer.shops as any)?.shop_name
			}
		}).sort((a, b) => b._score - a._score)

		// Remove the score from the response
		const finalCustomers = scoredCustomers.map(({ _score, ...customer }) => customer)

		return NextResponse.json({
			customers: finalCustomers,
			total: finalCustomers.length,
			query: searchTerm,
			organizationId: orgOnly ? organizationId : null,
			isOrganizationSearch: orgOnly && !!organizationId
		})

	} catch (error) {
		console.error('Customer search API error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
