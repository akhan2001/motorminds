'use client'

import React, { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { DollarSign, Lightbulb, MessageSquare, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ChatPanel } from './chat-panel'
import { InvoiceHistoryPanel } from './invoice-history-panel'
import { WorkOrderCostSummary } from '../complete/work-order-cost-summary'
import { WorkOrderAdvancePaymentsSection } from './WorkOrderAdvancePaymentsSection'
import type { WorkOrderItem } from '../../../types/work-order-items'
import type { WorkOrderWithDetails } from '../../../types/work-order'

// Lazy load heavy components to reduce initial bundle size (Supabase pattern)
const MiaInsightsIntegration = dynamic(
    () => import('@/app/(features)/ai/mia-insights').then(m => ({ default: m.MiaInsightsIntegration })),
    { ssr: false }
)

export interface WorkOrderRightPanelProps {
    workOrderId: string
    shopId?: string
    workOrderStatus?: string
    technicianId?: string
    customerId?: string | null
    customerType?: 'registered' | 'walk_in'
    workOrderItems?: WorkOrderItem[]
    /** Full work order for Cost Summary (e.g. advance payments). Optional. */
    workOrder?: WorkOrderWithDetails | null
    className?: string
}

export const WorkOrderRightPanel: React.FC<WorkOrderRightPanelProps> = ({
    workOrderId,
    shopId,
    workOrderStatus,
    technicianId,
    customerId,
    customerType,
    workOrderItems = [],
    workOrder = null,
    className = ""
}) => {
    // Determine if work order is completed (read-only mode)
    const isCompleted = workOrderStatus && 
        ['completed', 'invoiced', 'cancelled'].includes(workOrderStatus.toLowerCase())
    
    // Determine if work order is in progress (show invoice history)
    const isInProgress = workOrderStatus && 
        ['pending', 'approved', 'in_progress', 'waiting_parts', 'waiting_customer', 'on_hold'].includes(workOrderStatus.toLowerCase())
    
    // Only show history for registered customers (not walk-ins)
    const isRegisteredCustomer = customerType === 'registered' && !!customerId
    
    
    const [activeTab, setActiveTab] = useState<'insights' | 'summary' | 'chat' | 'history'>('summary')

    return (
        <div className={`w-full bg-card dark:bg-[#131313] border-l border-border dark:border-[#333333] flex flex-col h-full min-h-0 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-border dark:border-[#333333] flex-shrink-0">
                <h3 className="text-foreground dark:text-white font-medium text-lg">
                    {isCompleted 
                        ? 'Insights & Chat' 
                        : isInProgress && isRegisteredCustomer
                        ? 'Summary, Insights & History'
                        : 'Summary & Insights'
                    }
                </h3>
                <p className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
                    {isCompleted 
                        ? 'AI insights and team communication' 
                        : isInProgress && isRegisteredCustomer
                        ? 'Cost summary, AI insights, and customer history'
                        : 'Cost summary and AI insights'
                    }
                </p>
            </div>

            {/* Content Tabs */}
            <div className="flex border-b border-border dark:border-[#333333] flex-shrink-0">
                {!isCompleted && (
                    <button 
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 px-4 py-2 text-xs transition-colors border-b-2 ${
                            activeTab === 'summary' 
                                ? 'text-foreground dark:text-white bg-card dark:bg-[#1a1a1a] border-blue-500' 
                                : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] border-transparent hover:border-muted dark:hover:border-gray-600'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-1 text-sm font-medium">
                            <DollarSign className="h-3 w-3" />
                            <span>Summary</span>
                        </div>
                    </button>
                )}
                <button 
                    onClick={() => setActiveTab('insights')}
                    className={`flex-1 px-4 py-2 text-xs transition-colors border-b-2 ${
                        activeTab === 'insights' 
                            ? 'text-foreground dark:text-white bg-card dark:bg-[#1a1a1a] border-blue-500' 
                            : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] border-transparent hover:border-muted dark:hover:border-gray-600'
                    }`}
                >
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                        <Lightbulb className="h-3 w-3" />
                        <span>Insights</span>
                    </div>
                </button>
                
                {/* History tab - ONLY for registered customers in progress */}
                {isInProgress && isRegisteredCustomer && (
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 px-4 py-2 text-xs transition-colors border-b-2 ${
                            activeTab === 'history' 
                                ? 'text-foreground dark:text-white bg-white dark:bg-[#1a1a1a] border-blue-500' 
                                : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] border-transparent hover:border-muted dark:hover:border-gray-600'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-1 text-sm font-medium">
                            <FileText className="h-3 w-3" />
                            <span>History</span>
                        </div>
                    </button>
                )}
                
                {isCompleted && (
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 px-4 py-2 text-xs transition-colors border-b-2 ${
                            activeTab === 'chat' 
                                ? 'text-foreground dark:text-white bg-white dark:bg-[#1a1a1a] border-blue-500' 
                                : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] border-transparent hover:border-muted dark:hover:border-gray-600'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-1 text-sm font-medium">
                            <MessageSquare className="h-3 w-3" />
                            <span>Chat</span>
                        </div>
                    </button>
                )}
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-600 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
                {activeTab === 'insights' && (
                    <div className="p-4">
                        {workOrderId && shopId ? (
                            <Suspense fallback={
                                <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb className="h-4 w-4 text-yellow-500 animate-pulse" />
                                        <span className="text-sm font-medium text-foreground dark:text-white">Loading insights...</span>
                                    </div>
                                </div>
                            }>
                                <MiaInsightsIntegration 
                                    workOrderId={workOrderId} 
                                    shopId={shopId}
                                    workOrderStatus={workOrderStatus}
                                />
                            </Suspense>
                        ) : (
                            <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm font-medium text-foreground dark:text-white">Mia Insights</span>
                                    <Badge className="bg-blue-500 text-xs">AI</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground dark:text-gray-400">
                                    Work order ID and shop ID are required to generate insights.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'summary' && (
                    <div className="h-full p-4 space-y-4">
                        {workOrderItems.length > 0 || workOrderId ? (
                            <WorkOrderCostSummary
                                workOrderItems={workOrderItems}
                                workOrderId={workOrderId}
                            />
                        ) : (
                            <div className="bg-card dark:bg-[#131313] rounded-lg p-4 border border-border dark:border-[#333333]">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    <span className="text-md font-medium text-foreground dark:text-white">Cost Summary</span>
                                </div>
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    No items added yet. Add items to see the cost summary.
                                </p>
                            </div>
                        )}
                        {workOrder && !workOrder.invoice_id && isInProgress && (
                            <WorkOrderAdvancePaymentsSection
                                workOrder={workOrder}
                                workOrderItems={workOrderItems}
                                isEditing={true}
                            />
                        )}
                    </div>
                )}

                {/* Add History tab content */}
                {activeTab === 'history' && (
                    <div className="h-full">
                        <InvoiceHistoryPanel
                            customerId={customerId}
                            shopId={shopId}
                        />
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="h-full">
                        <ChatPanel
                            workOrderId={workOrderId}
                            shopId={shopId}
                            workOrderStatus={workOrderStatus}
                            className="h-full border-none"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
