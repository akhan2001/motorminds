import { supabaseAdmin } from '@/lib/supabase-admin'

export interface UsageMetrics {
    shopOnboardingSummary: {
        totalShops: number
        mode: string
    }
    invoices: ShopMetric[]
    workOrders: ShopMetric[]
    appointments: ShopMetric[]
    smsMessages: ShopMetric[]
    miadiagnostics: {
        totalMessages: number
        uniqueSessions: number
        messagesByShop: ShopMetric[]
    }
    dateRange: {
        startDate: string
        endDate: string
    }
}

export interface ShopMetric {
    shopName: string
    shopId: string
    count: number
}

export interface UsageMetricsFilters {
    startDate: string
    endDate: string
    shopIds?: string[] // Optional filter for specific shops
}

export class UsageMetricsService {
    
    /**
     * Get comprehensive usage metrics for all shops within a date range
     */
    static async getUsageMetrics(filters: UsageMetricsFilters): Promise<UsageMetrics> {
        if (!supabaseAdmin) {
            throw new Error('Database connection not configured')
        }

        const { startDate, endDate, shopIds } = filters

        try {
            // Get all metrics in parallel
            const [
                shopOnboarding,
                invoiceMetrics,
                workOrderMetrics,
                appointmentMetrics,
                smsMetrics,
                miaMetrics
            ] = await Promise.all([
                this.getShopOnboardingMetrics(startDate, endDate, shopIds),
                this.getInvoiceMetrics(startDate, endDate, shopIds),
                this.getWorkOrderMetrics(startDate, endDate, shopIds),
                this.getAppointmentMetrics(startDate, endDate, shopIds),
                this.getSMSMetrics(startDate, endDate, shopIds),
                this.getMIADiagnosticsMetrics(startDate, endDate, shopIds)
            ])

            return {
                shopOnboardingSummary: shopOnboarding,
                invoices: invoiceMetrics,
                workOrders: workOrderMetrics,
                appointments: appointmentMetrics,
                smsMessages: smsMetrics,
                miadiagnostics: miaMetrics,
                dateRange: { startDate, endDate }
            }
        } catch (error) {
            console.error('Error fetching usage metrics:', error)
            throw error
        }
    }

    /**
     * Get shop onboarding summary
     */
    private static async getShopOnboardingMetrics(
        startDate: string, 
        endDate: string, 
        shopIds?: string[]
    ): Promise<{ totalShops: number; mode: string }> {
        let query = supabaseAdmin!
            .from('shops')
            .select('id, created_at', { count: 'exact' })
            .gte('created_at', startDate)
            .lte('created_at', endDate + 'T23:59:59.999Z')

        if (shopIds && shopIds.length > 0) {
            query = query.in('id', shopIds)
        }

        const { count, error } = await query

        if (error) {
            console.error('Error fetching shop onboarding metrics:', error)
            throw error
        }

        return {
            totalShops: count || 0,
            mode: 'Public Pilot (Manual Onboarding)' // Default mode
        }
    }

    /**
     * Get invoice metrics by shop
     */
    private static async getInvoiceMetrics(
        startDate: string, 
        endDate: string, 
        shopIds?: string[]
    ): Promise<ShopMetric[]> {
        // Try both invoice tables - public.invoices and public.invoices_table
        const invoiceTables = ['invoices', 'invoices_table']
        let allInvoices: any[] = []

        for (const tableName of invoiceTables) {
            try {
                let query = supabaseAdmin!
                    .from(tableName)
                    .select(`
                        shop_id,
                        created_at,
                        shops!inner(shop_name)
                    `)
                    .gte('created_at', startDate)
                    .lte('created_at', endDate + 'T23:59:59.999Z')

                if (shopIds && shopIds.length > 0) {
                    query = query.in('shop_id', shopIds)
                }

                const { data, error } = await query

                if (!error && data) {
                    allInvoices = [...allInvoices, ...data]
                } else if (error) {
                    console.warn(`Error fetching from ${tableName}:`, error)
                }
            } catch (error) {
                console.warn(`Table ${tableName} not accessible:`, error)
            }
        }

        // Group by shop and count
        const shopCounts = new Map<string, { shopName: string; count: number }>()
        
        allInvoices.forEach((invoice: any) => {
            const shopId = invoice.shop_id
            const shopName = invoice.shops?.shop_name || 'Unknown Shop'
            
            if (shopCounts.has(shopId)) {
                shopCounts.get(shopId)!.count++
            } else {
                shopCounts.set(shopId, { shopName, count: 1 })
            }
        })

        // Convert to array and sort by count descending
        return Array.from(shopCounts.entries())
            .map(([shopId, data]) => ({
                shopId,
                shopName: data.shopName,
                count: data.count
            }))
            .sort((a, b) => b.count - a.count)
    }

