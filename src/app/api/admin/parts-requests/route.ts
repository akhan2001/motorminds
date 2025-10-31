import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin-guard'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user is admin
        const isAdmin = await isUserAdmin(user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
        }

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const shopId = searchParams.get('shop_id')
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Build query - admin can see all requests (RLS policy handles authorization)
        let query = supabase
            .from('parts_requests')
            .select(`
                *,
                shops:shop_id (
                    id,
                    shop_name,
                    shop_email,
                    shop_phone
                )
            `, { count: 'exact' })

        // Apply filters
        if (status) {
            query = query.eq('status', status)
        }

        if (priority) {
            query = query.eq('priority', priority)
        }

        if (shopId) {
            query = query.eq('shop_id', shopId)
        }

        // Order by created_at descending (newest first)
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        const { data: partsRequests, error, count } = await query

        if (error) {
            console.error('Error fetching admin parts requests:', error)
            return NextResponse.json(
                { error: 'Failed to fetch parts requests', details: error.message },
                { status: 500 }
            )
        }

        // Enrich parts requests with full supplier details from suppliers table
        if (partsRequests && partsRequests.length > 0) {
            for (const request of partsRequests) {
                if (request.supplier_info?.selected_suppliers && Array.isArray(request.supplier_info.selected_suppliers)) {
                    // Get all unique supplier IDs from all requests
                    const supplierIds = request.supplier_info.selected_suppliers
                        .map((s: any) => s.id)
                        .filter((id: any) => id && typeof id === 'string')

                    if (supplierIds.length > 0) {
                        try {
                            // Fetch full supplier details from suppliers table
                            const { data: suppliers, error: supplierError } = await supabase
                                .from('suppliers')
                                .select('*')
                                .in('id', supplierIds)

                            if (supplierError) {
                                console.error('Error fetching suppliers:', supplierError)
                            } else if (suppliers && suppliers.length > 0) {
                                // Create a map for quick lookup
                                const supplierMap = new Map(suppliers.map(s => [s.id, s]))
                                
                                // Merge full supplier data with selected_suppliers
                                request.supplier_info.selected_suppliers = request.supplier_info.selected_suppliers.map((selectedSupplier: any) => {
                                    const fullSupplier = supplierMap.get(selectedSupplier.id)
                                    
                                    if (fullSupplier) {
                                        // Parse address JSONB - handle different formats
                                        let address = ''
                                        let city = ''
                                        let province = ''
                                        let postalCode = ''
                                        
                                        if (fullSupplier.address) {
                                            if (typeof fullSupplier.address === 'string') {
                                                address = fullSupplier.address
                                            } else if (typeof fullSupplier.address === 'object') {
                                                address = fullSupplier.address.street || fullSupplier.address.full || fullSupplier.address.address || ''
                                                city = fullSupplier.address.city || ''
                                                province = fullSupplier.address.province || fullSupplier.address.state || ''
                                                postalCode = fullSupplier.address.postal_code || fullSupplier.address.zip || ''
                                            }
                                        }
                                        
                                        // Merge all supplier data, prioritizing database data
                                        return {
                                            id: fullSupplier.id,
                                            name: fullSupplier.name || selectedSupplier.name,
                                            contact_person: fullSupplier.contact_person || selectedSupplier.contact_person,
                                            phone_number: fullSupplier.phone_number || selectedSupplier.phone_number,
                                            email: fullSupplier.email || selectedSupplier.email,
                                            account_number: fullSupplier.account_number || selectedSupplier.account_number,
                                            address: address || selectedSupplier.address,
                                            city: city || selectedSupplier.city,
                                            province: province || selectedSupplier.province,
                                            postal_code: postalCode || selectedSupplier.postal_code,
                                            notes: fullSupplier.notes || selectedSupplier.notes,
                                            status: fullSupplier.status || selectedSupplier.status,
                                            // Keep any custom fields
                                            isCustom: selectedSupplier.isCustom,
                                            // Include metadata if exists
                                            metadata: fullSupplier.metadata || selectedSupplier.metadata
                                        }
                                    }
                                    
                                    // If supplier not found in database, return what we have
                                    return selectedSupplier
                                })
                            } else {
                                console.warn(`No suppliers found for IDs: ${supplierIds.join(', ')}`)
                            }
                        } catch (error) {
                            console.error('Error enriching supplier data:', error)
                            // Continue with existing data if enrichment fails
                        }
                    }
                }
            }
        }


        return NextResponse.json({
            success: true,
            partsRequests: partsRequests || [],
            total: count || 0,
            limit,
            offset
        })

    } catch (error) {
        console.error('Admin parts requests GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
