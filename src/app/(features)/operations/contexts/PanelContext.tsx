'use client'

import React, { createContext, useContext, ReactNode } from 'react'

export interface PanelContextType {
    // Controls whether template cards should show edit/delete actions
    allowTemplateActions: boolean
    // Controls whether template cards are selectable
    allowTemplateSelection: boolean
    // Context identifier for debugging
    context: 'templates-page' | 'work-order-modal' | 'work-order-edit'
}

const PanelContext = createContext<PanelContextType | undefined>(undefined)

export interface PanelProviderProps {
    children: ReactNode
    allowTemplateActions?: boolean
    allowTemplateSelection?: boolean
    context?: PanelContextType['context']
}

export const PanelProvider: React.FC<PanelProviderProps> = ({
    children,
    allowTemplateActions = true,
    allowTemplateSelection = false,
    context = 'templates-page'
}) => {
    const value: PanelContextType = {
        allowTemplateActions,
        allowTemplateSelection,
        context
    }

    return (
        <PanelContext.Provider value={value}>
            {children}
        </PanelContext.Provider>
    )
}

export const usePanelContext = (): PanelContextType => {
    const context = useContext(PanelContext)
    if (context === undefined) {
        throw new Error('usePanelContext must be used within a PanelProvider')
    }
    return context
}

// Convenience hooks for specific contexts
export const useTemplateActions = (): boolean => {
    const { allowTemplateActions } = usePanelContext()
    return allowTemplateActions
}

export const useTemplateSelection = (): boolean => {
    const { allowTemplateSelection } = usePanelContext()
    return allowTemplateSelection
}
