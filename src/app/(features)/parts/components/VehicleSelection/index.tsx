'use client'

import React from 'react'
import MakeModelSelector from '@/components/ui/make-model-selector'
import { VinDecoder } from './VinDecoder'
import { EngineGrid } from './EngineGrid'
import { usePartsOrderingContext } from '../../context/PartsOrderingContext'

export const VehicleSelection: React.FC = () => {
    const { vehicleData, vinData } = usePartsOrderingContext()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#b22222] mb-2">Auto Parts Catalog</h1>
                <p className="text-[#979797]">Find the right parts for your vehicle</p>
            </div>

            {/* VIN Decoder Section */}
            <VinDecoder
                vinInput={vinData.vinInput}
                setVinInput={vinData.setVinInput}
                vinDecoding={vinData.vinDecoding}
                vinDecodeError={vinData.vinDecodeError}
                setVinDecodeError={vinData.setVinDecodeError}
                vinDecodeSuccess={vinData.vinDecodeSuccess}
                showVinInput={vinData.showVinInput}
                setShowVinInput={vinData.setShowVinInput}
                onVinDecode={vehicleData.handleVinDecode}
            />

            {/* Step 1: Vehicle Selection */}
            <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-[#b22222] mb-4">
                    Step 1: Select Your Vehicle
                </h2>
                
                <MakeModelSelector
                    value={vehicleData.selection}
                    onChange={vehicleData.setSelection}
                    showLabels={true}
                    placeholder={{
                        make: "Select a manufacturer",
                        model: "Select a model",
                        year: "Select a year"
                    }}
                />
            </div>

            {/* Step 2: Engine Selection */}
            {vehicleData.selection.make && vehicleData.selection.model && vehicleData.selection.year && (
                <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-[#b22222] mb-4">
                        Step 2: Select Engine Type
                    </h2>
                    
                    <EngineGrid
                        engines={vehicleData.engines}
                        selectedEngine={vehicleData.selectedEngine}
                        onEngineChange={vehicleData.setSelectedEngine}
                        isLoading={vehicleData.enginesLoading}
                    />
                </div>
            )}
        </div>
    )
}
