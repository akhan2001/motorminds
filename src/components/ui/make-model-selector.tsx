"use client"

import { useState, useEffect } from "react"
import manufacturersData from "@/app/parts-ordering/manufacturers.json"

export interface MakeModelSelection {
    make: string
    manufacturerId: number | null
    model: string
    modelId: number | null
    year: string
}

interface Model {
    modelId: number
    modelName: string
    modelYearFrom?: string
    modelYearTo?: string
    availableYears: number[]
}

interface MakeModelSelectorProps {
    value: MakeModelSelection
    onChange: (selection: MakeModelSelection) => void
    disabled?: boolean
    className?: string
    showLabels?: boolean
    placeholder?: {
        make?: string
        model?: string
        year?: string
    }
}

export default function MakeModelSelector({
    value,
    onChange,
    disabled = false,
    className = "",
    showLabels = true,
    placeholder = {
        make: "Select a manufacturer",
        model: "Select a model",
        year: "Select a year"
    }
}: MakeModelSelectorProps) {
    const [allModels, setAllModels] = useState<Model[]>([]) // Store all models for filtering
    const [filteredModels, setFilteredModels] = useState<Model[]>([]) // Models filtered by year and make
    const [modelsLoading, setModelsLoading] = useState(false)
    const [modelsError, setModelsError] = useState<string | null>(null)
    const [availableYears] = useState<number[]>(() => {
        // Generate years from 2001 to current year
        const currentYear = new Date().getFullYear()
        const years: number[] = []
        for (let year = currentYear; year >= 2001; year--) {
            years.push(year)
        }
        return years
    })
    const [availableMakes, setAvailableMakes] = useState<Array<{manufacturerId: number, brand: string}>>([])
    const [allManufacturers] = useState(manufacturersData.manufacturers)

    // Helper function to generate year range from date strings
    const generateYearRange = (yearFrom?: string, yearTo?: string): number[] => {
        const currentYear = new Date().getFullYear()
        const minYear = 2001
        
        let startYear = minYear
        let endYear = currentYear
        
        if (yearFrom) {
            const fromYear = parseInt(yearFrom.split('-')[0])
            startYear = Math.max(fromYear, minYear)
        }
        
        if (yearTo) {
            const toYear = parseInt(yearTo.split('-')[0])
            endYear = Math.min(toYear, currentYear)
        }
        
        const years: number[] = []
        for (let year = startYear; year <= endYear; year++) {
            years.push(year)
        }
        
        return years.sort((a, b) => b - a) // Sort descending (newest first)
    }
    
    // Filter models based on selected year and make
    const filterModels = (modelsData: Model[], selectedYear: string, selectedMake: string) => {
        let filtered = modelsData
        
        // Filter by year if selected
        if (selectedYear) {
            const year = parseInt(selectedYear)
            filtered = filtered.filter(model => 
                model.availableYears.includes(year)
            )
        }
        
        // Filter by make if selected (through manufacturerId)
        if (selectedMake && value.manufacturerId) {
            // Models are already filtered by manufacturerId from the API call
            // No additional filtering needed here
        }
        
        // Sort models alphabetically by modelName
        const sortedFiltered = filtered.sort((a, b) => 
            a.modelName.localeCompare(b.modelName, undefined, { numeric: true, sensitivity: 'base' })
        )
        setFilteredModels(sortedFiltered)
        
        // Update available makes based on filtered models
        if (selectedYear && !selectedMake) {
            updateAvailableMakes(filtered)
        }
    }
    
    // Update available makes based on models that support the selected year
    const updateAvailableMakes = (modelsData: Model[]) => {
        if (!value.year) {
            setAvailableMakes(allManufacturers)
            return
        }
        
        // For now, show all manufacturers since we fetch models per manufacturer
        // In a more advanced implementation, you'd fetch all models first to filter makes
        setAvailableMakes(allManufacturers)
    }

    const fetchModels = async (manufacturerId: number) => {
        try {
            setModelsLoading(true)
            setModelsError(null)
            
            const response = await fetch(`/api/parts-ordering/models?manufacturerId=${manufacturerId}`)
            const data = await response.json()
            
            console.log('Models API Response:', data)
            
            if (data.success) {
                // Parse the models data based on the actual API response structure
                let modelsData: Model[] = []
                
                const parseModelData = (model: any): Model => {
                    const yearFrom = model.modelYearFrom || model.yearFrom
                    const yearTo = model.modelYearTo || model.yearTo
                    
                    // Generate available years from the year range
                    const availableYears = generateYearRange(yearFrom, yearTo)
                    
                    return {
                        modelId: model.id || model.modelId || model.typeId,
                        modelName: model.name || model.modelName || model.title || model.typeName,
                        modelYearFrom: yearFrom,
                        modelYearTo: yearTo,
                        availableYears
                    }
                }
                
                if (Array.isArray(data.data)) {
                    modelsData = data.data.map(parseModelData).filter((model: Model) => model.modelId && model.modelName)
                } else if (data.data && Array.isArray(data.data.models)) {
                    modelsData = data.data.models.map(parseModelData).filter((model: Model) => model.modelId && model.modelName)
                } else if (data.data && data.data.data && Array.isArray(data.data.data)) {
                    // Handle nested data structure
                    modelsData = data.data.data.map(parseModelData).filter((model: Model) => model.modelId && model.modelName)
                }
                
                console.log('Parsed models:', modelsData)
                setAllModels(modelsData)
                
                // Filter models based on current year and make selection
                filterModels(modelsData, value.year, value.make)
            } else {
                console.error('Failed to fetch models:', data.message)
                setModelsError(data.message || 'Failed to fetch models')
                setAllModels([])
                setFilteredModels([])
            }
        } catch (err) {
            console.error('Error fetching models:', err)
            setModelsError(err instanceof Error ? err.message : 'Error fetching models')
            setAllModels([])
            setFilteredModels([])
        } finally {
            setModelsLoading(false)
        }
    }

    const handleYearChange = (selectedYear: string) => {
        const newSelection: MakeModelSelection = {
            ...value,
            year: selectedYear,
            make: '', // Reset make when year changes
            manufacturerId: null,
            model: '', // Reset model when year changes
            modelId: null
        }
        
        onChange(newSelection)
        
        // Update available makes for the selected year
        updateAvailableMakes([])
        
        // Clear models until make is selected
        setAllModels([])
        setFilteredModels([])
    }

    const handleMakeChange = (selectedMake: string) => {
        // Find the manufacturerId for the selected brand
        const selectedManufacturer = manufacturersData.manufacturers.find(
            manufacturer => manufacturer.brand === selectedMake
        )
        const manufacturerId = selectedManufacturer ? selectedManufacturer.manufacturerId : null
        
        const newSelection: MakeModelSelection = {
            ...value,
            make: selectedMake,
            manufacturerId: manufacturerId,
            model: '', // Reset model when manufacturer changes
            modelId: null
        }
        
        onChange(newSelection)
        
        // Fetch models for the selected manufacturer
        if (manufacturerId) {
            fetchModels(manufacturerId)
        } else {
            setAllModels([])
            setFilteredModels([])
            setModelsError(null)
        }
    }
    
    const handleModelChange = (selectedModel: string) => {
        // Find the modelId for the selected model
        const selectedModelData = filteredModels.find(model => model.modelName === selectedModel)
        
        const newSelection: MakeModelSelection = {
            ...value,
            model: selectedModel,
            modelId: selectedModelData ? selectedModelData.modelId : null
        }
        
        onChange(newSelection)
    }

    // Load models if manufacturerId exists on mount
    useEffect(() => {
        if (value.manufacturerId && !allModels.length && !modelsLoading) {
            fetchModels(value.manufacturerId)
        }
    }, [value.manufacturerId])
    
    // Filter models when year or make changes
    useEffect(() => {
        filterModels(allModels, value.year, value.make)
    }, [allModels, value.year, value.make])
    
    // Initialize available makes on mount
    useEffect(() => {
        setAvailableMakes(allManufacturers)
    }, [])

    const getModelDropdownText = () => {
        if (modelsLoading) return 'Loading models...'
        if (modelsError) return `Error: ${modelsError}`
        if (!value.year) return 'Select a year first'
        if (!value.manufacturerId) return 'Select a make first'
        if (filteredModels.length === 0) return 'No models available for selected year and make'
        return placeholder.model
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Year Selector */}
            <div>
                {showLabels && (
                    <label className="block text-sm font-medium text-white mb-2">
                        Year
                    </label>
                )}
                <select 
                    value={value.year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    disabled={disabled}
                    className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#b22222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="">{placeholder.year}</option>
                    {availableYears.map((year) => (
                        <option key={year} value={year.toString()}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            {/* Make Selector */}
            <div>
                {showLabels && (
                    <label className="block text-sm font-medium text-white mb-2">
                        Make
                    </label>
                )}
                <select 
                    value={value.make}
                    onChange={(e) => handleMakeChange(e.target.value)}
                    disabled={disabled || !value.year}
                    className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#b22222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="">
                        {!value.year ? 'Select a year first' : placeholder.make}
                    </option>
                    {availableMakes
                        .sort((a, b) => a.brand.localeCompare(b.brand, undefined, { numeric: true, sensitivity: 'base' }))
                        .map((manufacturer) => (
                            <option key={manufacturer.manufacturerId} value={manufacturer.brand}>
                                {manufacturer.brand}
                            </option>
                        ))}
                </select>
            </div>

            {/* Model Selector */}
            <div>
                {showLabels && (
                    <label className="block text-sm font-medium text-white mb-2">
                        Model
                    </label>
                )}
                <select 
                    value={value.model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    disabled={disabled || !value.make || modelsLoading}
                    className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#b22222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="">
                        {getModelDropdownText()}
                    </option>
                    {filteredModels.map((model) => (
                        <option key={model.modelId} value={model.modelName}>
                            {model.modelName}
                        </option>
                    ))}
                </select>
                {modelsError && (
                    <p className="text-red-400 text-xs mt-1">
                        {modelsError}
                    </p>
                )}
            </div>
        </div>
    )
}
