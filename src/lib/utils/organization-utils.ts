// Utility functions for organization-level operations

/**
 * Determines if organization-wide customer search should be enabled
 * @param organizationId - The organization ID (can be null for non-MSO shops)
 * @param forceEnable - Force enable organization search even for non-MSO shops
 * @returns boolean indicating if organization search should be enabled
 */
export function shouldEnableOrganizationSearch(
    organizationId: string | null | undefined,
    forceEnable: boolean = false
): boolean {
    // Enable if explicitly forced or if organization exists
    return forceEnable || !!organizationId
}

/**
 * Gets the appropriate search placeholder text based on organization status
 * @param organizationId - The organization ID
 * @param baseText - Base placeholder text
 * @returns Appropriate placeholder text
 */
export function getCustomerSearchPlaceholder(
    organizationId: string | null | undefined,
    baseText: string = "Search customers"
): string {
    if (organizationId) {
        return `${baseText} (organization-wide)...`
    }
    return `${baseText}...`
}

/**
 * Determines if shop names should be shown in search results
 * @param organizationId - The organization ID
 * @param isOrganizationSearch - Whether the current search is organization-wide
 * @returns boolean indicating if shop names should be displayed
 */
export function shouldShowShopNames(
    organizationId: string | null | undefined,
    isOrganizationSearch: boolean = false
): boolean {
    return !!organizationId && isOrganizationSearch
}

/**
 * Gets organization status information
 * @param organizationId - The organization ID
 * @returns Object with organization status info
 */
export function getOrganizationStatus(organizationId: string | null | undefined) {
    return {
        isMSO: !!organizationId,
        isStandalone: !organizationId,
        canSearchOrganization: !!organizationId
    }
}
