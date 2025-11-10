/**
 * Shop data reference for template configuration
 * This file stores shop information for easy reference when configuring templates
 */

export interface ShopData {
    id: string
    shop_name: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    website?: string
    operating_hours?: string
    services_offered?: string
    created_at?: string
    shop_city?: string
    shop_owner?: string
    shop_province?: string
    banner_image_url?: string
    logo_image_url?: string
    facebook_url?: string
    twitter_url?: string
    instagram_url?: string
    youtube_url?: string
    shop_about?: string
    shop_tagline?: string
    hst_number?: string
    business_number?: string
    default_hourly_rate?: number
}

/**
 * Shop data reference
 * Used for easy lookup when configuring templates
 */
export const SHOP_DATA: Record<string, ShopData> = {
    '84b608af-c5ee-4d0c-b47c-29fd497734b2': {
        id: '84b608af-c5ee-4d0c-b47c-29fd497734b2',
        shop_name: 'Good Guyz Garage',
        // Add other fields as needed
    },
    '850e8400-e29b-41d4-a716-446655440006': {
        id: '850e8400-e29b-41d4-a716-446655440006',
        shop_name: 'Motorminds Auto Shop',
        shop_email: 'saplingsniper@gmail.com',
        shop_phone: '9056992659',
        shop_address: '220 Dundas St',
        website: 'https://motorminds.ca',
        shop_city: 'Mississauga',
        shop_owner: 'Abdullah K',
        shop_province: 'Ontario',
        logo_image_url: 'https://motorminds.ca/_next/image?url=%2Fteam-images%2Fabdullah_khan.png&w=640&q=75',
        shop_about: 'All of our auto repair services are priced competitively against other auto repair shops, we are sure you won\'t find the same service elsewhere.\n\nIf you do happen to do so, we will beat their written and signed estimate by at least 15%. The service must be similar (i.e. Castrol oil is not the same as no-name oil).',
        shop_tagline: 'Most Trusted Auto Mechanic In Mississauga',
        default_hourly_rate: 129.99,
    },
}

/**
 * Get shop data by shop_id
 */
export function getShopData(shopId: string): ShopData | undefined {
    return SHOP_DATA[shopId]
}

/**
 * Get shop name by shop_id
 */
export function getShopName(shopId: string): string | undefined {
    return SHOP_DATA[shopId]?.shop_name
}

