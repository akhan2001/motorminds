import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await request.json()
        const { status, admin_notes } = body

        if (!status || !['pending', 'processing', 'quoted', 'ordered', 'received', 'cancelled'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status provided' },
                { status: 400 }
            )
        }

        // TODO: Implement actual database update
        console.log(`Updating parts request ${id} status to ${status}`, admin_notes ? `with notes: ${admin_notes}` : '')

        return NextResponse.json({
            success: true,
            message: `Parts request status updated to ${status}`
        })
    } catch (error) {
        console.error('Error updating parts request status:', error)
        return NextResponse.json(
            { error: 'Failed to update parts request status' },
            { status: 500 }
        )
    }
}