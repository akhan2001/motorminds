import { supabase } from '@/lib/supabase'
import { MiaCustomerInsight, InsightsResponse } from '../types/mia-insights'

// MIA Insights Service
export class MiaInsightsService {
    static async getInsights(workOrderId: string, shopId: string): Promise<MiaCustomerInsight | null> {
        try {
            const { data, error } = await supabase
                .from('mia_insights')
                .select('*')
                .eq('work_order_id', workOrderId)
                .eq('shop_id', shopId)
                .maybeSingle()

            if (error) {
                console.error('Error fetching MIA insights:', error)
                return null
            }

            return data
        } catch (error) {
            console.error('Error in getInsights:', error)
            return null
        }
    }
    
    static async generateInsights(workOrderId: string, shopId: string): Promise<InsightsResponse> {
        try {
            const response = await fetch('/api/mia-insights/work-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workOrderId, shopId })
            })

            if (!response.ok) {
                throw new Error('Failed to generate insights')
            }

            return await response.json()
        } catch (error) {
            console.error('Error generating insights:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
    
    static async saveInsights(insights: MiaCustomerInsight): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('mia_insights')
                .insert(insights)

            if (error) {
                console.error('Error saving insights:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('Error in saveInsights:', error)
            return false
        }
    }

    static async updateInsights(id: string, updates: Partial<MiaCustomerInsight>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('mia_insights')
                .update(updates)
                .eq('id', id)

            if (error) {
                console.error('Error updating insights:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('Error in updateInsights:', error)
            return false
        }
    }
}
