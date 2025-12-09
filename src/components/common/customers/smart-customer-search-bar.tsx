"use client"

import { useState, useEffect } from 'react'
import { CustomerSearchBar } from './customer-search-bar'
import { Customer } from '@/app/(features)/customers/types'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'
import { shouldEnableOrganizationSearch, getCustomerSearchPlaceholder, shouldShowShopNames } from '@/lib/utils/organization-utils'

interface SmartCustomerSearchBarProps {
    onSelect: (customer: Customer) => void
    onCreateNew?: () => void
    showCreateOption?: boolean
    baseplaceholder?: string
    className?: string
    disabled?: boolean
    forceOrganizationWide?: boolean // Override automatic detection
}

/**
 * Smart Customer Search Bar that automatically detects organization status
 * and enables organization-wide search for MSO shops
 */
export function SmartCustomerSearchBar({
    onSelect,
    onCreateNew,
    showCreateOption = true,
    baseplaceholder = "Search customers",
    className,
    disabled = false,
    forceOrganizationWide = false
}: SmartCustomerSearchBarProps) {
    const { shopId } = useAuth()
    const [organizationId, setOrganizationId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch organization info for current shop
    useEffect(() => {
        async function fetchOrganizationInfo() {
            if (!shopId) return

            try {
                const response = await fetch(`/api/shops/${shopId}`)
                if (response.ok) {
                    const data = await response.json()
                    setOrganizationId(data.organization_id || null)
                }
            } catch (error) {
                console.error('Failed to fetch organization info:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrganizationInfo()
    }, [shopId])

    // Determine search configuration
    const enableOrganizationSearch = shouldEnableOrganizationSearch(organizationId, forceOrganizationWide)
    const placeholder = getCustomerSearchPlaceholder(organizationId, baseplaceholder)
    const showShopNamesInResults = shouldShowShopNames(organizationId, enableOrganizationSearch)

    if (isLoading) {
        return (
            <div className={`h-10 bg-muted animate-pulse rounded-md ${className}`} />
        )
    }

    return (
        <CustomerSearchBar
            onSelect={onSelect}
            onCreateNew={onCreateNew}
            showCreateOption={showCreateOption}
            placeholder={placeholder}
            className={className}
            disabled={disabled}
            organizationWide={enableOrganizationSearch}
            showShopNames={showShopNamesInResults}
        />
    )
}
