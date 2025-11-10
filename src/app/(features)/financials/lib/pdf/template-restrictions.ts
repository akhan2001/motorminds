/**
 * Template access restrictions configuration
 * Maps template IDs to shop IDs that have access to restricted templates
 * 
 * This is a centralized configuration that makes it easy to:
 * - Add/remove shops from template access
 * - Track which shops have access to which templates
 * - Maintain without code changes scattered across files
 */

/**
 * Template restriction configuration
 * Key: template ID
 * Value: array of shop IDs that have access to this template
 */
export const TEMPLATE_RESTRICTIONS: Record<string, string[]> = {
    // Tony template is only available for Good Guyz Garage
    tony: [
        '84b608af-c5ee-4d0c-b47c-29fd497734b2', // Good Guyz Garage shop_id
        '850e8400-e29b-41d4-a716-446655440006', // Sapling shop_id
        '85457c04-34f9-4a53-89cf-bc8576baea29' // Demo shop_id
    ],
}

/**
 * Check if a shop has access to a specific template
 * @param templateId - The template ID to check
 * @param shopId - The shop ID to check access for
 * @returns true if shop has access, false otherwise
 */
export function hasTemplateAccess(templateId: string, shopId: string | null | undefined): boolean {
    // If no shop ID provided, deny access
    if (!shopId) return false
    
    // If template has no restrictions, allow access to everyone
    const restrictedShopIds = TEMPLATE_RESTRICTIONS[templateId]
    if (!restrictedShopIds || restrictedShopIds.length === 0) {
        return true
    }
    
    // Check if shop ID is in the allowed list
    return restrictedShopIds.includes(shopId)
}

/**
 * Get all templates available to a specific shop
 * @param shopId - The shop ID to check templates for
 * @returns Array of template IDs the shop has access to
 */
export function getAvailableTemplateIds(shopId: string | null | undefined): string[] {
    // Import all template IDs from metadata
    // This will be used to filter templates based on shop access
    const allTemplates = ['professional', 'tony'] // Add more as templates are created
    
    return allTemplates.filter(templateId => hasTemplateAccess(templateId, shopId))
}

