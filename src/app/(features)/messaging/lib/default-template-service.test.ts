import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
    hasDefaultTemplate, 
    createDefaultTemplate, 
    initializeDefaultTemplate,
    getDefaultTemplate
} from './default-template-service'
import { TIME_PERIODS } from '../types/message-template'

// Mock Supabase client
const mockSupabaseClient = vi.hoisted(() => ({
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue({
                            data: [],
                            error: null
                        })
                    }))
                }))
            }))
        })),
        insert: vi.fn(() => ({
            select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: null
                })
            }))
        }))
    }))
}))

vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabaseClient))
}))

describe('DefaultTemplateService', () => {
    let mockFrom: any
    let mockSelect: any
    let mockInsert: any

    const testShopId = 'test-shop-id'
    const mockTemplate = {
        id: 'template-id-123',
        shop_id: testShopId,
        name: '1 Month Check-up Reminder',
        trigger_type: 'work_order_complete',
        service_type: null,
        message_template: 'Hi {{customer_name}}, test message',
        variables: [],
        delay_hours: TIME_PERIODS.ONE_MONTH,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    }

    beforeEach(() => {
        mockFrom = mockSupabaseClient.from
        mockSelect = {
            eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue({
                            data: [],
                            error: null
                        })
                    })),
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: null
                    })
                }))
            }))
        }
        mockInsert = {
            select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                    data: mockTemplate,
                    error: null
                })
            }))
        }

        const mockChain = {
            select: vi.fn(() => mockSelect),
            insert: vi.fn(() => mockInsert)
        }

        mockFrom.mockReturnValue(mockChain)
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('hasDefaultTemplate', () => {
        test('should return false when template does not exist', async () => {
            const mockLimit = vi.fn().mockResolvedValue({
                data: [],
                error: null
            })

            mockSelect.eq.mockReturnValue({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        limit: mockLimit
                    }))
                }))
            })

            const result = await hasDefaultTemplate(testShopId)

            expect(result).toBe(false)
            expect(mockFrom).toHaveBeenCalledWith('ai_message_templates')
        })

        test('should return true when template exists', async () => {
            const mockLimit = vi.fn().mockResolvedValue({
                data: [{ id: 'existing-template-id' }],
                error: null
            })

            mockSelect.eq.mockReturnValue({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        limit: mockLimit
                    }))
                }))
            })

            const result = await hasDefaultTemplate(testShopId)

            expect(result).toBe(true)
        })

        test('should handle database errors gracefully', async () => {
            const mockLimit = vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
            })

            mockSelect.eq.mockReturnValue({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        limit: mockLimit
                    }))
                }))
            })

            const result = await hasDefaultTemplate(testShopId)

            expect(result).toBe(false)
        })
    })

    describe('createDefaultTemplate', () => {
        test('should create default template successfully', async () => {
            const mockSingle = vi.fn().mockResolvedValue({
                data: mockTemplate,
                error: null
            })

            mockInsert.select.mockReturnValue({ single: mockSingle })

            const result = await createDefaultTemplate(testShopId)

            expect(result).toEqual(mockTemplate)
            expect(mockFrom).toHaveBeenCalledWith('ai_message_templates')
            expect(mockInsert.select().single).toHaveBeenCalled()
            
            // Verify insert was called with correct data
            const insertCall = mockFrom().insert.mock.calls[0][0]
            expect(insertCall).toMatchObject({
                shop_id: testShopId,
                name: '1 Month Check-up Reminder',
                trigger_type: 'work_order_complete',
                service_type: null,
                delay_hours: TIME_PERIODS.ONE_MONTH,
                is_active: true
            })
            expect(insertCall.message_template).toContain('{{customer_name}}')
        })

        test('should throw error on database failure', async () => {
            const mockSingle = vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed' }
            })

            mockInsert.select.mockReturnValue({ single: mockSingle })

            await expect(createDefaultTemplate(testShopId)).rejects.toThrow(
                'Failed to create default template'
            )
        })
    })

    describe('initializeDefaultTemplate', () => {
        test('should create template if it does not exist', async () => {
            // Mock hasDefaultTemplate to return false
            const mockLimit = vi.fn().mockResolvedValue({
                data: [],
                error: null
            })

            mockSelect.eq.mockReturnValue({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        limit: mockLimit
                    }))
                }))
            })

            // Mock createDefaultTemplate
            const mockSingle = vi.fn().mockResolvedValue({
                data: mockTemplate,
                error: null
            })
            mockInsert.select.mockReturnValue({ single: mockSingle })

            const result = await initializeDefaultTemplate(testShopId)

            expect(result).toEqual(mockTemplate)
            expect(mockFrom).toHaveBeenCalledWith('ai_message_templates')
        })

        test('should return null if template already exists', async () => {
            // Mock hasDefaultTemplate to return true
            const mockLimit = vi.fn().mockResolvedValue({
                data: [{ id: 'existing-id' }],
                error: null
            })

            mockSelect.eq.mockReturnValue({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        limit: mockLimit
                    }))
                }))
            })

            const result = await initializeDefaultTemplate(testShopId)

            expect(result).toBeNull()
            // Should not call insert
            expect(mockFrom().insert).not.toHaveBeenCalled()
        })
    })

    describe('getDefaultTemplate', () => {
        test('should return template if it exists', async () => {
            const mockSingle = vi.fn().mockResolvedValue({
                data: mockTemplate,
                error: null
            })

            mockSelect.eq.mockReturnValue({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: mockSingle
                    }))
                }))
            })

            const result = await getDefaultTemplate(testShopId)

            expect(result).toEqual(mockTemplate)
        })

        test('should return null if template does not exist', async () => {
            const mockSingle = vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' }
            })

            mockSelect.eq.mockReturnValue({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: mockSingle
                    }))
                }))
            })

            const result = await getDefaultTemplate(testShopId)

            expect(result).toBeNull()
        })

        test('should throw error on database error', async () => {
            const mockSingle = vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'OTHER_ERROR', message: 'Database error' }
            })

            mockSelect.eq.mockReturnValue({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: mockSingle
                    }))
                }))
            })

            await expect(getDefaultTemplate(testShopId)).rejects.toThrow()
        })
    })
})

