'use client'

import React, { useState } from 'react'
import { MessageSquare, Lightbulb, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { WorkOrderItemsList } from '../../work-order-items'
import { MiaInsightsIntegration } from '@/app/(features)/ai/mia-insights'

export interface WorkOrderRightPanelProps {
    workOrderId: string
    shopId?: string
    workOrderStatus?: string
    className?: string
}

export const WorkOrderRightPanel: React.FC<WorkOrderRightPanelProps> = ({
    workOrderId,
    shopId,
    workOrderStatus,
    className = ""
}) => {
    const [activeTab, setActiveTab] = useState<'insights' | 'items' | 'chat'>('items')

    return (
        <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-[#222222] flex-shrink-0">
                <h3 className="text-white font-medium text-lg">Mia Insights & Items</h3>
                <p className="text-gray-400 text-sm mt-1">AI insights and work order items</p>
            </div>

            {/* Content Tabs */}
            <div className="flex border-b border-[#222222] flex-shrink-0">
                <button 
                    onClick={() => setActiveTab('insights')}
                    className={`flex-1 px-4 py-2 text-xs transition-colors border-b-2 ${
                        activeTab === 'insights' 
                            ? 'text-white bg-[#1a1a1a] border-blue-500' 
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a] border-transparent hover:border-gray-600'
                    }`}
                >
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                        <Lightbulb className="h-3 w-3" />
                        <span>Insights</span>
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('items')}
                    className={`flex-1 px-4 py-2 text-xs transition-colors border-b-2 ${
                        activeTab === 'items' 
                            ? 'text-white bg-[#1a1a1a] border-blue-500' 
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a] border-transparent hover:border-gray-600'
                    }`}
                >
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                        <Package className="h-3 w-3" />
                        <span>Items</span>
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 px-4 py-2 text-xs transition-colors border-b-2 ${
                        activeTab === 'chat' 
                            ? 'text-white bg-[#1a1a1a] border-blue-500' 
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a] border-transparent hover:border-gray-600'
                    }`}
                >
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                        <MessageSquare className="h-3 w-3" />
                        <span>Chat</span>
                    </div>
                </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {activeTab === 'insights' && (
                    <div className="p-4">
                        {workOrderId && shopId ? (
                            <MiaInsightsIntegration 
                                workOrderId={workOrderId} 
                                shopId={shopId}
                                workOrderStatus={workOrderStatus}
                            />
                        ) : (
                            <div className="bg-[#1a1a1a] rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm font-medium text-white">Mia Insights</span>
                                    <Badge className="bg-blue-500 text-xs">AI</Badge>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Work order ID and shop ID are required to generate insights.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'items' && (
                    <div className="p-4">
                        <WorkOrderItemsList 
                            workOrderId={workOrderId}
                            shopId={shopId}
                            isEditable={true}
                        />
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="p-4 space-y-4">
                        {/* Chat Placeholder */}
                        <div className="bg-[#1a1a1a] rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium text-white">Communication</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                Chat functionality will be integrated here for team communication about this work order.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
