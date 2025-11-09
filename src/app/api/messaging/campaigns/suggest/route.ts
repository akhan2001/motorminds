import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'
import OpenAI from 'openai'
import { CAMPAIGN_SUGGESTION_SYSTEM_PROMPT, buildAnalysisPrompt, type WorkOrderAnalysis, type CampaignSuggestionsResponse } from '@/app/(features)/messaging/lib/ai-campaign-prompt'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { date_range_days = 60 } = await request.json()
        const supabase = await createClient()

        // Query work orders for analysis
        const { data: workOrders, error } = await supabase
            .from('work_orders')
            .select(`
                id,
                title,
                status,
                completed_at,
                total_amount,
                customer_id,
                customer:customers(id, customer_name),
                vehicle:customer_vehicles(make, model, year)
            `)
            .eq('shop_id', shopId)
            .eq('status', 'completed')
            .gte('completed_at', new Date(Date.now() - date_range_days * 24 * 60 * 60 * 1000).toISOString())
            .order('completed_at', { ascending: false })
            .limit(500) // Limit for performance

        if (error) throw error

        // Aggregate data for AI analysis
        const serviceTypes = new Map<string, number>()
        const vehicleMakes = new Map<string, number>()
        const customerFrequency = new Map<string, number>()
        const revenueByService = new Map<string, number>()

        workOrders?.forEach(wo => {
            // Count service types
            const title = wo.title?.toLowerCase() || ''
            let serviceType = 'other'
            
            if (title.includes('oil change')) serviceType = 'oil_change'
            else if (title.includes('brake')) serviceType = 'brake_service'
            else if (title.includes('tire')) serviceType = 'tire_service'
            else if (title.includes('inspection')) serviceType = 'inspection'
            else if (title.includes('alignment')) serviceType = 'wheel_alignment'
            else if (title.includes('battery')) serviceType = 'battery_service'
            else if (title.includes('transmission')) serviceType = 'transmission_service'
            else if (title.includes('diagnostic')) serviceType = 'diagnostic'

            serviceTypes.set(serviceType, (serviceTypes.get(serviceType) || 0) + 1)

            // Track revenue by service
            if (wo.total_amount) {
                revenueByService.set(serviceType, (revenueByService.get(serviceType) || 0) + wo.total_amount)
            }

            // Count vehicle makes
            const vehicle = Array.isArray(wo.vehicle) ? wo.vehicle[0] : wo.vehicle
            if (vehicle?.make) {
                vehicleMakes.set(vehicle.make, (vehicleMakes.get(vehicle.make) || 0) + 1)
            }

            // Track customer frequency
            if (wo.customer_id) {
                customerFrequency.set(wo.customer_id, (customerFrequency.get(wo.customer_id) || 0) + 1)
            }
        })

        // Prepare analysis data
        const analysisData: WorkOrderAnalysis = {
            total_work_orders: workOrders?.length || 0,
            date_range_days,
            service_types: Object.fromEntries(serviceTypes),
            top_vehicle_makes: Array.from(vehicleMakes.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([make, count]) => ({ make, count })),
            repeat_customers: Array.from(customerFrequency.values())
                .filter(count => count > 1).length,
            revenue_by_service: Object.fromEntries(revenueByService)
        }

        // Call OpenAI for suggestions
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: CAMPAIGN_SUGGESTION_SYSTEM_PROMPT },
                { role: 'user', content: buildAnalysisPrompt(analysisData) }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2000
        })

        const response: CampaignSuggestionsResponse = JSON.parse(
            completion.choices[0]?.message?.content || '{"suggestions":[]}'
        )

        return NextResponse.json({
            suggestions: response.suggestions || [],
            analysis_summary: {
                total_work_orders: analysisData.total_work_orders,
                date_range_days: analysisData.date_range_days,
                top_services: Object.entries(analysisData.service_types)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => ({ type, count }))
            }
        })

    } catch (error: any) {
        console.error('Error generating campaign suggestions:', error)
        return NextResponse.json(
            { error: 'Failed to generate suggestions', details: error.message },
            { status: 500 }
        )
    }
}

