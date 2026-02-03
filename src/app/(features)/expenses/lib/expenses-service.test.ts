import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ExpenseItem, CreateExpenseRequest } from '../types/expenses'

// Helper to create chainable mock that returns itself for any method call
const createChainableMock = (finalResult: any = {}) => {
    const mock: any = vi.fn(() => mock)
    // Common Supabase methods that should be chainable
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 
                     'like', 'ilike', 'is', 'in', 'contains', 'or', 'and', 'not', 'filter',
                     'order', 'limit', 'range', 'single', 'maybeSingle']
    methods.forEach(method => {
        mock[method] = vi.fn(() => mock)
    })
    // Allow setting the final resolved value
    mock.mockResolvedValue = (value: any) => {
        mock.then = (resolve: any) => Promise.resolve(value).then(resolve)
        return mock
    }
    mock.mockResolvedValue(finalResult)
    return mock
}

// Mock the Supabase client (hoisted so it's available inside vi.mock factory)
const mockSupabaseClient = vi.hoisted(() => ({
    from: vi.fn(() => createChainableMock()),
    auth: {
        getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id', email: 'test@example.com' } },
            error: null
        })
    }
}))

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => mockSupabaseClient
}))

// Mock expense data fixtures
const mockExpenseData: Partial<CreateExpenseRequest> = {
    shop_id: 'shop-123',
    source_type: 'general',
    description: 'Test Expense',
    category: 'Supplies',
    subtotal: 100.00,
    tax_amount: 13.00,
    tax_rate: 0.13,
    tax_included: true,
    total: 113.00,
    vendor: 'Test Vendor',
    invoice_number: 'INV-001',
    payment_method: 'credit_card',
    expense_date: '2024-01-29',
    notes: 'Test notes',
    is_billable: false,
}

const mockExpense: ExpenseItem = {
    id: 'expense-1',
    shop_id: 'shop-123',
    source_type: 'general',
    description: 'Test Expense',
    category: 'Supplies',
    subtotal: 100.00,
    tax_amount: 13.00,
    tax_rate: 0.13,
    tax_included: true,
    total: 113.00,
    vendor: 'Test Vendor',
    invoice_number: 'INV-001',
    payment_method: 'credit_card',
    expense_date: '2024-01-29',
    notes: 'Test notes',
    is_billable: false,
    archived: false,
    created_at: '2024-01-29T10:00:00Z',
    updated_at: '2024-01-29T10:00:00Z',
    work_order_id: null,
    invoice_id: null,
    original_work_order_id: null,
    archived_at: null,
    resolution_type: null,
    resolution_note: null,
    refund_amount: null,
    resolved_at: null,
}

