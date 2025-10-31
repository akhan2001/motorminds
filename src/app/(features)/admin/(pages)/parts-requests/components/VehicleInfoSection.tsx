'use client'

import { Car } from 'lucide-react'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface VehicleInfoSectionProps {
  request: PartsRequest
}

export function VehicleInfoSection({ request }: VehicleInfoSectionProps) {
  return (
    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Car className="h-4 w-4 text-orange-400" />
        Vehicle Information
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {request.vehicle_info?.customer_name && (
          <div className="md:col-span-3 text-gray-300">
            <span className="text-gray-500 font-medium">Customer:</span> {request.vehicle_info.customer_name}
          </div>
        )}
        {request.vehicle_info?.year && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Year:</span> {request.vehicle_info.year}
          </div>
        )}
        {request.vehicle_info?.make && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Make:</span> {request.vehicle_info.make}
          </div>
        )}
        {request.vehicle_info?.model && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Model:</span> {request.vehicle_info.model}
          </div>
        )}
        {request.vehicle_info?.vin && (
          <div className="text-gray-300 font-mono text-xs">
            <span className="text-gray-500 font-medium">VIN:</span> {request.vehicle_info.vin}
          </div>
        )}
        {request.vehicle_info?.engine && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Engine:</span> {
              typeof request.vehicle_info.engine === 'object' 
                ? (request.vehicle_info.engine as any)?.engineName || JSON.stringify(request.vehicle_info.engine)
                : request.vehicle_info.engine
            }
          </div>
        )}
        {request.vehicle_info?.mileage && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Mileage:</span> {request.vehicle_info.mileage.toLocaleString()} km
          </div>
        )}
      </div>
    </div>
  )
}
