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
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ customers: [] })
    }

    const supabase = await createClient()
    const searchTerm = query.trim()

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
        tags
      `)
      .eq('shop_id', shopId)
      .limit(limit)

    // Optimize search based on input pattern
    if (searchTerm.match(/^\+?[\d\s()-]+$/)) {
      // Phone number search - use indexed phone column for fast lookups
      const cleanPhone = searchTerm.replace(/\D/g, '')
      dbQuery = dbQuery.or(`customer_phone.ilike.%${cleanPhone}%`)
    } else if (searchTerm.includes('@')) {
      // Email search - direct column match
      dbQuery = dbQuery.ilike('customer_email', `%${searchTerm}%`)
    } else if (searchTerm.length >= 3) {
      // Full-text search using GIN index for name/email
      // Convert search term for tsquery compatibility
      const tsQuery = searchTerm
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word.replace(/[^a-zA-Z0-9]/g, ''))
        .join(' & ')
      
      if (tsQuery) {
        // Use the GIN index for efficient text search
        dbQuery = dbQuery.textSearch('customer_name,customer_email', tsQuery)
      } else {
        // Fallback to ILIKE if no valid tsquery terms
        dbQuery = dbQuery.or(`customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`)
      }
    } else {
      // Short queries - use simple ILIKE on name
      dbQuery = dbQuery.ilike('customer_name', `%${searchTerm}%`)
    }

    // Order by relevance: exact name matches first, then partial matches
    dbQuery = dbQuery.order('customer_name')

    const { data: customers, error } = await dbQuery

    if (error) {
      console.error('Customer search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Additional client-side relevance scoring for better UX
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
      
      return { ...customer, _score: score }
    }).sort((a, b) => b._score - a._score)

    // Remove the score from the response
    const finalCustomers = scoredCustomers.map(({ _score, ...customer }) => customer)

    return NextResponse.json({ 
      customers: finalCustomers,
      total: finalCustomers.length,
      query: searchTerm
    })

  } catch (error) {
    console.error('Customer search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
