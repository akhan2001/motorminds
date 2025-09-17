'use client'

import { MessageSquare, Lightbulb, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface WorkOrderRightPanelProps {
    workOrderId: string
    className?: string
}

export const WorkOrderRightPanel: React.FC<WorkOrderRightPanelProps> = ({
    workOrderId,
    className = ""
}) => {
    return (
        <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-[#222222] flex-shrink-0">
                <h3 className="text-white font-medium text-sm">Mia Insights & Items</h3>
                <p className="text-gray-400 text-xs mt-1">AI insights and work order items</p>
            </div>

            {/* Content Tabs */}
            <div className="flex border-b border-[#222222] flex-shrink-0">
                <button className="flex-1 px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#1a1a1a] border-b-2 border-transparent hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        <span>Insights</span>
                    </div>
                </button>
                <button className="flex-1 px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#1a1a1a] border-b-2 border-transparent hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>Items</span>
                    </div>
                </button>
                <button className="flex-1 px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#1a1a1a] border-b-2 border-transparent hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>Chat</span>
                    </div>
                </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {/* Placeholder content */}
                <div className="space-y-4">
                    {/* Mia Insights Placeholder */}
                    <div className="bg-[#1a1a1a] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-white">Mia Insights</span>
                            <Badge className="bg-blue-500 text-xs">AI</Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                            AI-powered insights for this work order will appear here.
                        </p>
                        <div className="space-y-2">
                            <div className="h-3 bg-[#2a2a2a] rounded animate-pulse"></div>
                            <div className="h-3 bg-[#2a2a2a] rounded animate-pulse w-3/4"></div>
                            <div className="h-3 bg-[#2a2a2a] rounded animate-pulse w-1/2"></div>
                        </div>
                    </div>

                    {/* Work Order Items Placeholder */}
                    <div className="bg-[#1a1a1a] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-white">Work Order Items</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                            Parts and labor items will be listed here.
                        </p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-300">Labor</div>
                                <div className="text-xs text-gray-400">$245.00</div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-300">Parts</div>
                                <div className="text-xs text-gray-400">$125.50</div>
                            </div>
                            <hr className="border-[#2a2a2a]" />
                            <div className="flex justify-between items-center font-medium">
                                <div className="text-xs text-white">Total</div>
                                <div className="text-xs text-green-400">$370.50</div>
                            </div>
                        </div>
                    </div>

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
            </div>
        </div>
    )
}
