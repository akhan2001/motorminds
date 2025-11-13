'use client'

import { Button } from '@/components/ui/button'
import { Car, User } from 'lucide-react'
import type { CustomerVehicle } from '../../types/vehicle'

interface VehicleSearchResultsProps {
    results: CustomerVehicle[]
    onVehicleSelect: (vehicle: CustomerVehicle) => void
    disabled?: boolean
}

export const VehicleSearchResults: React.FC<VehicleSearchResultsProps> = ({
    results,
    onVehicleSelect,
    disabled = false
}) => {
    if (!results || results.length === 0) {
        return null
    }

    return (
        <div className="border border-[#2a2a2a] rounded-lg divide-y divide-[#2a2a2a] bg-[#1a1a1a]">
            <div className="px-4 py-2 bg-[#2a2a2a] rounded-t-lg">
                <h4 className="text-sm font-medium text-white">
                    Found {results.length} vehicle{results.length !== 1 ? 's' : ''}
                </h4>
            </div>
            
            {results.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 hover:bg-[#2a2a2a] transition-colors">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-[#2a2a2a] rounded-lg">
                            <Car className="h-4 w-4 text-blue-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-white font-medium">
                                    {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}
                                </h5>
                                {vehicle.customer_id && (
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <User className="h-3 w-3" />
                                        <span>Registered</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-1">
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span>
                                        <strong className="text-gray-300">Plate:</strong> {vehicle.license_plate || '—'}
                                    </span>
                                    {vehicle.color && (
                                        <span>
                                            <strong className="text-gray-300">Color:</strong> {vehicle.color}
                                        </span>
                                    )}
                                </div>
                                
                                {(vehicle.vin || vehicle.mileage) && (
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        {vehicle.vin && (
                                            <span>
                                                <strong className="text-gray-300">VIN:</strong> {vehicle.vin}
                                            </span>
                                        )}
                                        {vehicle.mileage && (
                                            <span>
                                                <strong className="text-gray-300">Mileage:</strong> {vehicle.mileage.toLocaleString()} kms
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <Button
                        type="button"
                        onClick={() => onVehicleSelect(vehicle)}
                        disabled={disabled}
                        className="bg-blue-600 hover:bg-blue-700 text-white ml-4"
                        size="sm"
                    >
                        Use Vehicle
                    </Button>
                </div>
            ))}
        </div>
    )
}

export default VehicleSearchResults
