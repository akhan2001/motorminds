'use client'

import React from 'react'
import { DollarSign, Clock, Shield, Wrench, Star, Plus, Check } from 'lucide-react'
import { UpsellSuggestion } from '../types/mia-insights'

interface UpsellSuggestionCardProps {
    suggestion: UpsellSuggestion
    index: number
    isAdded: boolean
    isAdding: boolean
    canAddToWorkOrder: boolean
    onAddToWorkOrder: (suggestion: UpsellSuggestion, index: number) => void
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'immediate':
            return <Clock className="h-4 w-4 text-red-400" />
        case 'preventive':
            return <Shield className="h-4 w-4 text-blue-400" />
        case 'safety':
            return <Shield className="h-4 w-4 text-red-400" />
        case 'seasonal':
            return <Star className="h-4 w-4 text-yellow-400" />
        default:
            return <Wrench className="h-4 w-4 text-gray-400" />
    }
}

const getPriorityStyles = (priority: string) => {
    switch (priority) {
        case 'high':
            return 'bg-red-900/20 border-red-500/30'
        case 'medium':
            return 'bg-yellow-900/20 border-yellow-500/30'
        case 'low':
            return 'bg-green-900/20 border-green-500/30'
        default:
            return 'bg-gray-900/20 border-gray-500/30'
    }
}

const getPriorityBadge = (priority: string) => {
    switch (priority) {
        case 'high':
            return 'bg-red-900 text-red-300'
        case 'medium':
            return 'bg-yellow-900 text-yellow-300'
        case 'low':
            return 'bg-green-900 text-green-300'
        default:
            return 'bg-gray-900 text-gray-300'
    }
}

export const UpsellSuggestionCard: React.FC<UpsellSuggestionCardProps> = ({
    suggestion,
    index,
    isAdded,
    isAdding,
    canAddToWorkOrder,
    onAddToWorkOrder
}) => {
    const canClick = canAddToWorkOrder && !isAdded && !isAdding

    return (
        <div 
            onClick={canClick ? () => onAddToWorkOrder(suggestion, index) : undefined}
            className={`
                border rounded-lg p-4 
                ${getPriorityStyles(suggestion.priority)}
                ${canAddToWorkOrder 
                    ? `transition-colors duration-200 ${
                        isAdded 
                            ? 'opacity-60 cursor-default bg-gray-900/20' 
                            : isAdding 
                                ? 'opacity-70 cursor-not-allowed' 
                                : 'cursor-pointer hover:border-blue-500/60'
                    }` 
                    : ''
                }
            `}
            style={{
                background: canAddToWorkOrder && !isAdded
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                    : undefined
            }}
        >
            {/* Add to Work Order Indicator */}
            {canAddToWorkOrder && (
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        {isAdded ? (
                            <>
                                <Check className="h-4 w-4 text-green-400" />
                                <span className="text-xs font-medium text-green-400">Added to Work Order</span>
                            </>
                        ) : isAdding ? (
                            <>
                                <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-medium text-blue-400">Adding to Work Order...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 text-blue-400" />
                                <span className="text-xs font-medium text-blue-400">Click to Add to Work Order</span>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                    {getCategoryIcon(suggestion.category)}
                    <h5 className="text-sm font-medium text-white">
                        {suggestion.title}
                    </h5>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(suggestion.priority)}`}>
                        {suggestion.priority}
                    </span>
                    <div className="flex items-center space-x-1 text-green-400">
                        <DollarSign className="h-3 w-3" />
                        <span className="text-sm font-medium">
                            ${suggestion.estimatedValue}
                        </span>
                    </div>
                </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
                {suggestion.description}
            </p>
        </div>
    )
}
