'use client'

import React, { useEffect, useState } from 'react'
import { useMiaInsights, useGenerateMiaInsights } from '../hooks/use-mia-insights'
import { UpsellSuggestions } from './upsell-suggestions'
import { InsightFlags } from './insight-flags'
import { WorkOrderAnalysis } from './work-order-analysis'
import { Loader2, Brain, AlertTriangle, TrendingUp, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UpsellToWorkItemService } from '../../../operations/lib/upsell-to-work-item-service'
import { useCreateWorkOrderItem } from '../../../operations/hooks/use-work-order-items'
import { UpsellSuggestion } from '../types/mia-insights'

interface MiaInsightsPanelProps {
    workOrderId: string
    shopId: string
    workOrderStatus?: string
}

export const MiaInsightsPanel: React.FC<MiaInsightsPanelProps> = ({ 
    workOrderId, 
    shopId,
    workOrderStatus
}) => {
    const { data: insights, isLoading, error } = useMiaInsights(workOrderId, shopId)
    const generateInsights = useGenerateMiaInsights()
    const createWorkOrderItem = useCreateWorkOrderItem()
    const [hasGeneratedInsights, setHasGeneratedInsights] = useState(false)

    // Handle successful insight generation
    useEffect(() => {
        if (generateInsights.isSuccess) {
            setHasGeneratedInsights(true)
        }
    }, [generateInsights.isSuccess])

    // Check if work order is eligible for insights generation
    const isEligibleForInsights = workOrderStatus && 
        ['pending', 'in_progress', 'in progress', 'in-progress'].includes(workOrderStatus.toLowerCase()) &&
        !workOrderStatus.toLowerCase().includes('completed')

    // Check if work order is completed (disable adding upsell items)
    const isWorkOrderCompleted = !!(workOrderStatus && 
        workOrderStatus.toLowerCase().includes('completed'))


    const handleGenerateInsights = () => {
        if (workOrderId && shopId && !hasGeneratedInsights) {
            generateInsights.mutate({ workOrderId, shopId })
        }
    }

    const handleAddUpsellToWorkOrder = async (suggestion: UpsellSuggestion) => {
        // Prevent adding items to completed work orders
        if (isWorkOrderCompleted) {
            return // UpsellSuggestions component will handle the UI state
        }
        
        try {
            const workOrderItemData = await UpsellToWorkItemService.addUpsellAsWorkOrderItem(suggestion, workOrderId)
            await createWorkOrderItem.mutateAsync(workOrderItemData)
        } catch (error) {
            console.error('Failed to add upsell to work order:', error)
            throw error
        }
    }

    if (isLoading || generateInsights.isPending) {
        return (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                <div className="flex items-center justify-center space-x-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="text-gray-300">Generating MIA insights...</span>
                </div>
            </div>
        )
    }

    if (error || generateInsights.isError) {
        const errorMessage = generateInsights.error?.message || 'Failed to load insights'
        return (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                <div className="flex items-center space-x-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{errorMessage}</span>
                </div>
                {errorMessage.includes('not found') && (
                    <p className="text-xs text-gray-400 mt-2">
                        Make sure the work order exists and you have access to it.
                    </p>
                )}
            </div>
        )
    }

    if (!insights?.analysis) {
        return (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                {/* <div className="flex items-center space-x-2 text-gray-400">
                    <Brain className="h-5 w-5" />
                    <span>MIA insights not available (for now)</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Insights are only generated for new work orders during creation.
                </p> */}
                

                {/* Generate Insights Button for eligible work orders */}
                {isEligibleForInsights && !hasGeneratedInsights && (
                    // <div className="mt-4 pt-4">
                    <>
                    <Button
                        onClick={handleGenerateInsights}
                        disabled={generateInsights.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                    >
                        {generateInsights.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Generating Insights...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate MIA Insights
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Generate AI-powered insights for this work order
                    </p>
                    </>
                )}

            </div>
        )
    }

    const analysis = insights.analysis

    return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Brain className="h-6 w-6 text-blue-500" />
                    <h3 className="text-lg font-semibold text-white">MIA Insights</h3>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>Priority:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        insights.priority === 'high' ? 'bg-red-900 text-red-300' :
                        insights.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                    }`}>
                        {insights.priority || 'medium'}
                    </span>
                </div>
            </div>

            {/* Summary */}
            {analysis.summary && (
                <div className="bg-[#131313] border border-[#2a2a2a] rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <FileText className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Summary</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">{analysis.summary}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Insight Flags */}
            {analysis.flags && analysis.flags.length > 0 && (
                <InsightFlags flags={analysis.flags} />
            )}

            {/* Work Order Analysis */}
            {analysis.work_order_analysis && (
                <WorkOrderAnalysis analysis={analysis.work_order_analysis} />
            )}

            {/* Upsell Suggestions */}
            {analysis.upsell_suggestions && analysis.upsell_suggestions.length > 0 && (
                <UpsellSuggestions 
                    suggestions={analysis.upsell_suggestions}
                    workOrderId={workOrderId}
                    shopId={shopId}
                    onAddToWorkOrder={handleAddUpsellToWorkOrder}
                    isWorkOrderCompleted={isWorkOrderCompleted}
                />
            )}
        </div>
    )
}