    /**
     * Get work order metrics by shop
     */
    private static async getWorkOrderMetrics(
        startDate: string, 
        endDate: string, 
        shopIds?: string[]
    ): Promise<ShopMetric[]> {
        // Try both work order tables - work_orders and repair_orders
        const workOrderTables = ['work_orders', 'repair_orders']
        let allWorkOrders: any[] = []

        for (const tableName of workOrderTables) {
            try {
                let query = supabaseAdmin!
                    .from(tableName)
                    .select(`
                        shop_id,
                        created_at,
                        shops!inner(shop_name)
                    `)
                    .gte('created_at', startDate)
                    .lte('created_at', endDate + 'T23:59:59.999Z')

                if (shopIds && shopIds.length > 0) {
                    query = query.in('shop_id', shopIds)
                }

                const { data, error } = await query

                if (!error && data) {
                    allWorkOrders = [...allWorkOrders, ...data]
                } else if (error) {
                    console.warn(`Error fetching from ${tableName}:`, error)
                }
            } catch (error) {
                console.warn(`Table ${tableName} not accessible:`, error)
            }
        }

        // Group by shop and count
        const shopCounts = new Map<string, { shopName: string; count: number }>()
        
        allWorkOrders.forEach((workOrder: any) => {
            const shopId = workOrder.shop_id
            const shopName = workOrder.shops?.shop_name || 'Unknown Shop'
            
            if (shopCounts.has(shopId)) {
                shopCounts.get(shopId)!.count++
            } else {
                shopCounts.set(shopId, { shopName, count: 1 })
            }
        })

        // Convert to array and sort by count descending
        return Array.from(shopCounts.entries())
            .map(([shopId, data]) => ({
                shopId,
                shopName: data.shopName,
                count: data.count
            }))
            .sort((a, b) => b.count - a.count)
    }

    /**
     * Get appointment metrics by shop
     */
    private static async getAppointmentMetrics(
        startDate: string, 
        endDate: string, 
        shopIds?: string[]
    ): Promise<ShopMetric[]> {
        let query = supabaseAdmin!
            .from('appointments')
            .select(`
                shop_id,
                created_at,
                shops!inner(shop_name)
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDate + 'T23:59:59.999Z')

        if (shopIds && shopIds.length > 0) {
            query = query.in('shop_id', shopIds)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching appointment metrics:', error)
            throw error
        }

        // Group by shop and count
        const shopCounts = new Map<string, { shopName: string; count: number }>()
        
        data?.forEach((appointment: any) => {
            const shopId = appointment.shop_id
            const shopName = appointment.shops?.shop_name || 'Unknown Shop'
            
            if (shopCounts.has(shopId)) {
                shopCounts.get(shopId)!.count++
            } else {
                shopCounts.set(shopId, { shopName, count: 1 })
            }
        })

        // Convert to array and sort by count descending
        return Array.from(shopCounts.entries())
            .map(([shopId, data]) => ({
                shopId,
                shopName: data.shopName,
                count: data.count
            }))
            .sort((a, b) => b.count - a.count)
    }

    /**
     * Get SMS message metrics by shop
     */
    private static async getSMSMetrics(
        startDate: string, 
        endDate: string, 
        shopIds?: string[]
    ): Promise<ShopMetric[]> {
        // Note: SMS messages might be stored in different tables depending on implementation
        // This is a placeholder - need to check actual SMS storage structure
        let query = supabaseAdmin!
            .from('sms_messages')
            .select(`
                shop_id,
                created_at,
                shops!inner(shop_name)
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDate + 'T23:59:59.999Z')

        if (shopIds && shopIds.length > 0) {
            query = query.in('shop_id', shopIds)
        }

        const { data, error } = await query

        if (error) {
            // SMS table might not exist, return empty array
            console.warn('SMS messages table not found or error:', error)
            return []
        }

        // Group by shop and count
        const shopCounts = new Map<string, { shopName: string; count: number }>()
        
        data?.forEach((message: any) => {
            const shopId = message.shop_id
            const shopName = message.shops?.shop_name || 'Unknown Shop'
            
            if (shopCounts.has(shopId)) {
                shopCounts.get(shopId)!.count++
            } else {
                shopCounts.set(shopId, { shopName, count: 1 })
            }
        })

        // Convert to array and sort by count descending
        return Array.from(shopCounts.entries())
            .map(([shopId, data]) => ({
                shopId,
                shopName: data.shopName,
                count: data.count
            }))
            .sort((a, b) => b.count - a.count)
    }

