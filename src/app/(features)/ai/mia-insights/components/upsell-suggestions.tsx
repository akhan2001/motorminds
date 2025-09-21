'use client'

import React from 'react'
import { TrendingUp, DollarSign, Clock, Shield, Wrench, Star } from 'lucide-react'
import { UpsellSuggestion } from '../types/mia-insights'

interface UpsellSuggestionsProps {
    suggestions: UpsellSuggestion[]
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

export const UpsellSuggestions: React.FC<UpsellSuggestionsProps> = ({ suggestions }) => {
    if (!suggestions || suggestions.length === 0) return null

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span>Upsell Opportunities</span>
            </h4>
            <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                    <div 
                        key={index} 
                        className={`border rounded-lg p-4 ${getPriorityStyles(suggestion.priority)}`}
                    >
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
                ))}
            </div>
        </div>
    )
}
