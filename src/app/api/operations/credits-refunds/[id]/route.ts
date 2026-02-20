import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

/**
 * PUT /api/operations/credits-refunds/[id]
 * Update a credit/refund
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const shopId = await getShopIdForUser()
    if (!shopId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
        return NextResponse.json(
            { error: 'Credit/refund ID is required' },
            { status: 400 }
        )
    }

    try {
        const body = await req.json()
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }

        if (body.amount !== undefined) updateData.amount = Number(body.amount)
        if (body.supplier !== undefined) updateData.supplier = body.supplier?.trim() || null
        if (body.supplier_id !== undefined) updateData.supplier_id = body.supplier_id || null
        if (body.reason !== undefined) updateData.reason = body.reason?.trim()
        if (body.status !== undefined) updateData.status = body.status
        if (body.refund_date !== undefined)
            updateData.refund_date = body.refund_date.split('T')[0]
        if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null
        if (body.archived !== undefined) {
            updateData.archived = body.archived
            updateData.archived_at =
                body.archived === true ? new Date().toISOString() : null
        }

        const { data, error } = await supabase
            .from('credits_refunds')
            .update(updateData)
            .eq('id', id)
            .eq('shop_id', shopId)
            .select()
            .single()

        if (error) {
            console.error('Credits/refunds update error:', error)
            return NextResponse.json(
                { error: 'Failed to update credit/refund' },
                { status: 500 }
            )
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Credit/refund not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, creditRefund: data })
    } catch (err) {
        console.error('Credits/refunds PUT error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/operations/credits-refunds/[id]
 * Archive (soft delete) or hard delete a credit/refund
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const shopId = await getShopIdForUser()
    if (!shopId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
        return NextResponse.json(
            { error: 'Credit/refund ID is required' },
            { status: 400 }
        )
    }

    const permanent = req.nextUrl.searchParams.get('permanent') === 'true'

    try {
        if (permanent) {
            const { error } = await supabase
                .from('credits_refunds')
                .delete()
                .eq('id', id)
                .eq('shop_id', shopId)

            if (error) {
                console.error('Credits/refunds delete error:', error)
                return NextResponse.json(
                    { error: 'Failed to delete credit/refund' },
                    { status: 500 }
                )
            }
        } else {
            const { error } = await supabase
                .from('credits_refunds')
                .update({
                    archived: true,
                    archived_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .eq('shop_id', shopId)

            if (error) {
                console.error('Credits/refunds archive error:', error)
                return NextResponse.json(
                    { error: 'Failed to archive credit/refund' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Credits/refunds DELETE error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
