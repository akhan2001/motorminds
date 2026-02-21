import { createClient } from '@/utils/supabase/client'
import type {
    CreditRefundItem,
    CreateCreditRefundRequest,
    UpdateCreditRefundRequest,
    CreditRefundFilters,
    CreditsRefundsResponse,
    CreditRefundHistoryEntry,
} from '../types/credits-refunds'

export class CreditsRefundsService {
    private static supabase = createClient()

    /**
     * Get all credits/refunds for a shop with optional filtering
     */
    static async getCreditsRefunds(
        shopId: string,
        filters: CreditRefundFilters = {}
    ): Promise<CreditsRefundsResponse> {
        try {
            let query = this.supabase
                .from('credits_refunds')
                .select('*',
                    { count: 'exact' }
                )
                .eq('shop_id', shopId)

            if (filters.date_from) {
                const dateFrom = filters.date_from.split('T')[0]
                query = query.gte('refund_date', dateFrom)
            }

            if (filters.date_to) {
                const dateTo = filters.date_to.split('T')[0]
                query = query.lte('refund_date', dateTo)
            }

            if (filters.supplier) {
                query = query.ilike('supplier', `%${filters.supplier}%`)
            }

            if (filters.status) {
                query = query.eq('status', filters.status)
            }

            if (filters.amount_min !== undefined) {
                query = query.gte('amount', filters.amount_min)
            }

            if (filters.amount_max !== undefined) {
                query = query.lte('amount', filters.amount_max)
            }

            if (filters.search) {
                query = query.or(`
                    reason.ilike.%${filters.search}%,
                    supplier.ilike.%${filters.search}%,
                    notes.ilike.%${filters.search}%,
                    description.ilike.%${filters.search}%,
                    part_number.ilike.%${filters.search}%,
                    parts_description.ilike.%${filters.search}%,
                    invoice_number.ilike.%${filters.search}%
                `)
            }

            if (filters.archived !== undefined) {
                if (filters.archived) {
                    query = query.eq('archived', true)
                } else {
                    query = query.or('archived.eq.false,archived.is.null')
                }
            } else {
                query = query.or('archived.eq.false,archived.is.null')
            }

            query = query
                .order('refund_date', { ascending: false })
                .order('created_at', { ascending: false })

            const { data, error, count } = await query

            if (error) {
                console.error('Error fetching credits/refunds:', error)
                throw new Error(`Failed to fetch credits/refunds: ${error.message}`)
            }

            return {
                creditsRefunds: data || [],
                total: count || 0,
                page: 1,
                limit: count || 0,
            }
        } catch (error) {
            console.error('CreditsRefundsService.getCreditsRefunds error:', error)
            throw error
        }
    }

    /**
     * Get a single credit/refund by ID
     */
    static async getCreditRefund(id: string, shopId: string): Promise<CreditRefundItem | null> {
        try {
            const { data, error } = await this.supabase
                .from('credits_refunds')
                .select('*')
                .eq('id', id)
                .eq('shop_id', shopId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') return null
                console.error('Error fetching credit/refund:', error)
                throw new Error(`Failed to fetch credit/refund: ${error.message}`)
            }

            return data
        } catch (error) {
            console.error('CreditsRefundsService.getCreditRefund error:', error)
            throw error
        }
    }

    /**
     * Create a new credit/refund
     */
    static async createCreditRefund(
        shopId: string,
        data: CreateCreditRefundRequest
    ): Promise<CreditRefundItem> {
        try {
            if (!data.reason?.trim()) {
                throw new Error('Reason is required')
            }
            if (!data.refund_date) {
                throw new Error('Refund date is required')
            }
            if (!data.amount || data.amount <= 0) {
                throw new Error('Amount must be greater than 0')
            }
            if (!data.description?.trim()) {
                throw new Error('Description is required')
            }

            const insertData = {
                shop_id: shopId,
                amount: data.amount,
                supplier: data.supplier || null,
                supplier_id: data.supplier_id || null,
                reason: data.reason.trim(),
                part_number: data.part_number?.trim() || null,
                description: data.description?.trim() || null,
                parts_description: data.parts_description?.trim() || null,
                invoice_number: data.invoice_number?.trim() || null,
                status: data.status || 'pending',
                refund_date: data.refund_date.split('T')[0],
                notes: data.notes?.trim() || null,
                archived: false,
            }

            const { data: creditRefund, error } = await this.supabase
                .from('credits_refunds')
                .insert([insertData])
                .select()
                .single()

            if (error) {
                const errMsg =
                    error.message ||
                    (error as { details?: string }).details ||
                    JSON.stringify(error)
                console.error('Error creating credit/refund:', error)
                throw new Error(`Failed to create credit/refund: ${errMsg}`)
            }

            // Create audit history entry
            await this.createHistoryEntry(creditRefund.id, 'created', null, insertData)

            return creditRefund
        } catch (error) {
            const err = error as Error & { message?: string; details?: string }
            const msg =
                err?.message ||
                (err as { details?: string })?.details ||
                (typeof error === 'object' && error !== null
                    ? JSON.stringify(error)
                    : String(error))
            console.error('CreditsRefundsService.createCreditRefund error:', msg, error)
            throw error instanceof Error ? error : new Error(msg || 'Failed to create credit/refund')
        }
    }

