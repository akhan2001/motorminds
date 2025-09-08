import { useState } from 'react'
import { Car, X } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { VehicleInputData } from './MiaDiagnostics.types'

interface VehicleInfoFormProps {
    vehicleInfo: VehicleInputData
    onVehicleInfoChange: (vehicleInfo: VehicleInputData) => void
    onClose?: () => void
}

export const VehicleInfoForm = ({
    vehicleInfo,
    onVehicleInfoChange,
    onClose
}: VehicleInfoFormProps) => {
    const [formData, setFormData] = useState<VehicleInputData>(vehicleInfo)

    const handleInputChange = (field: keyof VehicleInputData, value: string) => {
        const updatedData = { ...formData, [field]: value }
        setFormData(updatedData)
        onVehicleInfoChange(updatedData)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onVehicleInfoChange(formData)
        onClose?.()
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Car size={16} />
                    Vehicle Information
                </h3>
                {onClose && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-6 w-6 text-gray-400 hover:text-white"
                    >
                        <X size={14} />
                    </Button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-3">
                <div className="space-y-2">
                    <Label htmlFor="year" className="text-xs text-gray-300">Year</Label>
                    <Input
                        id="year"
                        type="text"
                        value={formData.year || ''}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        placeholder="e.g., 2020"
                        className="h-8 text-sm bg-[#1a1a1a] border-[#444444] text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="make" className="text-xs text-gray-300">Make</Label>
                    <Input
                        id="make"
                        type="text"
                        value={formData.make || ''}
                        onChange={(e) => handleInputChange('make', e.target.value)}
                        placeholder="e.g., Toyota"
                        className="h-8 text-sm bg-[#1a1a1a] border-[#444444] text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="model" className="text-xs text-gray-300">Model</Label>
                    <Input
                        id="model"
                        type="text"
                        value={formData.model || ''}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        placeholder="e.g., Camry"
                        className="h-8 text-sm bg-[#1a1a1a] border-[#444444] text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="engine" className="text-xs text-gray-300">Engine</Label>
                    <Input
                        id="engine"
                        type="text"
                        value={formData.engine || ''}
                        onChange={(e) => handleInputChange('engine', e.target.value)}
                        placeholder="e.g., 2.5L 4-cylinder"
                        className="h-8 text-sm bg-[#1a1a1a] border-[#444444] text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mileage" className="text-xs text-gray-300">Mileage</Label>
                    <Input
                        id="mileage"
                        type="text"
                        value={formData.mileage || ''}
                        onChange={(e) => handleInputChange('mileage', e.target.value)}
                        placeholder="e.g., 75,000 miles"
                        className="h-8 text-sm bg-[#1a1a1a] border-[#444444] text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="vin" className="text-xs text-gray-300">VIN</Label>
                    <Input
                        id="vin"
                        type="text"
                        value={formData.vin || ''}
                        onChange={(e) => handleInputChange('vin', e.target.value)}
                        placeholder="17-character VIN"
                        className="h-8 text-sm bg-[#1a1a1a] border-[#444444] text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="symptoms" className="text-xs text-gray-300">Symptoms</Label>
                    <Input
                        id="symptoms"
                        type="text"
                        value={formData.symptoms || ''}
                        onChange={(e) => handleInputChange('symptoms', e.target.value)}
                        placeholder="Describe the issue"
                        className="h-8 text-sm bg-[#1a1a1a] border-[#444444] text-white"
                    />
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        size="sm"
                        className="w-full bg-[#f52f2f] hover:bg-[#f52f2f]/90 text-white"
                    >
                        Save Vehicle Info
                    </Button>
                </div>
            </form>
        </div>
    )
}
