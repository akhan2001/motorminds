import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { isResendConfigured } from '@/app/(features)/financials/lib/email/resend-client'

// GET /api/email/stats - Get email statistics and service status
export async function GET() {
    try {
        const isConfigured = isResendConfigured()
        const supabase = await createClient()
        const shopId = await getShopIdForUser()

        if (!shopId) {
            return NextResponse.json({
                isConfigured,
                service: 'Resend',
                stats: null,
                error: 'Shop not found'
            })
        }

        // Get current date info for filtering
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        // Get total count
        const { count: totalCount, error: totalError } = await supabase
            .from('invoice_emails')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)

        // Get today's count
        const { count: todayCount, error: todayError } = await supabase
            .from('invoice_emails')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .gte('sent_at', todayStart)

        // Get this week's count
        const { count: weekCount, error: weekError } = await supabase
            .from('invoice_emails')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .gte('sent_at', weekStart)

        // Get this month's count
        const { count: monthCount, error: monthError } = await supabase
            .from('invoice_emails')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .gte('sent_at', monthStart)

        // Get sent vs failed counts
        const { count: sentCount, error: sentError } = await supabase
            .from('invoice_emails')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('status', 'sent')

        const { count: failedCount, error: failedError } = await supabase
            .from('invoice_emails')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('status', 'failed')

        if (totalError || todayError || weekError || monthError || sentError || failedError) {
            console.error('Error fetching email stats:', { totalError, todayError, weekError, monthError, sentError, failedError })
        }

        return NextResponse.json({
            isConfigured,
            service: 'Resend',
            stats: {
                total: totalCount || 0,
                today: todayCount || 0,
                thisWeek: weekCount || 0,
                thisMonth: monthCount || 0,
                sent: sentCount || 0,
                failed: failedCount || 0
            }
        })
    } catch (error) {
        console.error('Error checking email status:', error)
        return NextResponse.json(
            {
                isConfigured: false,
                error: 'Failed to check email status',
                stats: null
            },
            { status: 500 }
        )
    }
}
