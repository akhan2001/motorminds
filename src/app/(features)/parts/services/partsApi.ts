import { VehicleEngine } from '../hooks/useVehicleSelection'
import { PartsCategory, Part } from '../hooks/usePartsData'

class PartsApiService {
    async fetchEngines(manufacturerId: number, modelId: number): Promise<VehicleEngine[]> {
        const response = await fetch(`/api/parts-ordering/vehicle-engines?manufacturerId=${manufacturerId}&modelId=${modelId}`)
        const data = await response.json()
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch engines')
        }
        
        return Array.isArray(data.data) ? data.data.map((engine: any, index: number) => ({
            vehicleId: engine.vehicleId,
            engineType: engine.engineType || engine.engineName,
            engineName: engine.engineName || engine.engineType,
            capacityLt: engine.capacityLt || '',
            numberOfCylinders: engine.numberOfCylinders || '',
            displacement: engine.displacement || '',
            power: engine.power || '',
            fuelType: engine.fuelType || '',
            engineCodes: engine.engineCodes || '',
            bodyType: engine.bodyType || '',
            constructionPeriod: engine.constructionPeriod || '',
            uniqueKey: `${engine.vehicleId}-${index}`
        })) : []
    }
    
    async fetchCategories(vehicleId: number): Promise<PartsCategory[]> {
        const response = await fetch(`/api/parts-ordering/categories?vehicleId=${vehicleId}`)
        const data = await response.json()
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch categories')
        }
        
        // Transform API response - only use main categories (level 1), ignore children
        const categoryArray: PartsCategory[] = Array.isArray(data.data) ? data.data
            .filter((category: any) => category.level === 1) // Only main categories
            .map((category: any) => ({
                categoryId: category.categoryId,
                categoryName: category.categoryName,
                level: category.level,
                levelId: category.categoryId
            })) : []
        
        // Sort alphabetically by category name
        return categoryArray.sort((a, b) => a.categoryName.localeCompare(b.categoryName))
    }
    
    async fetchParts(vehicleId: number, productGroupId: number): Promise<Part[]> {
        const response = await fetch(`/api/parts-ordering/parts?vehicleId=${vehicleId}&productGroupId=${productGroupId}`)
        const data = await response.json()
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch parts')
        }
        
        return data.data || []
    }
}

export const partsApi = new PartsApiService()