describe('ExpensesService', () => {
    let ExpensesService: any

    beforeEach(async () => {
        const mod = await import('./expenses-service')
        ExpensesService = mod.ExpensesService
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('CREATE Operations', () => {
        test('should create a general expense successfully', async () => {
            // Arrange
            const mockCreatedExpense = { ...mockExpense }
            const mockQuery = createChainableMock({ data: mockCreatedExpense, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.createExpense('shop-123', mockExpenseData)

            // Assert
            expect(result).toEqual(mockCreatedExpense)
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('expenses')
            expect(result.source_type).toBe('general')
            expect(result.total).toBe(113.00)
        })

        test('should create a work order expense successfully', async () => {
            // Arrange
            const workOrderExpenseData = {
                ...mockExpenseData,
                work_order_id: 'wo-123',
                source_type: 'work_order' as const,
            }
            const mockCreatedExpense = {
                ...mockExpense,
                work_order_id: 'wo-123',
                source_type: 'work_order',
            }
            const mockQuery = createChainableMock({ data: mockCreatedExpense, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.createExpense('shop-123', workOrderExpenseData)

            // Assert
            expect(result.work_order_id).toBe('wo-123')
            expect(result.source_type).toBe('work_order')
        })

        test('should handle creation error', async () => {
            // Arrange
            const mockQuery = createChainableMock({ data: null, error: { message: 'Creation failed' } })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act & Assert
            await expect(ExpensesService.createExpense('shop-123', mockExpenseData))
                .rejects.toThrow('Failed to create expense')
        })
    })

    describe('READ Operations', () => {
        test('should get a single expense by ID', async () => {
            // Arrange
            const mockQuery = createChainableMock({ data: mockExpense, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.getExpense('expense-1', 'shop-123')

            // Assert
            expect(result).toEqual(mockExpense)
            expect(result.id).toBe('expense-1')
            expect(result.description).toBe('Test Expense')
        })

        test('should get all expenses with filters', async () => {
            // Arrange
            const mockExpenses = [mockExpense, { ...mockExpense, id: 'expense-2' }]
            const mockQuery = createChainableMock({ data: mockExpenses, error: null, count: 2 })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.getExpenses('shop-123', { source_type: 'general' })

            // Assert
            expect(result.expenses).toBeInstanceOf(Array)
            expect(result.expenses.length).toBe(2)
        })

        test('should filter expenses by date range', async () => {
            // Arrange
            const mockExpenses = [mockExpense]
            const mockQuery = createChainableMock({ data: mockExpenses, error: null, count: 1 })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.getExpenses('shop-123', {
                date_from: '2024-01-29',
                date_to: '2024-01-29',
            })

            // Assert
            expect(result.expenses).toHaveLength(1)
        })

        test('should handle read error', async () => {
            // Arrange
            const mockQuery = createChainableMock({ data: null, error: { message: 'Not found' } })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act & Assert
            await expect(ExpensesService.getExpense('nonexistent', 'shop-123'))
                .rejects.toThrow()
        })

        test('should get expenses by work order', async () => {
            // Arrange
            const mockWorkOrderExpenses = [
                { ...mockExpense, work_order_id: 'wo-123', source_type: 'work_order' }
            ]
            const mockQuery = createChainableMock({ data: mockWorkOrderExpenses, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.getExpensesByWorkOrder('wo-123', 'shop-123')

            // Assert
            expect(result).toBeInstanceOf(Array)
        })
    })

    describe('UPDATE Operations', () => {
        test('should update expense description', async () => {
            // Arrange
            const updatedExpense = { ...mockExpense, description: 'Updated Description' }
            const mockQuery = createChainableMock({ data: updatedExpense, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.updateExpense('expense-1', 'shop-123', {
                description: 'Updated Description',
            })

            // Assert
            expect(result.description).toBe('Updated Description')
        })

        test('should update expense amount', async () => {
            // Arrange
            const updatedExpense = { ...mockExpense, subtotal: 150.00, total: 169.50 }
            const mockQuery = createChainableMock({ data: updatedExpense, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.updateExpense('expense-1', 'shop-123', {
                subtotal: 150.00,
                tax_amount: 19.50,
                total: 169.50,
            })

            // Assert
            expect(result.subtotal).toBe(150.00)
            expect(result.total).toBe(169.50)
        })

        test('should archive an expense', async () => {
            // Arrange
            const archivedExpense = {
                ...mockExpense,
                archived: true,
                archived_at: '2024-01-29T12:00:00Z'
            }
            const mockQuery = createChainableMock({ data: archivedExpense, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.archiveExpense('expense-1', 'shop-123')

            // Assert
            expect(result.archived).toBe(true)
            expect(result.archived_at).toBeDefined()
        })

        test('should resolve an expense', async () => {
            // Arrange
            const resolvedExpense = {
                ...mockExpense,
                resolution_type: 'returned',
                resolution_note: 'Returned to supplier',
                refund_amount: 113.00,
                resolved_at: '2024-01-29T12:00:00Z'
            }
            const mockQuery = createChainableMock({ data: resolvedExpense, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.resolveExpense('expense-1', 'shop-123', {
                resolution_type: 'returned',
                resolution_note: 'Returned to supplier',
                refund_amount: 113.00,
            })

            // Assert
            expect(result.resolution_type).toBe('returned')
            expect(result.refund_amount).toBe(113.00)
            expect(result.resolved_at).toBeDefined()
        })

        test('should handle update error', async () => {
            // Arrange
            const mockQuery = createChainableMock({ data: null, error: { message: 'Update failed' } })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act & Assert
            await expect(ExpensesService.updateExpense('expense-1', 'shop-123', { description: 'test' }))
                .rejects.toThrow('Failed to update expense')
        })
    })

    describe('DELETE Operations', () => {
        test('should permanently delete an expense', async () => {
            // Arrange
            const mockQuery = createChainableMock({ error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act & Assert
            await expect(ExpensesService.deleteExpense('expense-1', 'shop-123'))
                .resolves.not.toThrow()
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('expenses')
        })

        test('should handle delete error', async () => {
            // Arrange
            const mockQuery = createChainableMock({ error: { message: 'Delete failed' } })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act & Assert
            await expect(ExpensesService.deleteExpense('expense-1', 'shop-123'))
                .rejects.toThrow('Failed to delete expense')
        })
    })

    describe('Summary Operations', () => {
        test('should get expense summary statistics', async () => {
            // Arrange
            const mockExpenses = [
                { ...mockExpense, category: 'Category A', total: 113.00, source_type: 'general' },
                { ...mockExpense, id: 'expense-2', category: 'Category A', total: 226.00, source_type: 'general' },
            ]
            const mockQuery = createChainableMock({ data: mockExpenses, error: null, count: 2 })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.getExpenseSummary('shop-123')

            // Assert
            expect(result.totalExpenses).toBeGreaterThanOrEqual(2)
            expect(result.totalAmount).toBeGreaterThanOrEqual(339.00)
        })

        test('should get unique categories', async () => {
            // Arrange
            const mockCategories = [
                { category: 'Supplies' },
                { category: 'Parts' },
                { category: 'Tools' }
            ]
            const mockQuery = createChainableMock({ data: mockCategories, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.getUniqueCategories('shop-123')

            // Assert
            expect(result).toBeInstanceOf(Array)
            expect(result.length).toBe(3)
        })
    })

    describe('Link Operations', () => {
        test('should link expense to invoice', async () => {
            // Arrange
            const linkedExpense = { ...mockExpense, invoice_id: 'invoice-123' }
            const mockQuery = createChainableMock({ data: linkedExpense, error: null })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.linkExpenseToInvoice(
                'expense-1',
                'shop-123',
                'invoice-123'
            )

            // Assert
            expect(result.invoice_id).toBe('invoice-123')
        })
    })

    describe('Error Handling and Edge Cases', () => {
        test('should handle null data responses gracefully', async () => {
            // Arrange
            const mockQuery = createChainableMock({ data: [], error: null, count: 0 })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act
            const result = await ExpensesService.getExpenses('shop-123')

            // Assert
            expect(result.expenses).toEqual([])
            // The service returns 'total' from the count value
            expect(result.total).toBe(0)
        })

        test('should handle undefined error messages', async () => {
            // Arrange
            const mockQuery = createChainableMock({ data: null, error: { message: undefined } })
            mockSupabaseClient.from.mockReturnValue(mockQuery)

            // Act & Assert
            await expect(ExpensesService.getExpenses('shop-123'))
                .rejects.toThrow('Failed to fetch expenses')
        })
    })
})
