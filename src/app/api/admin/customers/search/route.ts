import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET /api/admin/customers/search - Admin search across all customers (no shop filtering)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Verify admin access (you can add admin role checking here)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const limit = parseInt(searchParams.get('limit') || '20')

        let query = supabase
            .from('customers')
            .select(`
                *,
                shops:shop_id (
                    shop_name,
                    shop_email
                )
            `)
            .order('updated_at', { ascending: false })
            .limit(limit)

        if (search) {
            // Use ILIKE search for name, email, and phone (works without special indexes)
            query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`)
        }

        const { data: customers, error } = await query

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 })
        }

        return NextResponse.json({ customers })

    } catch (error) {
        console.error('GET /api/admin/customers/search error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
