"use client"

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Nav } from "../components/nav"
import { useState, useEffect } from "react"
import manufacturersData from "./manufacturers.json"

interface Part {
    id: string
    name: string
    partNumber: string
    category: string
    price: number
    description: string
    compatibleYears: string[]
    manufacturer: string
    inStock: boolean
    imageUrl: string
}

interface PartsResponse {
    success: boolean
    data: {
        vehicle: {
            make: string
            model: string
            year: string
            manufacturerId: number
            modelId: number
            vehicleTypeId: number
            engineId: number
        }
        parts: Part[]
        totalCount: number
        categories: string[]
        source: string
    }
    message: string
}

interface FilterOptions {
    make: string
    manufacturerId: number | null
    model: string
    modelId: number | null
}

export default function PartsOrdering() {
    const [parts, setParts] = useState<Part[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [vehicleInfo, setVehicleInfo] = useState<{make: string, model: string, year: string} | null>(null)
    const [models, setModels] = useState<Array<{modelId: number, modelName: string}>>([])
    const [modelsLoading, setModelsLoading] = useState(false)
    const [filters, setFilters] = useState<FilterOptions>({
        make: '',
        manufacturerId: null,
        model: '',
        modelId: null
    })

    useEffect(() => {
        fetchParts()
    }, [])

    const fetchModels = async (manufacturerId: number) => {
        try {
            setModelsLoading(true)
            const response = await fetch(`/api/parts-ordering/models?manufacturerId=${manufacturerId}`)
            const data = await response.json()
            
            console.log('Models API Response:', data)
            
            if (data.success) {
                // Parse the models data - adjust this based on the actual API response structure
                let modelsData = []
                
                if (Array.isArray(data.data)) {
                    modelsData = data.data.map((model: any) => ({
                        modelId: model.id || model.modelId,
                        modelName: model.name || model.modelName || model.title
                    }))
                } else if (data.data && Array.isArray(data.data.models)) {
                    modelsData = data.data.models.map((model: any) => ({
                        modelId: model.id || model.modelId,
                        modelName: model.name || model.modelName || model.title
                    }))
                }
                
                console.log('Parsed models:', modelsData)
                setModels(modelsData)
            } else {
                console.error('Failed to fetch models:', data.message)
                setModels([])
            }
        } catch (err) {
            console.error('Error fetching models:', err)
            setModels([])
        } finally {
            setModelsLoading(false)
        }
    }

    const fetchParts = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const params = new URLSearchParams()
            
            if (filters.manufacturerId) params.append('manufacturerId', filters.manufacturerId.toString())
            if (filters.modelId) params.append('modelId', filters.modelId.toString())
            
            const response = await fetch(`/api/parts-ordering?${params.toString()}`)
            const data: PartsResponse = await response.json()
            
            if (data.success) {
                setParts(data.data.parts)
                setVehicleInfo(data.data.vehicle)
            } else {
                setError('Failed to fetch parts data')
            }
        } catch (err) {
            setError('Error loading parts')
            console.error('Error fetching parts:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key: keyof FilterOptions, value: string) => {
        if (key === 'make') {
            // Find the manufacturerId for the selected brand
            const selectedManufacturer = manufacturersData.manufacturers.find(
                manufacturer => manufacturer.brand === value
            )
            const manufacturerId = selectedManufacturer ? selectedManufacturer.manufacturerId : null
            
            setFilters(prev => ({ 
                ...prev, 
                make: value,
                manufacturerId: manufacturerId,
                model: '', // Reset model when manufacturer changes
                modelId: null
            }))
            
            // Fetch models for the selected manufacturer
            if (manufacturerId) {
                fetchModels(manufacturerId)
            } else {
                setModels([])
            }
        } else if (key === 'model') {
            // Find the modelId for the selected model
            const selectedModel = models.find(model => model.modelName === value)
            setFilters(prev => ({ 
                ...prev, 
                model: value,
                modelId: selectedModel ? selectedModel.modelId : null
            }))
        } else if (key === 'manufacturerId') {
            setFilters(prev => ({ ...prev, manufacturerId: parseInt(value) || null }))
        } else if (key === 'modelId') {
            setFilters(prev => ({ ...prev, modelId: parseInt(value) || null }))
        }
    }

    const handleSubmit = () => {
        fetchParts()
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={60} minSize={55} maxSize={65}>
                        <div className="h-full bg-[#1a1a1a] border-r border-[#2a2a2a] p-6 overflow-y-auto">
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-white mb-2">Parts Catalog</h1>
                                {vehicleInfo && (
                                    <p className="text-[#979797]">
                                        {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.year}
                                    </p>
                                )}
                            </div>

                            {/* Filter Controls */}
                            <div className="mb-6 space-y-4">
                                {/* Make Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Make</label>
                                    <select 
                                        value={filters.make}
                                        onChange={(e) => handleFilterChange('make', e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#b22222] transition-colors"
                                    >
                                        <option value="">Select a manufacturer</option>
                                        {manufacturersData.manufacturers.map((manufacturer) => (
                                            <option key={manufacturer.manufacturerId} value={manufacturer.brand}>
                                                {manufacturer.brand}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Model Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Model</label>
                                    <select 
                                        value={filters.model}
                                        onChange={(e) => handleFilterChange('model', e.target.value)}
                                        disabled={!filters.manufacturerId || modelsLoading}
                                        className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#b22222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">
                                            {modelsLoading ? 'Loading models...' : !filters.manufacturerId ? 'Select a manufacturer first' : 'Select a model'}
                                        </option>
                                        {models.map((model) => (
                                            <option key={model.modelId} value={model.modelName}>
                                                {model.modelName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button 
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full px-6 py-3 bg-[#b22222] hover:bg-[#a01e1e] disabled:bg-[#666] disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                                    >
                                        {loading ? 'Searching...' : 'Search Parts'}
                                    </button>
                                </div>
                            </div>
                            
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-white">Loading parts...</div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-red-400">Error: {error}</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {parts.map((part) => (
                                        <div key={part.id} className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 hover:bg-[#3a3a3a] transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="text-white font-medium text-lg">{part.name}</h3>
                                                    <p className="text-[#979797] text-sm">Part Number: {part.partNumber}</p>
                                                    <p className="text-[#979797] text-sm">Category: {part.category}</p>
                                                    <p className="text-[#979797] text-sm">Manufacturer: {part.manufacturer}</p>
                                                    {part.description && (
                                                        <p className="text-[#979797] text-xs mt-1">{part.description}</p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-[#b22222] font-bold text-lg">${part.price.toFixed(2)}</p>
                                                    <div className="mt-2">
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            part.inStock 
                                                                ? 'bg-green-600 text-white' 
                                                                : 'bg-red-600 text-white'
                                                        }`}>
                                                            {part.inStock ? 'In Stock' : 'Out of Stock'}
                                                        </span>
                                                    </div>
                                                    <button 
                                                        className="mt-2 px-4 py-2 bg-[#b22222] hover:bg-[#a01e1e] text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={!part.inStock}
                                                    >
                                                        Add to Cart
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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