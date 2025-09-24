'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VehicleInfo } from '@/app/(features)/parts/types/parts'

interface VehicleInformationFormProps {
    vehicleInfo: VehicleInfo
    onChange: (field: keyof VehicleInfo, value: string | number | undefined) => void
    className?: string
}

export default function VehicleInformationForm({ 
    vehicleInfo, 
    onChange, 
    className = "" 
}: VehicleInformationFormProps) {
    const handleChange = (field: keyof VehicleInfo, value: string) => {
        if (field === 'year') {
            const numValue = value ? parseInt(value) : undefined
            onChange(field, numValue)
        } else {
            onChange(field, value)
        }
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Vehicle Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customer_name" className="text-gray-300">
                        Customer Name
                    </Label>
                    <Input
                        id="customer_name"
                        value={vehicleInfo.customer_name || ''}
                        onChange={(e) => handleChange('customer_name', e.target.value)}
                        placeholder="John Doe"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="year" className="text-gray-300">
                        Year
                    </Label>
                    <Input
                        id="year"
                        type="number"
                        min="1900"
                        max="2030"
                        value={vehicleInfo.year || ''}
                        onChange={(e) => handleChange('year', e.target.value)}
                        placeholder="2020"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="make" className="text-gray-300">
                        Make
                    </Label>
                    <Input
                        id="make"
                        value={vehicleInfo.make || ''}
                        onChange={(e) => handleChange('make', e.target.value)}
                        placeholder="Honda"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="model" className="text-gray-300">
                        Model
                    </Label>
                    <Input
                        id="model"
                        value={vehicleInfo.model || ''}
                        onChange={(e) => handleChange('model', e.target.value)}
                        placeholder="Civic"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="engine" className="text-gray-300">
                        Engine
                    </Label>
                    <Input
                        id="engine"
                        value={vehicleInfo.engine || ''}
                        onChange={(e) => handleChange('engine', e.target.value)}
                        placeholder="1.5L Turbo"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    />
                </div>
            </div>
        </div>
    )
}
