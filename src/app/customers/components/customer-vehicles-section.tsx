'use client'

import React, { useState, useCallback } from 'react'
import { Car, Calendar, Wrench, Plus, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { VehicleService } from '@/app/(features)/customers/lib/vehicle-service'
import { VehicleInformation } from '@/app/(features)/operations/components/work-orders/shared/vehicle-information'
import type { VehicleOption } from '@/app/(features)/customers/types/vehicle'

interface Vehicle {
    id: string
    year?: number
    make?: string
    model?: string
    license_plate?: string
    vin?: string
    color?: string
    engine?: string
    mileage?: string
    created_at?: string
}

interface CustomerVehiclesSectionProps {
    vehicles: Vehicle[]
    loading?: boolean
    customerId?: string
    onVehiclesUpdated?: () => void
}

export const CustomerVehiclesSection: React.FC<CustomerVehiclesSectionProps> = ({ 
    vehicles, 
    loading = false,
    customerId,
    onVehiclesUpdated
}) => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    
    // Form state for creating/editing
    const [vehicleFormData, setVehicleFormData] = useState({
        vehicleYear: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleColor: '',
        vehicleVin: '',
        vehicleLicensePlate: '',
        vehicleMileage: '',
    })

    const handleFieldChange = useCallback((field: string, value: string) => {
        setVehicleFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }, [])

    const resetForm = useCallback(() => {
        setVehicleFormData({
            vehicleYear: '',
            vehicleMake: '',
            vehicleModel: '',
            vehicleColor: '',
            vehicleVin: '',
            vehicleLicensePlate: '',
            vehicleMileage: '',
        })
    }, [])

    const handleCreateClick = useCallback(() => {
        resetForm()
        setIsCreateDialogOpen(true)
    }, [resetForm])

    const handleEditClick = useCallback((vehicle: Vehicle) => {
        setVehicleFormData({
            vehicleYear: vehicle.year?.toString() || '',
            vehicleMake: vehicle.make || '',
            vehicleModel: vehicle.model || '',
            vehicleColor: vehicle.color || '',
            vehicleVin: vehicle.vin || '',
            vehicleLicensePlate: vehicle.license_plate || '',
            vehicleMileage: vehicle.mileage || '',
        })
        setEditingVehicle(vehicle)
    }, [])

    const handleDeleteClick = useCallback(async (vehicleId: string) => {
        if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
            return
        }

        setIsDeleting(vehicleId)
        try {
            await VehicleService.deleteVehicle(vehicleId)
            toast.success('Vehicle deleted successfully')
            onVehiclesUpdated?.()
        } catch (error: any) {
            console.error('Error deleting vehicle:', error)
            toast.error(error.message || 'Failed to delete vehicle')
        } finally {
            setIsDeleting(null)
        }
    }, [onVehiclesUpdated])

    const handleVehicleSaved = useCallback(async (vehicleId: string, vehicleData: any) => {
        // This is called when a new vehicle is saved from VehicleInformation component
        setIsCreateDialogOpen(false)
        resetForm()
        onVehiclesUpdated?.()
    }, [resetForm, onVehiclesUpdated])

    const handleSaveEdit = useCallback(async () => {
        if (!editingVehicle || !customerId) return

        try {
            await VehicleService.updateVehicle(editingVehicle.id, {
                year: vehicleFormData.vehicleYear,
                make: vehicleFormData.vehicleMake,
                model: vehicleFormData.vehicleModel,
                color: vehicleFormData.vehicleColor,
                vin: vehicleFormData.vehicleVin,
                licensePlate: vehicleFormData.vehicleLicensePlate,
                mileage: vehicleFormData.vehicleMileage,
            })
            
            toast.success('Vehicle updated successfully')
            setEditingVehicle(null)
            resetForm()
            onVehiclesUpdated?.()
        } catch (error: any) {
            console.error('Error updating vehicle:', error)
            toast.error(error.message || 'Failed to update vehicle')
        }
    }, [editingVehicle, customerId, vehicleFormData, resetForm, onVehiclesUpdated])

    const handleCloseCreateDialog = useCallback(() => {
        setIsCreateDialogOpen(false)
        resetForm()
    }, [resetForm])

    const handleCloseEditDialog = useCallback(() => {
        setEditingVehicle(null)
        resetForm()
    }, [resetForm])

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

    const formatVehicleInfo = (vehicle: Vehicle) => {
        const parts = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean)
        return parts.length > 0 ? parts.join(' ') : 'Unknown Vehicle'
    }

    return (
        <>
            <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Car className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            Vehicles ({vehicles?.length || 0})
                        </CardTitle>
                        {customerId && (
                            <Button
                                onClick={handleCreateClick}
                                size="sm"
                                variant="outline"
                                className="h-8"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Vehicle
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {!vehicles || vehicles.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground dark:text-gray-400 mb-4">No vehicles registered</p>
                                {customerId && (
                                    <Button
                                        onClick={handleCreateClick}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add First Vehicle
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto pr-2">
                            <div className="space-y-3">
                                {vehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        className="p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a] hover:border-accent dark:hover:border-[#333333] transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                                                                className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                                                                style={{ backgroundColor: vehicle.color.toLowerCase() }}
                                                            />
                                                            <span className="truncate">{vehicle.color}</span>
                                                        </div>
                                                    )}
                                                    {vehicle.engine && (
                                                        <div className="flex items-center gap-1">
                                                            <Wrench className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">{vehicle.engine}</span>
                                                        </div>
                                                    )}
                                                    {vehicle.vin && (
                                                        <div className="md:col-span-2 text-xs font-mono truncate">
                                                            VIN: {vehicle.vin}
                                                        </div>
                                                    )}
                                                    {vehicle.mileage && (
                                                        <div className="text-xs">
                                                            Mileage: {vehicle.mileage}
                                                        </div>
                                                    )}
                                                    {vehicle.created_at && (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                            <span>Added: {new Date(vehicle.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {customerId && (
                                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                    <Button
                                                        onClick={() => handleEditClick(vehicle)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteClick(vehicle.id)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                        disabled={isDeleting === vehicle.id}
                                                    >
                                                        {isDeleting === vehicle.id ? (
                                                            <div className="h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Vehicle Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Vehicle</DialogTitle>
                        <DialogDescription className="text-muted-foreground dark:text-gray-400">Add a new vehicle to the customer's profile</DialogDescription>
                    </DialogHeader>
                        <VehicleInformation
                            customerId={customerId}
                            vehicleYear={vehicleFormData.vehicleYear}
                            vehicleMake={vehicleFormData.vehicleMake}
                            vehicleModel={vehicleFormData.vehicleModel}
                            vehicleColor={vehicleFormData.vehicleColor}
                            vehicleVin={vehicleFormData.vehicleVin}
                            vehicleLicensePlate={vehicleFormData.vehicleLicensePlate}
                            vehicleMileage={vehicleFormData.vehicleMileage}
                            isEditing={true}
                            isCreating={true}
                            onFieldChange={handleFieldChange}
                            onVehicleSaved={handleVehicleSaved}
                        />
                </DialogContent>
            </Dialog>

            {/* Edit Vehicle Dialog */}
            <Dialog open={!!editingVehicle} onOpenChange={(open) => !open && handleCloseEditDialog()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Vehicle</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <VehicleInformation
                            customerId={customerId}
                            vehicleId={editingVehicle?.id}
                            vehicleYear={vehicleFormData.vehicleYear}
                            vehicleMake={vehicleFormData.vehicleMake}
                            vehicleModel={vehicleFormData.vehicleModel}
                            vehicleColor={vehicleFormData.vehicleColor}
                            vehicleVin={vehicleFormData.vehicleVin}
                            vehicleLicensePlate={vehicleFormData.vehicleLicensePlate}
                            vehicleMileage={vehicleFormData.vehicleMileage}
                            isEditing={true}
                            isCreating={false}
                            onFieldChange={handleFieldChange}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button
                                onClick={handleCloseEditDialog}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
