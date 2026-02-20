import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

/**
 * GET /api/operations/credits-refunds
 * List credits/refunds with filters
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    let shopId = req.nextUrl.searchParams.get('shop_id')
    if (!shopId) {
        shopId = await getShopIdForUser()
    }
    if (!shopId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dateFrom = req.nextUrl.searchParams.get('date_from') || undefined
    const dateTo = req.nextUrl.searchParams.get('date_to') || undefined
    const supplier = req.nextUrl.searchParams.get('supplier') || undefined
    const status = req.nextUrl.searchParams.get('status') || undefined

    try {
        let query = supabase
            .from('credits_refunds')
            .select('*')
            .eq('shop_id', shopId)
            .or('archived.eq.false,archived.is.null')
            .order('refund_date', { ascending: false })
            .order('created_at', { ascending: false })

        if (dateFrom) {
            query = query.gte('refund_date', dateFrom.split('T')[0])
        }
        if (dateTo) {
            query = query.lte('refund_date', dateTo.split('T')[0])
        }
        if (supplier) {
            query = query.ilike('supplier', `%${supplier}%`)
        }
        if (status) {
            query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) {
            console.error('Credits/refunds fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch credits/refunds' },
                { status: 500 }
            )
        }

        const total = (data || []).reduce((sum, item) => sum + Number(item.amount || 0), 0)

        return NextResponse.json({
            creditsRefunds: data || [],
            total,
            count: (data || []).length,
        })
    } catch (err) {
        console.error('Credits/refunds API error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/operations/credits-refunds
 * Create a new credit/refund
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const shopId = await getShopIdForUser()
    if (!shopId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const {
            amount,
            supplier,
            supplier_id,
            reason,
            refund_date,
            notes,
        } = body

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Reason is required' },
                { status: 400 }
            )
        }
        if (!amount || Number(amount) <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than 0' },
                { status: 400 }
            )
        }
        if (!refund_date) {
            return NextResponse.json(
                { error: 'Refund date is required' },
                { status: 400 }
            )
        }

        const insertData = {
            shop_id: shopId,
            amount: Number(amount),
            supplier: supplier?.trim() || null,
            supplier_id: supplier_id || null,
            reason: reason.trim(),
            status: 'pending',
            refund_date: refund_date.split('T')[0],
            notes: notes?.trim() || null,
            archived: false,
        }

        const { data, error } = await supabase
            .from('credits_refunds')
            .insert([insertData])
            .select()
            .single()

        if (error) {
            console.error('Credits/refunds create error:', error)
            return NextResponse.json(
                { error: 'Failed to create credit/refund' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, creditRefund: data }, { status: 201 })
    } catch (err) {
        console.error('Credits/refunds POST error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
