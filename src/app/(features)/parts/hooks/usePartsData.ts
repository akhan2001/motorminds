import { useState, useEffect, useCallback } from 'react'

export interface PartsCategory {
    categoryId: number
    categoryName: string
    level: number
    levelId?: number
}

export interface Part {
    id: string
    articleId: string
    articleNo: string
    name: string
    description: string
    supplier: string
    supplierId: number
    price: number
    availability: string
    imageUrl?: string
    partNumber: string
    brandName: string
    productId?: number
    mediaType?: string
    mediaFileName?: string
    fullInfo?: any
}

export const usePartsData = (vehicleId?: number) => {
    const [categories, setCategories] = useState<PartsCategory[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<PartsCategory | null>(null)

    const [parts, setParts] = useState<Part[]>([])
    const [partsLoading, setPartsLoading] = useState(false)
    const [partsError, setPartsError] = useState<string | null>(null)

    const fetchCategories = useCallback(async (vehicleId: number) => {
        try {
            setCategoriesLoading(true)
            
            const response = await fetch(`/api/parts-ordering/categories?vehicleId=${vehicleId}`)
            const data = await response.json()
            
            if (data.success) {
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
                const sortedCategories = categoryArray.sort((a, b) => 
                    a.categoryName.localeCompare(b.categoryName)
                )
                
                setCategories(sortedCategories)
            } else {
                setCategories([])
            }
        } catch (err) {
            setCategories([])
        } finally {
            setCategoriesLoading(false)
        }
    }, [])

    const fetchParts = useCallback(async (vehicleId: number, categoryId: number) => {
        try {
            setPartsLoading(true)
            setPartsError(null)
            
            const response = await fetch(`/api/parts-ordering/parts?vehicleId=${vehicleId}&productGroupId=${categoryId}`)
            const data = await response.json()
            
            if (data.success) {
                setParts(data.data || [])
            } else {
                setPartsError(data.message || 'Failed to fetch parts')
                setParts([])
            }
        } catch (err) {
            setPartsError('Error loading parts')
            setParts([])
        } finally {
            setPartsLoading(false)
        }
    }, [])

    // Auto-fetch categories when vehicleId changes
    useEffect(() => {
        if (vehicleId) {
            fetchCategories(vehicleId)
            setSelectedCategory(null)
            setParts([])
        }
    }, [vehicleId, fetchCategories])

    // Auto-fetch parts when both vehicleId and selectedCategory change
    useEffect(() => {
        if (vehicleId && selectedCategory) {
            fetchParts(vehicleId, selectedCategory.categoryId)
        }
    }, [vehicleId, selectedCategory, fetchParts])

    const handleCategoryChange = useCallback((categoryId: string) => {
        const category = categories.find(c => c.categoryId.toString() === categoryId)
        setSelectedCategory(category || null)
        setParts([])
    }, [categories])

    return {
        categories,
        categoriesLoading,
        selectedCategory,
        setSelectedCategory: handleCategoryChange,
        parts,
        partsLoading,
        partsError,
        fetchCategories,
        fetchParts
    }
}
