"use client"

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Nav } from "../components/nav"
import { useState, useEffect } from "react"
import MakeModelSelector, { MakeModelSelection } from "@/components/ui/make-model-selector"

interface VehicleEngine {
    vehicleId: number
    engineType: string
    engineName: string
    capacityLt: string
    numberOfCylinders: number | string
    displacement: string
    power: string
    fuelType: string
    engineCodes?: string
    bodyType?: string
    constructionPeriod?: string
    uniqueKey?: string
}

interface PartsCategory {
    categoryId: number
    categoryName: string
    level: number
    levelId?: number
}

interface Part {
    id: string
    articleId: string  // For detailed API calls
    articleNo: string  // For article number searches
    name: string
    description: string
    supplier: string
    supplierId: number
    price: number
    availability: string
    imageUrl?: string
    partNumber: string // Additional part identification
    brandName: string // Brand/manufacturer name
    productId?: number // Product category ID
    mediaType?: string // Image media type (JPEG, GIF, etc.)
    mediaFileName?: string // Original media file name
    fullInfo?: any    // Original API data for debugging
}

export default function PartsOrdering() {
    const [selection, setSelection] = useState<MakeModelSelection>({
        make: '',
        manufacturerId: null,
        model: '',
        modelId: null,
        year: ''
    })

    const [engines, setEngines] = useState<VehicleEngine[]>([])
    const [enginesLoading, setEnginesLoading] = useState(false)
    const [selectedEngine, setSelectedEngine] = useState<VehicleEngine | null>(null)

    const [categories, setCategories] = useState<PartsCategory[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<PartsCategory | null>(null)


    const [parts, setParts] = useState<Part[]>([])
    const [partsLoading, setPartsLoading] = useState(false)
    const [partsError, setPartsError] = useState<string | null>(null)

    const handleSelectionChange = (newSelection: MakeModelSelection) => {
        setSelection(newSelection)
        
        // Reset downstream selections when vehicle changes
        setSelectedEngine(null)
        setSelectedCategory(null)
        setParts([])
        setEngines([])
        setCategories([])
    }

    // Fetch vehicle engines when make/model selection is complete
    useEffect(() => {
        if (selection.manufacturerId && selection.modelId) {
            fetchVehicleEngines()
        }
    }, [selection.manufacturerId, selection.modelId])

    // Auto-fetch parts when both engine and category are selected
    useEffect(() => {
        if (selectedEngine && selectedCategory) {
            fetchParts()
        }
    }, [selectedEngine, selectedCategory])

    const fetchVehicleEngines = async () => {
        try {
            setEnginesLoading(true)
            const response = await fetch(`/api/parts-ordering/vehicle-engines?manufacturerId=${selection.manufacturerId}&modelId=${selection.modelId}`)
            const data = await response.json()
            
            if (data.success) {
                // Parse engine data based on API response structure
                const engineData = Array.isArray(data.data) ? data.data.map((engine: any, index: number) => ({
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
                    uniqueKey: `${engine.vehicleId}-${index}` // Add unique key for React rendering
                })) : []
                
                setEngines(engineData)
            } else {
                setEngines([])
            }
        } catch (err) {
            setEngines([])
        } finally {
            setEnginesLoading(false)
        }
    }

    const fetchCategories = async (vehicleId: number) => {
        try {
            setCategoriesLoading(true)
            
            // Call the Get Category v3 API endpoint with vehicleId only
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
    }

    const fetchParts = async () => {
        if (!selectedEngine || !selectedCategory) return
        
        try {
            setPartsLoading(true)
            setPartsError(null)
            
            // Use categoryId as productGroupId for the API call
            const response = await fetch(`/api/parts-ordering/parts?vehicleId=${selectedEngine.vehicleId}&productGroupId=${selectedCategory.categoryId}`)
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
    }

    const handleEngineChange = (engineId: string) => {
        const engine = engines.find(e => e.vehicleId.toString() === engineId)
        setSelectedEngine(engine || null)
        setSelectedCategory(null)
        setParts([])
        
        if (engine) {
            fetchCategories(engine.vehicleId)
        }
    }

    const handleCategoryChange = (categoryId: string) => {
        const category = categories.find(c => c.categoryId.toString() === categoryId)
        setSelectedCategory(category || null)
        setParts([])
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={60} minSize={55} maxSize={65}>
                        <div className="h-full bg-[#1a1a1a] border-r border-[#2a2a2a] overflow-y-auto">
                            <div className="p-6">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-bold text-[#b22222] mb-2">Auto Parts Catalog</h1>
                                    <p className="text-[#979797]">Find the right parts for your vehicle</p>
                                </div>

                                {/* Step 1: Vehicle Selection */}
                                <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 mb-6">
                                    <h2 className="text-xl font-semibold text-[#b22222] mb-4">
                                        Step 1: Select Your Vehicle
                                    </h2>
                                    
                                    <MakeModelSelector
                                        value={selection}
                                        onChange={handleSelectionChange}
                                        showLabels={true}
                                        placeholder={{
                                            make: "Select a manufacturer",
                                            model: "Select a model",
                                            year: "Select a year"
                                        }}
                                    />
                                </div>

                                {/* Step 2: Engine Selection */}
                                {selection.make && selection.model && selection.year && (
                                    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 mb-6">
                                        <h2 className="text-xl font-semibold text-[#b22222] mb-4">
                                            Step 2: Select Engine Type
                                        </h2>
                                        
                                        {enginesLoading ? (
                                            <div className="text-center py-8 text-[#979797]">Loading engines...</div>
                                        ) : engines.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {engines.map((engine, index) => (
                                                    <div
                                                        key={engine.uniqueKey || `${engine.vehicleId}-${index}`}
                                                        onClick={() => handleEngineChange(engine.vehicleId.toString())}
                                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-[#b22222] ${
                                                            selectedEngine?.vehicleId === engine.vehicleId
                                                                ? 'border-[#b22222] bg-[#b22222]/10'
                                                                : 'border-[#3a3a3a] hover:bg-[#3a3a3a]'
                                                        }`}
                                                    >
                                                        <div className="font-semibold text-white mb-2">{engine.engineName}</div>
                                                        <div className="text-sm text-[#979797] space-y-1">
                                                            <div>Displacement: {engine.capacityLt}L</div>
                                                            <div>Cylinders: {engine.numberOfCylinders}</div>
                                                            {engine.power && <div>Power: {engine.power}</div>}
                                                            {engine.fuelType && <div>Fuel: {engine.fuelType}</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-[#979797]">No engines available for this model</div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Category Selection */}
                                {selectedEngine && (
                                    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 mb-6">
                                        <h2 className="text-xl font-semibold text-[#b22222] mb-4">
                                            Step 3: Select Parts Category
                                        </h2>
                                        
                                        {categoriesLoading ? (
                                            <div className="text-center py-8 text-[#979797]">Loading categories...</div>
                                        ) : categories.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                                                {categories.map(category => (
                                                    <button
                                                        key={category.categoryId}
                                                        onClick={() => handleCategoryChange(category.categoryId.toString())}
                                                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                                            selectedCategory?.categoryId === category.categoryId
                                                                ? 'bg-[#b22222] text-white'
                                                                : 'bg-[#3a3a3a] text-[#979797] hover:bg-[#4a4a4a] hover:text-white'
                                                        }`}
                                                    >
                                                        {category.categoryName}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-[#979797]">No categories available for this engine</div>
                                        )}

                                        {/* Show selected category status */}
                                        {selectedCategory && (
                                            <div className="mt-4 p-3 bg-[#b22222]/10 border border-[#b22222]/20 rounded-lg">
                                                <div className="text-sm text-[#b22222] font-medium">
                                                    Selected: {selectedCategory.categoryName}
                                                </div>
                                                <div className="text-xs text-[#979797] mt-1">
                                                    Parts will load automatically below
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 4: Parts Display */}
                                {selectedCategory && (
                                    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6">
                                        <h2 className="text-xl font-semibold text-[#b22222] mb-4">
                                            Step 4: Available Parts
                                        </h2>
                                        
                                        {partsLoading ? (
                                            <div className="text-center py-8 text-[#979797]">Loading parts...</div>
                                        ) : partsError ? (
                                            <div className="text-center py-8 text-red-400">Error: {partsError}</div>
                                        ) : parts.length > 0 ? (
                                            <div className="space-y-4">
                                                <div className="text-sm text-[#979797] mb-4">Found {parts.length} parts</div>
                                                {parts.map((part) => (
                                                    <div key={part.id} className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg p-4 hover:bg-[#4a4a4a] transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-start gap-4">
                                                                {part.imageUrl && (
                                                                    <img 
                                                                        src={part.imageUrl} 
                                                                        alt={part.name}
                                                                        className="w-16 h-16 object-cover rounded-lg bg-white p-1"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement
                                                                            target.style.display = 'none'
                                                                        }}
                                                                    />
                                                                )}
                                                                <div>
                                                                    <h3 className="font-semibold text-white text-lg">{part.name}</h3>
                                                                    <div className="text-sm text-[#979797]">Article ID: {part.articleId}</div>
                                                                </div>
                                                            </div>
                                                            {part.price > 0 && (
                                                                <span className="text-[#b22222] font-bold text-lg">${part.price.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[#979797] mb-3">
                                                            <div>
                                                                <span className="font-medium">Article No:</span>
                                                                <div>{part.articleNo}</div>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Supplier:</span>
                                                                <div>{part.supplier}</div>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Supplier ID:</span>
                                                                <div>{part.supplierId}</div>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Availability:</span>
                                                                <div>{part.availability}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end">
                                                            <button className="px-4 py-2 bg-[#b22222] hover:bg-[#a01e1e] text-white text-sm rounded transition-colors">
                                                                Add to Cart
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : selectedCategory ? (
                                            <div className="text-center py-8 text-[#979797]">No parts available for this category</div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={40} minSize={35} maxSize={45}>
                        <div className="h-full bg-[#1a1a1a]">
                            This is the Mia AI chat
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}