import { NextRequest, NextResponse } from 'next/server'
import { getUserAccessContextFromRequest } from '@/lib/auth/access-context'
import { getCustomerById } from '@/lib/services/customer-query-service'

/**
 * GET /api/customers/[id] - Fetch a single customer by ID with access control
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const context = await getUserAccessContextFromRequest()
        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: customerId } = await params

        const customer = await getCustomerById(context, customerId)

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(customer)
    } catch (error) {
        console.error('GET /api/customers/[id] error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
