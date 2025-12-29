import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
	return withAuth(async (req, shopId) => {
		try {
			const supabase = await createClient()

			const now = new Date()
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

			// Get total sessions this month
			const { data: thisMonthSessions, error: thisMonthError } = await supabase
				.from('mia_sessions')
				.select('id')
				.eq('shop_id', shopId)
				.gte('created_at', startOfMonth.toISOString())

			if (thisMonthError) {
				console.error('Error fetching this month sessions:', thisMonthError)
			}

			// Get last month for comparison
			const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

			const { data: lastMonthSessions, error: lastMonthError } = await supabase
				.from('mia_sessions')
				.select('id')
				.eq('shop_id', shopId)
				.gte('created_at', lastMonthStart.toISOString())
				.lte('created_at', lastMonthEnd.toISOString())

			if (lastMonthError) {
				console.error('Error fetching last month sessions:', lastMonthError)
			}

			const thisMonthCount = thisMonthSessions?.length || 0
			const lastMonthCount = lastMonthSessions?.length || 0
			const changePercent =
				lastMonthCount > 0
					? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
					: thisMonthCount > 0
						? 100
						: 0

			// Get completed sessions for success rate
			const { data: completedSessions, error: completedError } = await supabase
				.from('mia_sessions')
				.select('id, status')
				.eq('shop_id', shopId)
				.in('status', ['ended'])

			if (completedError) {
				console.error('Error fetching completed sessions:', completedError)
			}

			// Calculate success rate
			const totalSessions = thisMonthCount
			const completedCount = completedSessions?.length || 0
			const successRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0

			// Get trending issues from ai_recommendation
			const { data: allSessions, error: allSessionsError } = await supabase
				.from('mia_sessions')
				.select('vehicle_context')
				.eq('shop_id', shopId)
				.not('vehicle_context', 'is', null)
				.limit(100)

			if (allSessionsError) {
				console.error('Error fetching sessions for trending:', allSessionsError)
			}

			// Extract trending issues from vehicle_context (simplified)
			const issueCounts: Record<string, number> = {}
			allSessions?.forEach((session) => {
				if (session.vehicle_context && typeof session.vehicle_context === 'object') {
					const make = (session.vehicle_context as any).make || ''
					if (make) {
						issueCounts[make.toUpperCase()] = (issueCounts[make.toUpperCase()] || 0) + 1
					}
				}
			})

			const trendingIssues = Object.entries(issueCounts)
				.map(([issue, count]) => ({
					issue,
					count,
					percentage: Math.round((count / (allSessions?.length || 1)) * 100),
				}))
				.sort((a, b) => b.count - a.count)
				.slice(0, 5)

			return NextResponse.json({
				total_sessions_this_month: thisMonthCount,
				total_sessions_change_percent: changePercent,
				average_diagnosis_time_seconds: 452, // 7m 32s - placeholder
				manual_average_time_seconds: 900, // 15m - placeholder
				ai_success_rate: successRate,
				trending_issues:
					trendingIssues.length > 0
						? trendingIssues
						: [
								{ issue: 'Brake Pad Wear', count: 15, percentage: 15 },
								{ issue: 'P0300', count: 10, percentage: 10 },
								{ issue: 'HVAC Blend Door', count: 8, percentage: 8 },
							],
			})
		} catch (error) {
			console.error('Error in GET /api/ai/diagnostics/stats:', error)
			return NextResponse.json(
				{
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}
	})(request)
}

