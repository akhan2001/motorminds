import { useState, useEffect, useCallback } from 'react'
import { MakeModelSelection } from '@/components/ui/make-model-selector'

export interface VehicleEngine {
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

export const useVehicleSelection = () => {
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

    const fetchVehicleEngines = useCallback(async () => {
        if (!selection.manufacturerId || !selection.modelId) return

        try {
            setEnginesLoading(true)
            const response = await fetch(`/api/parts-ordering/vehicle-engines?manufacturerId=${selection.manufacturerId}&modelId=${selection.modelId}`)
            const data = await response.json()
            
            if (data.success) {
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
                    uniqueKey: `${engine.vehicleId}-${index}`
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
    }, [selection.manufacturerId, selection.modelId])

    // Fetch engines when make/model selection is complete
    useEffect(() => {
        if (selection.manufacturerId && selection.modelId) {
            fetchVehicleEngines()
        }
    }, [fetchVehicleEngines])

    const handleSelectionChange = useCallback((newSelection: MakeModelSelection) => {
        setSelection(newSelection)
        
        // Reset downstream selections when vehicle changes
        setSelectedEngine(null)
        setEngines([])
    }, [])

    const handleEngineChange = useCallback((engineId: string) => {
        const engine = engines.find(e => e.vehicleId.toString() === engineId)
        setSelectedEngine(engine || null)
    }, [engines])

    return {
        selection,
        engines,
        enginesLoading,
        selectedEngine,
        setSelection: handleSelectionChange,
        setSelectedEngine: handleEngineChange,
        fetchVehicleEngines
    }
}
