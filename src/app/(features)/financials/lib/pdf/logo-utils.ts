import { createClient } from '@/utils/supabase/client'

const STORAGE_BUCKET = 'motorminds'
const LOGO_FOLDER = 'shop_logos'

/**
 * Check if shop logo exists in Supabase Storage and return public URL
 * Checks for common image formats: jpg, jpeg, png
 * 
 * @param shopId - The shop ID to check logo for
 * @returns Public URL of logo if found, null otherwise
 */
export async function getShopLogoUrl(shopId: string): Promise<string | null> {
    if (!shopId) {
        return null
    }

    try {
        const supabase = createClient()
        const logoFileName = `${shopId}_logo`
        
        // Try different file extensions in order of preference
        const extensions = ['png', 'jpg', 'jpeg']
        
        // First, try to list files to verify existence
        let files: any[] | null = null
        try {
            const { data, error: listError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .list(`${LOGO_FOLDER}/${shopId}`, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' }
                })
            
            if (!listError) {
                files = data
            }
        } catch (listErr) {
            // Continue with direct URL check
        }
        
        // Try each extension
        for (const ext of extensions) {
            const filePath = `${LOGO_FOLDER}/${shopId}/${logoFileName}.${ext}`
            
            // If we have file list, check if file exists
            if (files && files.length > 0) {
                const logoFile = files.find(file => 
                    file.name === `${logoFileName}.${ext}` || 
                    file.name.toLowerCase() === `${logoFileName}.${ext}`
                )
                
                if (logoFile) {
                    // Logo found in list, construct public URL
                    const { data: urlData } = supabase.storage
                        .from(STORAGE_BUCKET)
                        .getPublicUrl(filePath)
                    
                    return urlData.publicUrl
                }
            }
            
            // Also try direct URL construction and verify it exists
            const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath)
            
            // Try to verify the image exists by fetching it
            try {
                const response = await fetch(urlData.publicUrl, { 
                    method: 'HEAD',
                    cache: 'no-cache'
                })
                if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
                    return urlData.publicUrl
                }
            } catch (fetchError) {
                // Continue to next extension
                continue
            }
        }
        
        return null
    } catch (error) {
        // Return null on error to allow fallback to shop name
        return null
    }
}

/**
 * Prepare shop branding with logo URL from storage
 * Checks storage bucket for logo, falls back to undefined if not found
 * 
 * @param shopInfo - Shop information from database
 * @returns ShopBranding object with logo_image_url set if logo exists
 */
export async function prepareShopBrandingWithLogo(
    shopInfo: {
        id: string
        shop_name: string
        shop_owner: string
        logo_image_url?: string
        shop_email?: string
        shop_phone?: string
        shop_address?: string
        shop_city?: string
        shop_province?: string
        business_number?: string
        hst_number?: string
    }
): Promise<{
    id: string
    shop_name: string
    shop_owner: string
    logo_image_url?: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    business_number?: string
    hst_number?: string
}> {
    // Check storage for logo
    const logoUrl = await getShopLogoUrl(shopInfo.id)
    
    return {
        ...shopInfo,
        logo_image_url: logoUrl || undefined // undefined triggers fallback in templates
    }
}
