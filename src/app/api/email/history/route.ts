import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

// Types
interface EmailHistoryParams {
    page?: number
    limit?: number
    search?: string
    status?: string
    dateFrom?: string
    dateTo?: string
}

// GET /api/email/history - Fetch paginated email history
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const shopId = await getShopIdForUser()

        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 })
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''
        const dateFrom = searchParams.get('dateFrom') || ''
        const dateTo = searchParams.get('dateTo') || ''

        // Calculate offset
        const offset = (page - 1) * limit

        // Build query
        let query = supabase
            .from('invoice_emails')
            .select('*', { count: 'exact' })
            .eq('shop_id', shopId)
            .order('sent_at', { ascending: false })

        // Apply search filter
        if (search) {
            query = query.or(`recipient_email.ilike.%${search}%,recipient_name.ilike.%${search}%,subject.ilike.%${search}%,invoice_number.ilike.%${search}%`)
        }

        // Apply status filter
        if (status) {
            query = query.eq('status', status)
        }

        // Apply date range filter
        if (dateFrom) {
            query = query.gte('sent_at', dateFrom)
        }
        if (dateTo) {
            // Add one day to include the entire end date
            const endDate = new Date(dateTo)
            endDate.setDate(endDate.getDate() + 1)
            query = query.lt('sent_at', endDate.toISOString())
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1)

        const { data: emails, error, count } = await query

        if (error) {
            console.error('Error fetching email history:', error)
            return NextResponse.json({ error: 'Failed to fetch email history' }, { status: 500 })
        }

        // Calculate pagination info
        const totalPages = count ? Math.ceil(count / limit) : 0

        return NextResponse.json({
            emails: emails || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages,
                hasMore: page < totalPages
            }
        })

    } catch (error: any) {
        console.error('GET /api/email/history error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
