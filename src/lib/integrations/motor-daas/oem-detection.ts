import { OEMBrand } from '@/lib/integrations/motor-daas/constants/oem-copyrights'

/**
 * Maps vehicle makes to their corresponding OEM brands.
 * This mapping is used to detect which OEM copyright notices need to be displayed.
 */
const makeToOEM: Record<string, OEMBrand> = {
    // Chrysler Group (FCA/Stellantis)
    'chrysler': 'chrysler',
    'dodge': 'chrysler',
    'jeep': 'chrysler',
    'ram': 'chrysler',
    'fiat': 'chrysler',
    'alfa romeo': 'chrysler',
    
    // Ford Motor Company
    'ford': 'ford',
    'lincoln': 'ford',
    
    // General Motors
    'chevrolet': 'gm',
    'chevy': 'gm',
    'gmc': 'gm',
    'cadillac': 'gm',
    'buick': 'gm',
    
    // Honda
    'honda': 'honda',
    'acura': 'honda',
    
    // Hyundai Motor Group
    'hyundai': 'hyundai',
    'genesis': 'hyundai',
    'kia': 'hyundai',
    
    // Jaguar Land Rover
    'jaguar': 'jaguar',
    'land rover': 'land-rover',
    
    // Mazda
    'mazda': 'mazda',
    
    // Mitsubishi
    'mitsubishi': 'mitsubishi',
    
    // Nissan
    'nissan': 'nissan',
    'infiniti': 'nissan',
    
    // Subaru
    'subaru': 'subaru',
    
    // Toyota
    'toyota': 'toyota',
    'lexus': 'toyota',
    'scion': 'toyota',
    
    // Volkswagen Group
    'volkswagen': 'volkswagen',
    'vw': 'volkswagen',
    'audi': 'volkswagen',
    'porsche': 'volkswagen',
    'bentley': 'volkswagen',
    'lamborghini': 'volkswagen',
    'bugatti': 'volkswagen',
    
    // Volvo
    'volvo': 'volvo',
}

/**
 * Detects which OEMs are present in content based on vehicle make, part numbers, or content metadata.
 * Returns an array of OEM brands that require copyright notices.
 * 
 * @param content - Content object containing vehicle information
 * @param content.vehicleMake - Vehicle make name (e.g., "Honda", "Ford")
 * @param content.partNumbers - Array of part numbers (future: can detect OEM from part number patterns)
 * @param content.contentMetadata - Additional metadata that might contain OEM information
 * @returns Array of OEM brands detected in the content
 * 
 * @example
 * ```ts
 * const oems = detectOEMsInContent({ vehicleMake: 'Honda' })
 * // Returns: ['honda']
 * ```
 */
export function detectOEMsInContent(content: {
    vehicleMake?: string
    partNumbers?: string[]
    contentMetadata?: Record<string, any>
}): OEMBrand[] {
    const detected: OEMBrand[] = []

    // Detect from vehicle make
    if (content.vehicleMake) {
        const normalizedMake = content.vehicleMake.toLowerCase().trim()
        const oem = makeToOEM[normalizedMake]
        
        if (oem && !detected.includes(oem)) {
            detected.push(oem)
        }
    }

    // Detect from content metadata (e.g., if metadata contains OEM information)
    if (content.contentMetadata) {
        const metadataOEM = content.contentMetadata.oem || content.contentMetadata.manufacturer
        if (metadataOEM && typeof metadataOEM === 'string') {
            const normalizedOEM = metadataOEM.toLowerCase().trim()
            const oem = makeToOEM[normalizedOEM]
            if (oem && !detected.includes(oem)) {
                detected.push(oem)
            }
        }
    }

    // Future: Detect from part numbers (OEM-specific part number patterns)
    // This would require knowledge of OEM part number formats

    return detected
}