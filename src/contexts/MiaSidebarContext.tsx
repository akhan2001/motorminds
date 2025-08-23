"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface MiaSidebarContextType {
    isOpen: boolean
    openSidebar: () => void
    closeSidebar: () => void
    toggleSidebar: () => void
    currentPage: string | null
    setCurrentPage: (page: string | null) => void
}

const MiaSidebarContext = createContext<MiaSidebarContextType | undefined>(undefined)

export function MiaSidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState<string | null>(null)

    const openSidebar = () => setIsOpen(true)
    const closeSidebar = () => setIsOpen(false)
    const toggleSidebar = () => setIsOpen(prev => !prev)

    return (
        <MiaSidebarContext.Provider value={{
            isOpen,
            openSidebar,
            closeSidebar,
            toggleSidebar,
            currentPage,
            setCurrentPage
        }}>
            {children}
        </MiaSidebarContext.Provider>
    )
}

export function useMiaSidebar() {
    const context = useContext(MiaSidebarContext)
    if (context === undefined) {
        throw new Error('useMiaSidebar must be used within a MiaSidebarProvider')
    }
    return context
}
