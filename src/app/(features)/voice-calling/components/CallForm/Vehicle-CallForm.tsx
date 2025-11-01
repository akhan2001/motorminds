'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car } from 'lucide-react'
import { VehicleInfo } from '@/app/(features)/voice-calling/types'

interface VehicleCallFormProps {
    vehicleInfo: VehicleInfo
    onVehicleChange: (field: keyof VehicleInfo, value: string) => void
}

export default function VehicleCallForm({ 
    vehicleInfo, 
    onVehicleChange 
}: VehicleCallFormProps) {
    return (
        <Card className="bg-card dark:bg-[#111111] border-border dark:border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-foreground dark:text-white flex items-center gap-2">
                    <Car className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Vehicle Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label className="text-foreground dark:text-white">Year</Label>
                        <Input
                            value={vehicleInfo.year}
                            onChange={(e) => onVehicleChange('year', e.target.value)}
                            placeholder="2020"
                            className="bg-background dark:bg-gray-900 border-border dark:border-gray-700 text-foreground dark:text-white"
                        />
                    </div>
                    <div>
                        <Label className="text-foreground dark:text-white">Make</Label>
                        <Input
                            value={vehicleInfo.make}
                            onChange={(e) => onVehicleChange('make', e.target.value)}
                            placeholder="Toyota"
                            className="bg-background dark:bg-gray-900 border-border dark:border-gray-700 text-foreground dark:text-white"
                        />
                    </div>
                    <div>
                        <Label className="text-foreground dark:text-white">Model</Label>
                        <Input
                            value={vehicleInfo.model}
                            onChange={(e) => onVehicleChange('model', e.target.value)}
                            placeholder="Camry"
                            className="bg-background dark:bg-gray-900 border-border dark:border-gray-700 text-foreground dark:text-white"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label className="text-foreground dark:text-white">VIN</Label>
                        <Input
                            value={vehicleInfo.vin}
                            onChange={(e) => onVehicleChange('vin', e.target.value)}
                            placeholder="Enter VIN number"
                            className="bg-background dark:bg-gray-900 border-border dark:border-gray-700 text-foreground dark:text-white"
                        />
                    </div>
                    <div>
                        <Label className="text-foreground dark:text-white">Mileage</Label>
                        <Input
                            value={vehicleInfo.mileage}
                            onChange={(e) => onVehicleChange('mileage', e.target.value)}
                            placeholder="50,000"
                            className="bg-background dark:bg-gray-900 border-border dark:border-gray-700 text-foreground dark:text-white"
                        />
                    </div>
                    <div>
                        <Label className="text-foreground dark:text-white">Engine</Label>
                        <Input
                            value={vehicleInfo.engine}
                            onChange={(e) => onVehicleChange('engine', e.target.value)}
                            placeholder="2.5L 4-Cylinder"
                            className="bg-background dark:bg-gray-900 border-border dark:border-gray-700 text-foreground dark:text-white"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
