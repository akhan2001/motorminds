import { NextRequest, NextResponse } from 'next/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

export async function withAuth<T>(
    handler: (req: NextRequest, shopId: string) => Promise<NextResponse<T>>
) {
    return async (req: NextRequest) => {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await handler(req, shopId)
    }
}