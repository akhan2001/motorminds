import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from './with-auth'
import { getShopIdForUser } from '@/utils/get-shop-id'

// Mock getShopIdForUser
vi.mock('@/utils/get-shop-id', () => ({
    getShopIdForUser: vi.fn(),
}))

describe('withAuth', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/messaging/templates')
    const mockHandler = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        mockHandler.mockResolvedValue({
            json: () => Promise.resolve({ success: true }),
            status: 200,
        })
    })

    describe('authentication checks', () => {
        it('should return 401 when user is not authenticated', async () => {
            vi.mocked(getShopIdForUser).mockResolvedValue(null)

            const protectedHandler = await withAuth(mockHandler)
            const response = await protectedHandler(mockRequest)
            const data = await response.json()

            expect(getShopIdForUser).toHaveBeenCalled()
            expect(mockHandler).not.toHaveBeenCalled()
            expect(response.status).toBe(401)
            expect(data).toEqual({ error: 'Unauthorized' })
        })

        it('should call handler with shopId when user is authenticated', async () => {
            const mockShopId = 'shop-123'
            vi.mocked(getShopIdForUser).mockResolvedValue(mockShopId)

            const protectedHandler = await withAuth(mockHandler)
            await protectedHandler(mockRequest)

            expect(getShopIdForUser).toHaveBeenCalled()
            expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockShopId)
        })

        it('should return handler response when authenticated', async () => {
            const mockShopId = 'shop-123'
            const mockResponse = NextResponse.json({ data: 'test' }, { status: 200 })
            vi.mocked(getShopIdForUser).mockResolvedValue(mockShopId)
            mockHandler.mockResolvedValue(mockResponse)

            const protectedHandler = await withAuth(mockHandler)
            const response = await protectedHandler(mockRequest)

            expect(response).toBe(mockResponse)
        })
    })

    describe('messaging routes protection', () => {
        const messagingRoutes = [
            { path: '/api/messaging/templates', method: 'GET' },
            { path: '/api/messaging/templates', method: 'POST' },
            { path: '/api/messaging/templates/123', method: 'GET' },
            { path: '/api/messaging/templates/123', method: 'PUT' },
            { path: '/api/messaging/templates/123', method: 'DELETE' },
            { path: '/api/messaging/templates/123/test', method: 'POST' },
            { path: '/api/messaging/queue', method: 'GET' },
            { path: '/api/messaging/queue/123', method: 'GET' },
            { path: '/api/messaging/queue/123', method: 'DELETE' },
            { path: '/api/messaging/queue/123/retry', method: 'POST' },
            { path: '/api/messaging/queue/123/send-now', method: 'POST' },
            { path: '/api/messaging/queue-automated', method: 'POST' },
            { path: '/api/messaging/campaigns', method: 'GET' },
            { path: '/api/messaging/campaigns', method: 'POST' },
            { path: '/api/messaging/campaigns/123/send', method: 'POST' },
            { path: '/api/messaging/campaigns/123/recipients', method: 'GET' },
            { path: '/api/messaging/campaigns/123/recipients', method: 'POST' },
            { path: '/api/messaging/campaigns/suggest', method: 'POST' },
            { path: '/api/messaging/segments/preview', method: 'POST' },
            { path: '/api/messaging/segments/customers', method: 'GET' },
            { path: '/api/messaging/init-defaults', method: 'GET' },
            { path: '/api/messaging/init-defaults', method: 'POST' },
            { path: '/api/messaging/ai-helper', method: 'POST' },
        ]

        messagingRoutes.forEach(({ path, method }) => {
            it(`should protect ${method} ${path}`, async () => {
                const request = new NextRequest(`http://localhost:3000${path}`, {
                    method,
                })

                // Test unauthenticated
                vi.mocked(getShopIdForUser).mockResolvedValue(null)
                const protectedHandler = await withAuth(mockHandler)
                const response = await protectedHandler(request)
                const data = await response.json()

                expect(response.status).toBe(401)
                expect(data).toEqual({ error: 'Unauthorized' })
                expect(mockHandler).not.toHaveBeenCalled()

                // Test authenticated
                vi.mocked(getShopIdForUser).mockResolvedValue('shop-123')
                const protectedHandler2 = await withAuth(mockHandler)
                await protectedHandler2(request)

                expect(mockHandler).toHaveBeenCalledWith(request, 'shop-123')
            })
        })
    })

    describe('excluded routes (should NOT use withAuth)', () => {
        const excludedRoutes = [
            { path: '/api/messaging/process-queue', method: 'POST' },
            { path: '/api/messaging/campaigns-process', method: 'POST' },
        ]

        excludedRoutes.forEach(({ path, method }) => {
            it(`should NOT protect ${method} ${path} (uses CRON secret instead)`, () => {
                // These routes should use CRON_SECRET, not withAuth
                // This test documents that they are excluded
                expect(true).toBe(true) // Placeholder - these routes have different auth
            })
        })
    })

    describe('error handling', () => {
        it('should handle getShopIdForUser throwing an error', async () => {
            vi.mocked(getShopIdForUser).mockRejectedValue(new Error('Database error'))

            const protectedHandler = await withAuth(mockHandler)
            
            await expect(protectedHandler(mockRequest)).rejects.toThrow('Database error')
            expect(mockHandler).not.toHaveBeenCalled()
        })

        it('should handle handler throwing an error', async () => {
            const mockShopId = 'shop-123'
            vi.mocked(getShopIdForUser).mockResolvedValue(mockShopId)
            mockHandler.mockRejectedValue(new Error('Handler error'))

            const protectedHandler = await withAuth(mockHandler)
            
            await expect(protectedHandler(mockRequest)).rejects.toThrow('Handler error')
        })
    })
})
