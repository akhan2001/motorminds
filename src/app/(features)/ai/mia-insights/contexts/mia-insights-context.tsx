'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { MiaCustomerInsight } from '../types/mia-insights'
import { MiaInsightsService } from '../services/mia-insights-service'

interface MiaInsightsContextType {
    insights: MiaCustomerInsight | null
    setInsights: (insights: MiaCustomerInsight | null) => void
    generateInsights: (workOrderId: string, shopId: string) => Promise<void>
    isLoading: boolean
    error: string | null
}

const MiaInsightsContext = createContext<MiaInsightsContextType | undefined>(undefined)

export const MiaInsightsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [insights, setInsights] = useState<MiaCustomerInsight | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const generateInsights = useCallback(async (workOrderId: string, shopId: string) => {
        setIsLoading(true)
        setError(null)
        
        try {
            const response = await MiaInsightsService.generateInsights(workOrderId, shopId)
            
            if (response.success && response.insights) {
                // Fetch the saved insights from database
                const savedInsights = await MiaInsightsService.getInsights(workOrderId, shopId)
                setInsights(savedInsights)
            } else {
                setError(response.error || 'Failed to generate insights')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
        } finally {
            setIsLoading(false)
        }
    }, [])

    return (
        <MiaInsightsContext.Provider value={{ 
            insights, 
            setInsights, 
            generateInsights,
            isLoading,
            error
        }}>
            {children}
        </MiaInsightsContext.Provider>
    )
}

export const useMiaInsightsContext = () => {
    const context = useContext(MiaInsightsContext)
    if (!context) {
        throw new Error('useMiaInsightsContext must be used within MiaInsightsProvider')
    }
    return context
}
