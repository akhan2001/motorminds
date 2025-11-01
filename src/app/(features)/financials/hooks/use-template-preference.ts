'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TemplateId } from '../types/invoice-pdf'

const STORAGE_KEY = 'invoice-pdf-template'
const DEFAULT_TEMPLATE: TemplateId = 'professional'

/**
 * Hook to manage invoice PDF template preference
 * Stores in localStorage for persistence (space-optimized)
 */
export function useTemplatePreference() {
    const [templateId, setTemplateIdState] = useState<TemplateId>(DEFAULT_TEMPLATE)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                setTemplateIdState(stored as TemplateId)
            }
        } catch (error) {
            console.error('Failed to load template preference:', error)
        } finally {
            setIsLoaded(true)
        }
    }, [])

    // Update localStorage when template changes
    const setTemplateId = useCallback((newTemplateId: TemplateId) => {
        try {
            localStorage.setItem(STORAGE_KEY, newTemplateId)
            setTemplateIdState(newTemplateId)
        } catch (error) {
            console.error('Failed to save template preference:', error)
        }
    }, [])

    return {
        templateId,
        setTemplateId,
        isLoaded,
    }
}