    /**
     * Get MIA diagnostics metrics
     */
    private static async getMIADiagnosticsMetrics(
        startDate: string, 
        endDate: string, 
        shopIds?: string[]
    ): Promise<{
        totalMessages: number
        uniqueSessions: number
        messagesByShop: ShopMetric[]
    }> {
        try {
            // Get MIA messages with session context
            let messagesQuery = supabaseAdmin!
                .from('mia_messages')
                .select(`
                    id,
                    session_id,
                    created_at,
                    mia_sessions!inner(
                        shop_id,
                        shops!inner(shop_name)
                    )
                `)
                .gte('created_at', startDate)
                .lte('created_at', endDate + 'T23:59:59.999Z')

            // Filter by shop IDs if provided
            if (shopIds && shopIds.length > 0) {
                messagesQuery = messagesQuery.in('mia_sessions.shop_id', shopIds)
            }

            const { data: messages, error: messagesError } = await messagesQuery

            if (messagesError) {
                console.warn('MIA messages table not found or error:', messagesError)
                return {
                    totalMessages: 0,
                    uniqueSessions: 0,
                    messagesByShop: []
                }
            }

            // Get unique sessions
            const uniqueSessions = new Set(messages?.map(m => m.session_id) || []).size

            // Group messages by shop
            const shopCounts = new Map<string, { shopName: string; count: number }>()
            
            for (const message of messages || []) {
                try {
                    const session = (message as any).mia_sessions
                    const shopId = session?.shop_id
                    const shopName = session?.shops?.shop_name || 'Unknown Shop'
                    
                    if (shopId) {
                        if (shopCounts.has(shopId)) {
                            shopCounts.get(shopId)!.count++
                        } else {
                            shopCounts.set(shopId, { shopName, count: 1 })
                        }
                    }
                } catch (e) {
                    // Skip messages with invalid context
                    continue
                }
            }

            // Convert to array and sort by count descending
            const messagesByShop = Array.from(shopCounts.entries())
                .map(([shopId, data]) => ({
                    shopId,
                    shopName: data.shopName,
                    count: data.count
                }))
                .sort((a, b) => b.count - a.count)

            return {
                totalMessages: messages?.length || 0,
                uniqueSessions,
                messagesByShop
            }
        } catch (error) {
            console.warn('Error fetching MIA diagnostics metrics:', error)
            return {
                totalMessages: 0,
                uniqueSessions: 0,
                messagesByShop: []
            }
        }
    }

    /**
     * Generate formatted text report
     */
    static generateTextReport(metrics: UsageMetrics): string {
        const { shopOnboardingSummary, invoices, workOrders, appointments, smsMessages, miadiagnostics, dateRange } = metrics

        let report = `Usage Insights Report\n`
        report += `Generated: ${new Date().toLocaleDateString()}\n`
        report += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n`
        report += `\n`

        // Shop Onboarding Summary
        report += `Shop Onboarding Summary\n`
        report += `========================\n`
        report += `Total Shops Onboarded: ${shopOnboardingSummary.totalShops} | Mode: ${shopOnboardingSummary.mode}\n`
        report += `\n`

        // Invoices
        report += `Invoices\n`
        report += `========\n`
        if (invoices.length > 0) {
            invoices.forEach(shop => {
                report += `${shop.shopName} — ${shop.count}\n`
            })
        } else {
            report += `No invoice data available for this period.\n`
        }
        report += `\n`

        // Work Orders
        report += `Work Orders / Repair Orders\n`
        report += `===========================\n`
        if (workOrders.length > 0) {
            workOrders.forEach(shop => {
                report += `${shop.shopName} — ${shop.count}\n`
            })
        } else {
            report += `No work order data available for this period.\n`
        }
        report += `\n`

        // Appointments
        report += `Appointments\n`
        report += `============\n`
        if (appointments.length > 0) {
            appointments.forEach(shop => {
                report += `${shop.shopName} — ${shop.count}\n`
            })
        } else {
            report += `No appointment data available for this period.\n`
        }
        report += `\n`

        // SMS Messages
        report += `SMS Messages/Conversations\n`
        report += `=========================\n`
        if (smsMessages.length > 0) {
            smsMessages.forEach(shop => {
                report += `${shop.shopName} — ${shop.count}\n`
            })
        } else {
            report += `No SMS message data available for this period.\n`
        }
        report += `\n`

        // MIA Diagnostics
        report += `MIA Diagnostics\n`
        report += `===============\n`
        report += `Messages (user + assistant): ${miadiagnostics.totalMessages}\n`
        report += `Unique Sessions: ${miadiagnostics.uniqueSessions}\n`
        report += `\nBy Shop:\n`
        if (miadiagnostics.messagesByShop.length > 0) {
            miadiagnostics.messagesByShop.forEach(shop => {
                report += `${shop.shopName} — ${shop.count}\n`
            })
        } else {
            report += `No MIA diagnostic data available for this period.\n`
        }
        report += `\n`

        // Key Takeaways (placeholder)
        report += `Key Takeaways\n`
        report += `=============\n`
        report += `This report provides insights into shop activity and platform usage.\n`
        report += `Use this data to understand adoption patterns and identify high-engagement shops.\n`
        report += `\n`

        return report
    }
}
