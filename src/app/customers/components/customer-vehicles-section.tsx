'use client'

import React from 'react'
import { Car, Calendar, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface Vehicle {
    id: string
    year?: number
    make?: string
    model?: string
    license_plate?: string
    vin?: string
    color?: string
    engine?: string
    created_at?: string
}

interface CustomerVehiclesSectionProps {
    vehicles: Vehicle[]
    loading?: boolean
}

export const CustomerVehiclesSection: React.FC<CustomerVehiclesSectionProps> = ({ 
    vehicles, 
    loading = false 
}) => {
    if (loading) {
        return (
            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        Vehicles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-pulse text-muted-foreground dark:text-gray-400">
                            Loading vehicles...
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!vehicles || vehicles.length === 0) {
        return (
            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        Vehicles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground dark:text-gray-400">No vehicles registered</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const formatVehicleInfo = (vehicle: Vehicle) => {
        const parts = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean)
        return parts.length > 0 ? parts.join(' ') : 'Unknown Vehicle'
    }

    return (
        <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    Vehicles ({vehicles.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="max-h-[300px]">
                    <div className="space-y-3">
                        {vehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className="p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a] hover:border-accent dark:hover:border-[#333333] transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-medium text-foreground dark:text-white">
                                                {formatVehicleInfo(vehicle)}
                                            </h4>
                                            {vehicle.license_plate && (
                                                <Badge variant="outline" className="text-xs">
                                                    {vehicle.license_plate}
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground dark:text-gray-400">
                                            {vehicle.color && (
                                                <div className="flex items-center gap-1">
                                                    <div 
                                                        className="w-3 h-3 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: vehicle.color.toLowerCase() }}
                                                    />
                                                    <span>{vehicle.color}</span>
                                                </div>
                                            )}
                                            {vehicle.engine && (
                                                <div className="flex items-center gap-1">
                                                    <Wrench className="h-3 w-3" />
                                                    <span>{vehicle.engine}</span>
                                                </div>
                                            )}
                                            {vehicle.vin && (
                                                <div className="md:col-span-2 text-xs font-mono">
                                                    VIN: {vehicle.vin}
                                                </div>
                                            )}
                                            {vehicle.created_at && (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Calendar className="h-3 w-3" />
                                                    Added: {new Date(vehicle.created_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
