/**
 * AI prompts for campaign suggestion generation
 */

export const CAMPAIGN_SUGGESTION_SYSTEM_PROMPT = `You are an AI assistant for an auto repair shop. Analyze work order data and suggest promotional SMS campaigns.

Your goal is to help shop owners create effective campaigns that:
1. Re-engage customers who haven't visited recently
2. Remind customers of routine maintenance
3. Promote seasonal services
4. Reward loyal customers

Return a JSON object with a "suggestions" array. Each suggestion must have:
- title: Clear campaign name (e.g., "3-Month Oil Change Reminder")
- message: SMS template using variables [customer_name], [vehicle.make], [vehicle.model], [shop_name], [shop_phone]
- customer_segment: Object with filters:
  - last_service_date_from: ISO date string (optional)
  - last_service_date_to: ISO date string (optional)
  - service_types: Array of service types (optional)
  - vehicle_makes: Array of vehicle makes (optional)
  - vehicle_models: Array of models (optional)
  - vehicle_years: Array of years (optional)
- reasoning: 2-3 sentences explaining why this campaign makes sense based on the data
- estimated_recipients: Approximate number (based on data provided)
- suggested_schedule: "immediate", "in 1 week", "in 2 weeks", etc.
- priority: "high", "medium", or "low"

Important rules:
- Keep SMS messages under 160 characters
- Use professional but friendly tone
- Always include [shop_name] and call-to-action
- Base suggestions on actual data patterns
- Focus on actionable, revenue-generating campaigns
- Consider service intervals (oil changes every 3 months, etc.)

Example output format:
{
  "suggestions": [
    {
      "title": "3-Month Oil Change Follow-up",
      "message": "Hi [customer_name], time for your [vehicle.make]'s oil change! Schedule today at [shop_name]. Call [shop_phone]",
      "customer_segment": {
        "last_service_date_from": "2024-06-01",
        "last_service_date_to": "2024-07-31",
        "service_types": ["oil_change"]
      },
      "reasoning": "45 customers had oil changes 2-3 months ago. Industry standard is 3-month intervals, making this a high-conversion campaign.",
      "estimated_recipients": 45,
      "suggested_schedule": "immediate",
      "priority": "high"
    }
  ]
}`

export interface WorkOrderAnalysis {
    total_work_orders: number
    date_range_days: number
    service_types: Record<string, number>
    top_vehicle_makes: Array<{ make: string; count: number }>
    repeat_customers: number
    avg_days_between_visits?: number
    revenue_by_service?: Record<string, number>
}

export function buildAnalysisPrompt(analysis: WorkOrderAnalysis): string {
    return `Analyze this auto repair shop's work order data from the last ${analysis.date_range_days} days and suggest 3-5 promotional SMS campaigns:

**Work Order Summary:**
- Total completed work orders: ${analysis.total_work_orders}
- Analysis period: ${analysis.date_range_days} days
- Repeat customers: ${analysis.repeat_customers}

**Service Type Distribution:**
${Object.entries(analysis.service_types)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => `- ${type}: ${count} services`)
    .join('\n')}

**Top Vehicle Makes:**
${analysis.top_vehicle_makes
    .map(({ make, count }) => `- ${make}: ${count} vehicles`)
    .join('\n')}

Based on this data, suggest campaigns that:
1. Target customers who haven't returned (90+ days since last visit)
2. Follow up on common services (oil changes, brake service, etc.)
3. Target specific vehicle makes if there's a concentration
4. Encourage routine maintenance at appropriate intervals

Return the suggestions in the specified JSON format.`
}

export interface CampaignSuggestion {
    title: string
    message: string
    customer_segment: {
        last_service_date_from?: string
        last_service_date_to?: string
        service_types?: string[]
        vehicle_makes?: string[]
        vehicle_models?: string[]
        vehicle_years?: number[]
    }
    reasoning: string
    estimated_recipients: number
    suggested_schedule: string
    priority: 'high' | 'medium' | 'low'
}

export interface CampaignSuggestionsResponse {
    suggestions: CampaignSuggestion[]
}

