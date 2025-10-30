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
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ vehicles: [] })
        }

        const supabase = await createClient()
        const searchTerm = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') // Normalize license plate

        console.log('Vehicle search API - normalized query:', searchTerm, 'shop:', shopId)

        // Search walk-in vehicles (customer_id is null)
        const walkInQuery = supabase
            .from('customer_vehicles')
            .select('*')
            .is('customer_id', null)
            .limit(limit)

        // Search customer vehicles for this shop
        const customerQuery = supabase
            .from('customer_vehicles')
            .select(`
                *,
                customers!inner (
                    shop_id
                )
            `)
            .eq('customers.shop_id', shopId)
            .limit(limit)

        // Apply license plate search to both queries
        // Try exact match first
        const [walkInExact, customerExact] = await Promise.all([
            walkInQuery.ilike('license_plate', searchTerm),
            customerQuery.ilike('license_plate', searchTerm)
        ])

        let vehicles = []

        // Combine exact match results
        if (walkInExact.data) vehicles.push(...walkInExact.data)
        if (customerExact.data) {
            // Clean up the customers join data
            const cleanCustomerVehicles = customerExact.data.map(vehicle => {
                const { customers, ...cleanVehicle } = vehicle as any
                return cleanVehicle
            })
            vehicles.push(...cleanCustomerVehicles)
        }

        // If no exact matches and query is long enough, try fuzzy search
        if (vehicles.length === 0 && searchTerm.length >= 2) {
            const [walkInFuzzy, customerFuzzy] = await Promise.all([
                supabase
                    .from('customer_vehicles')
                    .select('*')
                    .is('customer_id', null)
                    .ilike('license_plate', `%${searchTerm}%`)
                    .limit(limit),
                supabase
                    .from('customer_vehicles')
                    .select(`
                        *,
                        customers!inner (
                            shop_id
                        )
                    `)
                    .eq('customers.shop_id', shopId)
                    .ilike('license_plate', `%${searchTerm}%`)
                    .limit(limit)
            ])

            if (walkInFuzzy.data) vehicles.push(...walkInFuzzy.data)
            if (customerFuzzy.data) {
                const cleanFuzzyVehicles = customerFuzzy.data.map(vehicle => {
                    const { customers, ...cleanVehicle } = vehicle as any
                    return cleanVehicle
                })
                vehicles.push(...cleanFuzzyVehicles)
            }
        }

        // Remove duplicates by ID and limit results
        const uniqueVehicles = vehicles
            .filter((vehicle, index, self) => 
                index === self.findIndex(v => v.id === vehicle.id)
            )
            .slice(0, limit)

        console.log('Vehicle search API - found vehicles:', uniqueVehicles.length)

        return NextResponse.json({
            vehicles: uniqueVehicles,
            total: uniqueVehicles.length,
            query: searchTerm
        })

    } catch (error) {
        console.error('Vehicle search API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
