"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type SidebarKey = string

type SidebarRegistration = {
    key: SidebarKey
    component: () => JSX.Element
}

type SidebarManagerState = {
    registerSidebar: (registration: SidebarRegistration) => void
    unregisterSidebar: (key: SidebarKey) => void
    openSidebar: (key: SidebarKey) => void
    closeSidebar: (key: SidebarKey) => void
    getActiveSidebar: () => SidebarRegistration | null
}

const SidebarManagerContext = createContext<SidebarManagerState | null>(null)

export function SidebarManagerProvider({ children }: { children: React.ReactNode }) {
    const registryRef = useRef<Map<SidebarKey, SidebarRegistration>>(new Map())
    const [activeKey, setActiveKey] = useState<SidebarKey | null>(null)

    const registerSidebar = useCallback((registration: SidebarRegistration) => {
        registryRef.current.set(registration.key, registration)
    }, [])

    const unregisterSidebar = useCallback((key: SidebarKey) => {
        registryRef.current.delete(key)
    }, [])

    const openSidebar = useCallback((key: SidebarKey) => {
        if (registryRef.current.has(key)) setActiveKey(key)
    }, [])

    const closeSidebar = useCallback((key?: SidebarKey) => {
        setActiveKey((prev) => (key && prev !== key ? prev : null))
    }, [])

    const getActiveSidebar = useCallback(() => {
        if (!activeKey) return null
        return registryRef.current.get(activeKey) ?? null
    }, [activeKey])

    const value = useMemo<SidebarManagerState>(
        () => ({ registerSidebar, unregisterSidebar, openSidebar, closeSidebar, getActiveSidebar }),
        [registerSidebar, unregisterSidebar, openSidebar, closeSidebar, getActiveSidebar]
    )

    return (
        <SidebarManagerContext.Provider value={value}>{children}</SidebarManagerContext.Provider>
    )
}

export function useSidebarManagerSnapshot() {
    const ctx = useContext(SidebarManagerContext)
    if (!ctx) throw new Error('useSidebarManagerSnapshot must be used within SidebarManagerProvider')
    return ctx
}

export function useRegisterSidebar(key: SidebarKey, component: () => JSX.Element) {
    const { registerSidebar, unregisterSidebar } = useSidebarManagerSnapshot()
    // Register once on mount; consumers should call this at module/component init level
    // Since we lack effects here (to avoid SSR mismatches), callers can wrap in useEffect if needed.
    registerSidebar({ key, component })
    return () => unregisterSidebar(key)
}
