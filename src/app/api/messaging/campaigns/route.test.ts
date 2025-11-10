import { describe, test, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { getCampaigns, createCampaign } from '@/app/(features)/messaging/lib/mass-campaign-service'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { MESSAGING_LIMITS } from '@/app/(features)/messaging/lib/limits'

// Mock dependencies
vi.mock('@/utils/get-shop-id')
vi.mock('@/app/(features)/messaging/lib/mass-campaign-service')

describe('POST /api/messaging/campaigns', () => {
    const testShopId = 'test-shop-id'
    const mockRequest = (body: any) => {
        return new NextRequest('http://localhost:3000/api/messaging/campaigns', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getShopIdForUser).mockResolvedValue(testShopId)
    })

    test('should return 403 when MAX_CAMPAIGNS limit is reached', async () => {
        // Mock having reached the limit
        const mockCampaigns = Array(MESSAGING_LIMITS.MAX_CAMPAIGNS).fill(null).map((_, i) => ({
            id: `campaign-${i}`,
            shop_id: testShopId,
            name: `Campaign ${i}`,
            message: 'Test message',
            customer_segment: {},
            scheduled_send_at: null,
            status: 'draft' as const,
            total_recipients: 0,
            sent_count: 0,
            failed_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        }))

        vi.mocked(getCampaigns).mockResolvedValue(mockCampaigns)

        const request = mockRequest({
            name: 'New Campaign',
            message: 'Test message'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Maximum limit reached')
        expect(data.limit).toBe(MESSAGING_LIMITS.MAX_CAMPAIGNS)
        expect(data.current).toBe(MESSAGING_LIMITS.MAX_CAMPAIGNS)
        expect(createCampaign).not.toHaveBeenCalled()
    })

    test('should allow creation when below MAX_CAMPAIGNS limit', async () => {
        // Mock having campaigns below the limit
        const mockCampaigns = Array(MESSAGING_LIMITS.MAX_CAMPAIGNS - 1).fill(null).map((_, i) => ({
            id: `campaign-${i}`,
            shop_id: testShopId,
            name: `Campaign ${i}`,
            message: 'Test message',
            customer_segment: {},
            scheduled_send_at: null,
            status: 'draft' as const,
            total_recipients: 0,
            sent_count: 0,
            failed_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        }))

        const newCampaign = {
            id: 'new-campaign-id',
            shop_id: testShopId,
            name: 'New Campaign',
            message: 'Test message',
            customer_segment: {},
            scheduled_send_at: null,
            status: 'draft' as const,
            total_recipients: 0,
            sent_count: 0,
            failed_count: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        }

        vi.mocked(getCampaigns).mockResolvedValue(mockCampaigns)
        vi.mocked(createCampaign).mockResolvedValue(newCampaign)

        const request = mockRequest({
            name: 'New Campaign',
            message: 'Test message'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(createCampaign).toHaveBeenCalled()
    })

    test('should return 401 when user is not authenticated', async () => {
        vi.mocked(getShopIdForUser).mockResolvedValue(null)

        const request = mockRequest({
            name: 'New Campaign',
            message: 'Test message'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
        expect(getCampaigns).not.toHaveBeenCalled()
        expect(createCampaign).not.toHaveBeenCalled()
    })
})

