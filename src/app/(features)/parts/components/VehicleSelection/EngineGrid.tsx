'use client'

import React from 'react'
import { VehicleEngine } from '../../hooks/useVehicleSelection'

interface EngineGridProps {
    engines: VehicleEngine[]
    selectedEngine: VehicleEngine | null
    onEngineChange: (engineId: string) => void
    isLoading: boolean
}

export const EngineGrid: React.FC<EngineGridProps> = React.memo(({
    engines,
    selectedEngine,
    onEngineChange,
    isLoading
}) => {
    if (isLoading) {
        return (
            <div className="text-center py-8 text-[#979797]">
                Loading engines...
            </div>
        )
    }

    if (engines.length === 0) {
        return (
            <div className="text-center py-8 text-[#979797]">
                No engines available for this model
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {engines.map((engine, index) => (
                <div
                    key={engine.uniqueKey || `${engine.vehicleId}-${index}`}
                    onClick={() => onEngineChange(engine.vehicleId.toString())}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-[#b22222] ${
                        selectedEngine?.vehicleId === engine.vehicleId
                            ? 'border-[#b22222] bg-[#b22222]/10'
                            : 'border-[#3a3a3a] hover:bg-[#3a3a3a]'
                    }`}
                >
                    <div className="font-semibold text-white mb-2">
                        {engine.engineName}
                    </div>
                    <div className="text-sm text-[#979797] space-y-1">
                        <div>Displacement: {engine.capacityLt}L</div>
                        <div>Cylinders: {engine.numberOfCylinders}</div>
                        {engine.power && <div>Power: {engine.power}</div>}
                        {engine.fuelType && <div>Fuel: {engine.fuelType}</div>}
                    </div>
                </div>
            ))}
        </div>
    )
})
