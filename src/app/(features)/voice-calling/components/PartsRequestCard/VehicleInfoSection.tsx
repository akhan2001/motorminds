'use client'

import { Car } from 'lucide-react'
import { memo } from 'react'

interface VehicleInfo {
    year?: string
    make?: string
    model?: string
    vin?: string
    engine?: string
}

interface VehicleInfoSectionProps {
    vehicleInfo: VehicleInfo
}

export const VehicleInfoSection = memo(function VehicleInfoSection({ vehicleInfo }: VehicleInfoSectionProps) {
    const { year, make, model, vin, engine } = vehicleInfo

    return (
        <div className="flex items-start gap-3 text-sm">
            <Car className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-200">
                    {year} {make} {model}
                </div>
                {(vin || engine) && (
                    <div className="text-gray-400 text-xs mt-1 space-y-0.5">
                        {vin && <div>VIN: {vin}</div>}
                        {engine && <div>Engine: {engine}</div>}
                    </div>
                )}
            </div>
        </div>
    )
})

