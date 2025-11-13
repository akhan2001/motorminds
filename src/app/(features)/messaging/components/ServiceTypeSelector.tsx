'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ServiceType } from '../types/message-template'
import { Badge } from '@/components/ui/badge'

interface ServiceTypeSelectorProps {
    value: ServiceType
    onChange: (value: ServiceType) => void
    disabled?: boolean
}

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
    { value: null, label: 'All Services (General)' },
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'brake_service', label: 'Brake Service' },
    { value: 'tire_rotation', label: 'Tire Rotation' },
    { value: 'tire_replacement', label: 'Tire Replacement' },
    { value: 'wheel_alignment', label: 'Wheel Alignment' },
    { value: 'engine_diagnostic', label: 'Engine Diagnostic' },
    { value: 'transmission_service', label: 'Transmission Service' },
    { value: 'battery_service', label: 'Battery Service' },
    { value: 'air_filter_replacement', label: 'Air Filter Replacement' },
    { value: 'coolant_flush', label: 'Coolant Flush' },
    { value: 'spark_plug_replacement', label: 'Spark Plug Replacement' },
    { value: 'brake_fluid_flush', label: 'Brake Fluid Flush' },
    { value: 'power_steering_flush', label: 'Power Steering Flush' },
    { value: 'general_inspection', label: 'General Inspection' },
    { value: 'other', label: 'Other Services' }
]

export function ServiceTypeSelector({ value, onChange, disabled }: ServiceTypeSelectorProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="service-type">Service Type (Optional)</Label>
                {value === null && (
                    <Badge variant="outline" className="text-xs">
                        Applies to all services
                    </Badge>
                )}
            </div>
            <Select 
                value={value ?? 'null'} 
                onValueChange={(v) => onChange(v === 'null' ? null : v as ServiceType)}
                disabled={disabled}
            >
                <SelectTrigger id="service-type">
                    <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                    {SERVICE_TYPES.map((service) => (
                        <SelectItem key={service.value ?? 'null'} value={service.value ?? 'null'}>
                            {service.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
                Leave as "All Services" to trigger this message for any work order
            </p>
        </div>
    )
}

