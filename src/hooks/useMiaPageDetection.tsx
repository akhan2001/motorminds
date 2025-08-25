"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useMiaSidebar } from '@/contexts/MiaSidebarContext'

// Define which pages support Mia AI sidebar
const SUPPORTED_PAGES = {
    '/invoices': 'invoices',
    '/loyalty': 'loyalty',
    // Add more pages here as needed
    // '/customers': 'customers',
    // '/mechanic-hub': 'mechanic-hub',
} as const

export function useMiaPageDetection() {
    const pathname = usePathname()
    const { setCurrentPage } = useMiaSidebar()

    useEffect(() => {
        // Check if current path matches any supported page
        const matchedPage = Object.entries(SUPPORTED_PAGES).find(([path]) => 
            pathname?.startsWith(path)
        )

        if (matchedPage) {
            setCurrentPage(matchedPage[1])
        } else {
            setCurrentPage(null)
        }
    }, [pathname, setCurrentPage])
}