    /**
     * Update an existing credit/refund
     */
    static async updateCreditRefund(
        id: string,
        shopId: string,
        data: UpdateCreditRefundRequest
    ): Promise<CreditRefundItem> {
        try {
            const { data: existing, error: fetchError } = await this.supabase
                .from('credits_refunds')
                .select('*')
                .eq('id', id)
                .eq('shop_id', shopId)
                .single()

            if (fetchError || !existing) {
                throw new Error('Credit/refund not found')
            }

            const updateData: Record<string, unknown> = {
                ...data,
                updated_at: new Date().toISOString(),
            }

            if (data.archived === true && !data.archived_at) {
                updateData.archived_at = new Date().toISOString()
            } else if (data.archived === false) {
                updateData.archived_at = null
            }

            if (data.refund_date) {
                updateData.refund_date = data.refund_date.split('T')[0]
            }
            if (data.part_number !== undefined) {
                updateData.part_number = data.part_number?.trim() || null
            }
            if (data.description !== undefined) {
                updateData.description = data.description?.trim() || null
            }
            if (data.parts_description !== undefined) {
                updateData.parts_description = data.parts_description?.trim() || null
            }
            if (data.invoice_number !== undefined) {
                updateData.invoice_number = data.invoice_number?.trim() || null
            }

            const { data: creditRefund, error } = await this.supabase
                .from('credits_refunds')
                .update(updateData)
                .eq('id', id)
                .eq('shop_id', shopId)
                .select()
                .single()

            if (error) {
                console.error('Error updating credit/refund:', error)
                throw new Error(`Failed to update credit/refund: ${error.message}`)
            }

            const action = data.status && data.status !== existing.status ? 'status_changed' : 'updated'
            await this.createHistoryEntry(id, action, existing, updateData)

            return creditRefund
        } catch (error) {
            console.error('CreditsRefundsService.updateCreditRefund error:', error)
            throw error
        }
    }

    /**
     * Archive a credit/refund (soft delete)
     */
    static async archiveCreditRefund(id: string, shopId: string): Promise<CreditRefundItem> {
        return this.updateCreditRefund(id, shopId, {
            archived: true,
            archived_at: new Date().toISOString(),
        })
    }

    /**
     * Delete a credit/refund permanently (hard delete)
     */
    static async deleteCreditRefund(id: string, shopId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('credits_refunds')
                .delete()
                .eq('id', id)
                .eq('shop_id', shopId)

            if (error) {
                console.error('Error deleting credit/refund:', error)
                throw new Error(`Failed to delete credit/refund: ${error.message}`)
            }
        } catch (error) {
            console.error('CreditsRefundsService.deleteCreditRefund error:', error)
            throw error
        }
    }

    /**
     * Get history entries for a credit/refund
     */
    static async getHistory(creditsRefundId: string, shopId: string): Promise<CreditRefundHistoryEntry[]> {
        try {
            const { data: creditRefund } = await this.supabase
                .from('credits_refunds')
                .select('id')
                .eq('id', creditsRefundId)
                .eq('shop_id', shopId)
                .single()

            if (!creditRefund) return []

            const { data, error } = await this.supabase
                .from('credits_refunds_history')
                .select('*')
                .eq('credits_refund_id', creditsRefundId)
                .order('changed_at', { ascending: false })

            if (error) {
                console.error('Error fetching history:', error)
                return []
            }

            return (data || []) as CreditRefundHistoryEntry[]
        } catch (error) {
            console.error('CreditsRefundsService.getHistory error:', error)
            return []
        }
    }

    /**
     * Create a history entry (internal)
     */
    private static async createHistoryEntry(
        creditsRefundId: string,
        action: string,
        oldValues: Record<string, unknown> | null,
        newValues: Record<string, unknown>
    ): Promise<void> {
        try {
            const { data: { user } } = await this.supabase.auth.getUser()
            await this.supabase.from('credits_refunds_history').insert({
                credits_refund_id: creditsRefundId,
                action,
                changed_by: user?.id || null,
                old_values: oldValues,
                new_values: newValues,
            })
        } catch (err) {
            console.error('Failed to create history entry:', err)
        }
    }

    /**
     * Get summary statistics for a shop
     */
    static async getSummary(
        shopId: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<{
        totalAmount: number
        count: number
        byStatus: Record<string, { count: number; total: number }>
    }> {
        try {
            let query = this.supabase
                .from('credits_refunds')
                .select('amount, status')
                .eq('shop_id', shopId)
                .or('archived.eq.false,archived.is.null')

            if (dateFrom) {
                query = query.gte('refund_date', dateFrom.split('T')[0])
            }
            if (dateTo) {
                query = query.lte('refund_date', dateTo.split('T')[0])
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching summary:', error)
                throw new Error(`Failed to fetch summary: ${error.message}`)
            }

            const items = data || []
            const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
            const byStatus: Record<string, { count: number; total: number }> = {}

            items.forEach((item) => {
                const status = item.status || 'pending'
                if (!byStatus[status]) {
                    byStatus[status] = { count: 0, total: 0 }
                }
                byStatus[status].count++
                byStatus[status].total += Number(item.amount || 0)
            })

            return {
                totalAmount,
                count: items.length,
                byStatus,
            }
        } catch (error) {
            console.error('CreditsRefundsService.getSummary error:', error)
            throw error
        }
    }
}
