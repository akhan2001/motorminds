import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const shopId = searchParams.get('shop_id')

        if (!shopId) {
            return NextResponse.json({ 
                error: 'Shop ID is required' 
            }, { status: 400 })
        }

        const supabase = await createClient()

        // Fetch staging customers for this shop
        const { data: customers, error } = await supabase
            .from('staging_customers')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching staging customers:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch staging customers',
                details: error.message 
            }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true,
            customers: customers || []
        })

    } catch (error) {
        console.error('Error in GET /api/admin/migrations/staging/customers:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
