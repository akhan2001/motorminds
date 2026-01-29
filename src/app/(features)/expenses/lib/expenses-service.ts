import { createClient } from '@/utils/supabase/client'
import type {
    ExpenseItem,
    CreateExpenseRequest,
    UpdateExpenseRequest,
    ExpenseFilters,
    ExpensesResponse,
} from '../types/expenses'

export class ExpensesService {
    private static supabase = createClient()

    /**
     * Get all expenses for a shop with optional filtering and pagination
     */
    static async getExpenses(
        shopId: string,
        filters: ExpenseFilters = {},
        page: number = 1,
        limit: number = 50
    ): Promise<ExpensesResponse> {
        try {
            let query = this.supabase
                .from('expenses')
                .select('*', { count: 'exact' })
                .eq('shop_id', shopId)

            // Apply filters
            if (filters.work_order_id) {
                query = query.eq('work_order_id', filters.work_order_id)
            }

            if (filters.invoice_id) {
                query = query.eq('invoice_id', filters.invoice_id)
            }

            if (filters.source_type) {
                query = query.eq('source_type', filters.source_type)
            }

            if (filters.category) {
                query = query.eq('category', filters.category)
            }

            if (filters.vendor) {
                query = query.ilike('vendor', `%${filters.vendor}%`)
            }

            if (filters.date_from) {
                query = query.gte('expense_date', filters.date_from)
            }

            if (filters.date_to) {
                query = query.lte('expense_date', filters.date_to)
            }

            // Text search across multiple fields
            if (filters.search) {
                query = query.or(`
                    description.ilike.%${filters.search}%,
                    vendor.ilike.%${filters.search}%,
                    invoice_number.ilike.%${filters.search}%,
                    notes.ilike.%${filters.search}%
                `)
            }

            // Archive filter
            if (filters.archived !== undefined) {
                if (filters.archived) {
                    query = query.eq('archived', true)
                } else {
                    query = query.or('archived.eq.false,archived.is.null')
                }
            } else {
                // Default: exclude archived unless explicitly requested
                query = query.or('archived.eq.false,archived.is.null')
            }

            // Pagination
            const offset = (page - 1) * limit
            query = query
                .order('expense_date', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

            const { data, error, count } = await query

            if (error) {
                console.error('Error fetching expenses:', error)
                throw new Error(`Failed to fetch expenses: ${error.message}`)
            }

            return {
                expenses: data || [],
                total: count || 0,
                page,
                limit,
            }
        } catch (error) {
            console.error('ExpensesService.getExpenses error:', error)
            throw error
        }
    }

    /**
     * Get a single expense by ID
     */
    static async getExpense(id: string, shopId: string): Promise<ExpenseItem> {
        try {
            const { data, error } = await this.supabase
                .from('expenses')
                .select('*')
                .eq('id', id)
                .eq('shop_id', shopId)
                .single()

            if (error) {
                console.error('Error fetching expense:', error)
                throw new Error(`Failed to fetch expense: ${error.message}`)
            }

            if (!data) {
                throw new Error('Expense not found')
            }

            return data
        } catch (error) {
            console.error('ExpensesService.getExpense error:', error)
            throw error
        }
    }

    /**
     * Get expenses for a specific work order
     */
    static async getExpensesByWorkOrder(
        workOrderId: string,
        shopId: string
    ): Promise<ExpenseItem[]> {
        try {
            const { data, error } = await this.supabase
                .from('expenses')
                .select('*')
                .eq('work_order_id', workOrderId)
                .eq('shop_id', shopId)
                .or('archived.eq.false,archived.is.null')
                .order('expense_date', { ascending: false })

            if (error) {
                console.error('Error fetching work order expenses:', error)
                throw new Error(`Failed to fetch work order expenses: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('ExpensesService.getExpensesByWorkOrder error:', error)
            throw error
        }
    }

    /**
     * Get expenses for a specific invoice
     */
    static async getExpensesByInvoice(
        invoiceId: string,
        shopId: string
    ): Promise<ExpenseItem[]> {
        try {
            const { data, error } = await this.supabase
                .from('expenses')
                .select('*')
                .eq('invoice_id', invoiceId)
                .eq('shop_id', shopId)
                .or('archived.eq.false,archived.is.null')
                .order('expense_date', { ascending: false })

            if (error) {
                console.error('Error fetching invoice expenses:', error)
                throw new Error(`Failed to fetch invoice expenses: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('ExpensesService.getExpensesByInvoice error:', error)
            throw error
        }
    }

    /**
     * Create a new expense
     */
    static async createExpense(
        shopId: string,
        data: CreateExpenseRequest
    ): Promise<ExpenseItem> {
        try {
            // Validate required fields
            if (!data.description?.trim()) {
                throw new Error('Description is required')
            }
            if (!data.category?.trim()) {
                throw new Error('Category is required')
            }
            if (!data.expense_date) {
                throw new Error('Expense date is required')
            }
            if (data.total <= 0) {
                throw new Error('Total must be greater than 0')
            }

            // Ensure shop_id matches
            const expenseData = {
                ...data,
                shop_id: shopId,
                // Set defaults
                tax_rate: data.tax_rate ?? 0.13,
                tax_included: data.tax_included ?? true,
                tax_amount: data.tax_amount ?? 0,
                is_billable: data.is_billable ?? false,
                archived: false,
            }

            const { data: expense, error } = await this.supabase
                .from('expenses')
                .insert([expenseData])
                .select()
                .single()

            if (error) {
                console.error('Error creating expense:', error)
                throw new Error(`Failed to create expense: ${error.message}`)
            }

            return expense
        } catch (error) {
            console.error('ExpensesService.createExpense error:', error)
            throw error
        }
    }

    /**
     * Update an existing expense
     */
    static async updateExpense(
        id: string,
        shopId: string,
        data: UpdateExpenseRequest
    ): Promise<ExpenseItem> {
        try {
            const updateData: any = {
                ...data,
                updated_at: new Date().toISOString(),
            }

            // If archiving, set archived_at timestamp
            if (data.archived === true && !data.archived_at) {
                updateData.archived_at = new Date().toISOString()
            } else if (data.archived === false) {
                updateData.archived_at = null
            }

            const { data: expense, error } = await this.supabase
                .from('expenses')
                .update(updateData)
                .eq('id', id)
                .eq('shop_id', shopId)
                .select()
                .single()

            if (error) {
                console.error('Error updating expense:', error)
                throw new Error(`Failed to update expense: ${error.message}`)
            }

            if (!expense) {
                throw new Error('Expense not found')
            }

            return expense
        } catch (error) {
            console.error('ExpensesService.updateExpense error:', error)
            throw error
        }
    }

    /**
     * Link expense to an invoice (for work order expenses that get invoiced)
     */
    static async linkExpenseToInvoice(
        expenseId: string,
        shopId: string,
        invoiceId: string
    ): Promise<ExpenseItem> {
        try {
            const { data: expense, error } = await this.supabase
                .from('expenses')
                .update({
                    invoice_id: invoiceId,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', expenseId)
                .eq('shop_id', shopId)
                .select()
                .single()

            if (error) {
                console.error('Error linking expense to invoice:', error)
                throw new Error(`Failed to link expense to invoice: ${error.message}`)
            }

            if (!expense) {
                throw new Error('Expense not found')
            }

            return expense
        } catch (error) {
            console.error('ExpensesService.linkExpenseToInvoice error:', error)
            throw error
        }
    }

    /**
     * Archive an expense (soft delete)
     */
    static async archiveExpense(
        id: string,
        shopId: string
    ): Promise<ExpenseItem> {
        try {
            const { data: expense, error } = await this.supabase
                .from('expenses')
                .update({
                    archived: true,
                    archived_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .eq('shop_id', shopId)
                .select()
                .single()

            if (error) {
                console.error('Error archiving expense:', error)
                throw new Error(`Failed to archive expense: ${error.message}`)
            }

            if (!expense) {
                throw new Error('Expense not found')
            }

            return expense
        } catch (error) {
            console.error('ExpensesService.archiveExpense error:', error)
            throw error
        }
    }

    /**
     * Delete an expense permanently (hard delete)
     */
    static async deleteExpense(id: string, shopId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('expenses')
                .delete()
                .eq('id', id)
                .eq('shop_id', shopId)

            if (error) {
                console.error('Error deleting expense:', error)
                throw new Error(`Failed to delete expense: ${error.message}`)
            }
        } catch (error) {
            console.error('ExpensesService.deleteExpense error:', error)
            throw error
        }
    }

    /**
     * Get expense summary statistics for a shop
     */
    static async getExpenseSummary(
        shopId: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<{
        totalExpenses: number
        totalAmount: number
        byCategory: Record<string, { count: number; total: number }>
        bySourceType: Record<string, { count: number; total: number }>
    }> {
        try {
            let query = this.supabase
                .from('expenses')
                .select('total, category, source_type')
                .eq('shop_id', shopId)
                .or('archived.eq.false,archived.is.null')

            if (dateFrom) {
                query = query.gte('expense_date', dateFrom)
            }

            if (dateTo) {
                query = query.lte('expense_date', dateTo)
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching expense summary:', error)
                throw new Error(`Failed to fetch expense summary: ${error.message}`)
            }

            const expenses = data || []
            const totalExpenses = expenses.length
            const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.total || 0), 0)

            // Group by category
            const byCategory: Record<string, { count: number; total: number }> = {}
            expenses.forEach((exp) => {
                const cat = exp.category || 'Other'
                if (!byCategory[cat]) {
                    byCategory[cat] = { count: 0, total: 0 }
                }
                byCategory[cat].count++
                byCategory[cat].total += Number(exp.total || 0)
            })

            // Group by source type
            const bySourceType: Record<string, { count: number; total: number }> = {}
            expenses.forEach((exp) => {
                const source = exp.source_type || 'general'
                if (!bySourceType[source]) {
                    bySourceType[source] = { count: 0, total: 0 }
                }
                bySourceType[source].count++
                bySourceType[source].total += Number(exp.total || 0)
            })

            return {
                totalExpenses,
                totalAmount,
                byCategory,
                bySourceType,
            }
        } catch (error) {
            console.error('ExpensesService.getExpenseSummary error:', error)
            throw error
        }
    }
}