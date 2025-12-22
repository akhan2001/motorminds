import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { UpdateSupplierRequest } from '@/app/(features)/suppliers/types/supplier'

// PUT/PATCH - Update a supplier
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        
        // Get user and shop ID
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get shop ID from user metadata or users table
        let shopId = request.headers.get('x-shop-id') || user.user_metadata?.shop_id
        
        if (!shopId) {
            const { data: userData } = await supabase
                .from('users')
                .select('shop_id')
                .eq('id', user.id)
                .single()
            
            shopId = userData?.shop_id
        }

        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
        }

        const body: UpdateSupplierRequest = await request.json()

        // Validate required fields if name is being updated
        if (body.name !== undefined && !body.name.trim()) {
            return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
        }

        // Verify supplier belongs to shop
        const { data: existingSupplier, error: fetchError } = await supabase
            .from('suppliers')
            .select('shop_id')
            .eq('id', id)
            .single()

        if (fetchError || !existingSupplier) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        if (existingSupplier.shop_id !== shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Update supplier
        const updateData: any = {}
        if (body.name !== undefined) updateData.name = body.name.trim()
        if (body.contact_person !== undefined) updateData.contact_person = body.contact_person?.trim() || null
        if (body.phone_number !== undefined) updateData.phone_number = body.phone_number?.trim() || null
        if (body.email !== undefined) updateData.email = body.email?.trim() || null
        if (body.address !== undefined) updateData.address = body.address || {}
        if (body.account_number !== undefined) updateData.account_number = body.account_number?.trim() || null
        if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null
        if (body.status !== undefined) updateData.status = body.status

        const { data: supplier, error } = await supabase
            .from('suppliers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating supplier:', error)
            return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
        }

        return NextResponse.json({ supplier })
    } catch (error) {
        console.error('Suppliers PUT error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete a supplier
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        
        // Get user and shop ID
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get shop ID from user metadata or users table
        let shopId = request.headers.get('x-shop-id') || user.user_metadata?.shop_id
        
        if (!shopId) {
            const { data: userData } = await supabase
                .from('users')
                .select('shop_id')
                .eq('id', user.id)
                .single()
            
            shopId = userData?.shop_id
        }

        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
        }

        // Verify supplier belongs to shop
        const { data: existingSupplier, error: fetchError } = await supabase
            .from('suppliers')
            .select('shop_id')
            .eq('id', id)
            .single()

        if (fetchError || !existingSupplier) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        if (existingSupplier.shop_id !== shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Delete supplier
        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting supplier:', error)
            return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Suppliers DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

