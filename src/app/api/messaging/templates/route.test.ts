import { describe, test, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { getTemplates, createTemplate } from '@/app/(features)/messaging/lib/message-template-service'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { MESSAGING_LIMITS } from '@/app/(features)/messaging/lib/limits'

// Mock dependencies
vi.mock('@/utils/get-shop-id')
vi.mock('@/app/(features)/messaging/lib/message-template-service')

describe('POST /api/messaging/templates', () => {
    const testShopId = 'test-shop-id'
    const mockRequest = (body: any) => {
        return new NextRequest('http://localhost:3000/api/messaging/templates', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getShopIdForUser).mockResolvedValue(testShopId)
    })

    test('should return 403 when MAX_AUTOMATED_TEMPLATES limit is reached', async () => {
        // Mock having reached the limit
        const mockTemplates = Array(MESSAGING_LIMITS.MAX_AUTOMATED_TEMPLATES).fill(null).map((_, i) => ({
            id: `template-${i}`,
            shop_id: testShopId,
            name: `Template ${i}`,
            trigger_type: 'work_order_complete' as const,
            service_type: null,
            message_template: 'Test message',
            variables: [],
            delay_hours: 0,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        }))

        vi.mocked(getTemplates).mockResolvedValue(mockTemplates)

        const request = mockRequest({
            name: 'New Template',
            trigger_type: 'work_order_complete',
            message_template: 'Test message'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Maximum limit reached')
        expect(data.limit).toBe(MESSAGING_LIMITS.MAX_AUTOMATED_TEMPLATES)
        expect(data.current).toBe(MESSAGING_LIMITS.MAX_AUTOMATED_TEMPLATES)
        expect(createTemplate).not.toHaveBeenCalled()
    })

    test('should allow creation when below MAX_AUTOMATED_TEMPLATES limit', async () => {
        // Mock having templates below the limit
        const mockTemplates = Array(MESSAGING_LIMITS.MAX_AUTOMATED_TEMPLATES - 1).fill(null).map((_, i) => ({
            id: `template-${i}`,
            shop_id: testShopId,
            name: `Template ${i}`,
            trigger_type: 'work_order_complete' as const,
            service_type: null,
            message_template: 'Test message',
            variables: [],
            delay_hours: 0,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        }))

        const newTemplate = {
            id: 'new-template-id',
            shop_id: testShopId,
            name: 'New Template',
            trigger_type: 'work_order_complete' as const,
            service_type: null,
            message_template: 'Test message',
            variables: [],
            delay_hours: 0,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
        }

        vi.mocked(getTemplates).mockResolvedValue(mockTemplates)
        vi.mocked(createTemplate).mockResolvedValue(newTemplate)

        const request = mockRequest({
            name: 'New Template',
            trigger_type: 'work_order_complete',
            message_template: 'Test message'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(createTemplate).toHaveBeenCalled()
    })

    test('should return 401 when user is not authenticated', async () => {
        vi.mocked(getShopIdForUser).mockResolvedValue(null)

        const request = mockRequest({
            name: 'New Template',
            trigger_type: 'work_order_complete',
            message_template: 'Test message'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
        expect(getTemplates).not.toHaveBeenCalled()
        expect(createTemplate).not.toHaveBeenCalled()
    })
})

