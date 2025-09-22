'use client'

import React from 'react'
import { TrendingUp } from 'lucide-react'
import { UpsellSuggestion } from '../types/mia-insights'
import { toast } from 'sonner'
import { UpsellSuggestionCard } from './upsellSuggestionCard'

interface UpsellSuggestionsProps {
    suggestions: UpsellSuggestion[]
    workOrderId?: string
    shopId?: string
    onAddToWorkOrder?: (suggestion: UpsellSuggestion) => Promise<void>
}

export const UpsellSuggestions: React.FC<UpsellSuggestionsProps> = ({ 
    suggestions, 
    workOrderId, 
    shopId, 
    onAddToWorkOrder 
}) => {
    const [addingItems, setAddingItems] = React.useState<Set<number>>(new Set())
    const [addedItems, setAddedItems] = React.useState<Set<string>>(new Set())

    if (!suggestions || suggestions.length === 0) return null

    // Create unique identifier for each suggestion
    const getSuggestionId = (suggestion: UpsellSuggestion) => {
        return `${suggestion.title}-${suggestion.estimatedValue}`
    }

    const handleAddToWorkOrder = async (suggestion: UpsellSuggestion, index: number) => {
        if (!onAddToWorkOrder) {
            toast.error('Unable to add item to work order')
            return
        }

        const suggestionId = getSuggestionId(suggestion)
        
        // Check if item has already been added
        if (addedItems.has(suggestionId)) {
            toast.info(`${suggestion.title} has already been added to the work order`)
            return
        }

        setAddingItems(prev => new Set(prev).add(index))
        
        try {
            await onAddToWorkOrder(suggestion)
            // Mark as added after successful addition
            setAddedItems(prev => new Set(prev).add(suggestionId))
            toast.success(`${suggestion.title} added to work order`)
        } catch (error) {
            console.error('Failed to add to work order:', error)
            toast.error('Failed to add item to work order')
        } finally {
            setAddingItems(prev => {
                const newSet = new Set(prev)
                newSet.delete(index)
                return newSet
            })
        }
    }

    const canAddToWorkOrder = !!(workOrderId && shopId && onAddToWorkOrder)

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span>Upsell Opportunities</span>
                {canAddToWorkOrder && (
                    <span className="text-xs text-gray-500">(click to add to work order)</span>
                )}
            </h4>
            <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                    const suggestionId = getSuggestionId(suggestion)
                    const isAdded = addedItems.has(suggestionId)
                    const isAdding = addingItems.has(index)
                    
                    return (
                        <UpsellSuggestionCard
                            key={index}
                            suggestion={suggestion}
                            index={index}
                            isAdded={isAdded}
                            isAdding={isAdding}
                            canAddToWorkOrder={canAddToWorkOrder}
                            onAddToWorkOrder={handleAddToWorkOrder}
                        />
                    )
                })}
            </div>
        </div>
    )
}
