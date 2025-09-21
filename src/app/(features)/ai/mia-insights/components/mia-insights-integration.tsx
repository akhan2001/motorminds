'use client'

import React from 'react'
import { MiaInsightsPanel } from './mia-insights-panel'

interface MiaInsightsIntegrationProps {
    workOrderId: string
    shopId: string
    workOrderStatus?: string
    className?: string
}

/**
 * Simple integration component for MIA Insights
 * Just pass workOrderId and shopId, and it handles everything else
 */
export const MiaInsightsIntegration: React.FC<MiaInsightsIntegrationProps> = ({ 
    workOrderId, 
    shopId,
    workOrderStatus,
    className = ""
}) => {
    return (
        <div className={className}>
            <MiaInsightsPanel 
                workOrderId={workOrderId} 
                shopId={shopId} 
                workOrderStatus={workOrderStatus}
            />
        </div>
    )
}
