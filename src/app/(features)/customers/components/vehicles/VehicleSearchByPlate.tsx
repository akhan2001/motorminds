'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle, Search, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useDebouncedVehicleSearch, useCreateWalkInVehicle } from '@/hooks/use-vehicle-search'
import { VehicleSearchResults } from './VehicleSearchResults'
import type { CustomerVehicle, WalkInVehicleInfo } from '../../types/vehicle'

interface VehicleSearchByPlateProps {
    shopId: string
    onVehicleSelected?: (vehicle: CustomerVehicle) => void
    onVehicleCreated?: (vehicle: CustomerVehicle) => void
    className?: string
    disabled?: boolean
}

export const VehicleSearchByPlate: React.FC<VehicleSearchByPlateProps> = ({
    shopId,
    onVehicleSelected,
    onVehicleCreated,
    className = "",
    disabled = false
}) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newVehicleData, setNewVehicleData] = useState<WalkInVehicleInfo>({
        year: new Date().getFullYear(),
        make: '',
        model: '',
        license_plate: '',
        color: '',
        vin: '',
        mileage: undefined
    })

    // Search hook with debouncing
    const { data: searchResults, isLoading: isSearching, error: searchError } = useDebouncedVehicleSearch(searchQuery, shopId)
    
    // Create vehicle mutation
    const createVehicleMutation = useCreateWalkInVehicle()

    const handleSearchChange = (value: string) => {
        setSearchQuery(value.toUpperCase())
        setShowCreateForm(false) // Hide create form when searching
        
        // Pre-fill license plate in create form
        if (value.trim()) {
            setNewVehicleData(prev => ({
                ...prev,
                license_plate: value.toUpperCase().trim()
            }))
        }
    }

    const handleVehicleSelect = (vehicle: CustomerVehicle) => {
        onVehicleSelected?.(vehicle)
        toast.success('Vehicle selected', {
            description: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        })
    }

    const handleShowCreateForm = () => {
        if (!searchQuery.trim()) {
            toast.error('Enter a license plate first')
            return
        }
        setShowCreateForm(true)
    }

    const handleCreateVehicle = async () => {
        // Validate required fields
        if (!newVehicleData.year || !newVehicleData.make || !newVehicleData.model || !newVehicleData.license_plate) {
            toast.error('Please fill in all required fields (Year, Make, Model, License Plate)')
            return
        }

        try {
            const createdVehicle = await createVehicleMutation.mutateAsync(newVehicleData)
            onVehicleCreated?.(createdVehicle)
            
            // Reset form
            setShowCreateForm(false)
            setSearchQuery('')
            setNewVehicleData({
                year: new Date().getFullYear(),
                make: '',
                model: '',
                license_plate: '',
                color: '',
                vin: '',
                mileage: undefined
            })
        } catch (error) {
            // Error is already handled by the mutation hook
            console.error('Failed to create vehicle:', error)
        }
    }

    const handleNewVehicleFieldChange = (field: keyof WalkInVehicleInfo, value: string | number | undefined) => {
        setNewVehicleData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="space-y-1.5">
                <Label htmlFor="plate_search" className="text-muted-foreground">Search by License Plate</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            id="plate_search"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="ABC123"
                            disabled={disabled || createVehicleMutation.isPending}
                            className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600 pr-10"
                            maxLength={10}
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                    </div>
                    <Button
                        type="button"
                        onClick={handleShowCreateForm}
                        disabled={disabled || !searchQuery.trim() || createVehicleMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add New
                    </Button>
                </div>
                
                {searchError && (
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        Failed to search vehicles
                    </div>
                )}
            </div>

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
                <VehicleSearchResults
                    results={searchResults}
                    onVehicleSelect={handleVehicleSelect}
                    disabled={disabled || createVehicleMutation.isPending}
                />
            )}

            {/* No Results Message */}
            {searchQuery.trim() && !isSearching && searchResults && searchResults.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
                    <p className="text-sm text-foreground">No vehicles found with plate "{searchQuery}"</p>
                    <p className="text-xs mt-1 text-muted-foreground">Click "Add New" to create a vehicle with this plate</p>
                </div>
            )}

            {/* Create New Vehicle Form */}
            {showCreateForm && (
                <div className="bg-slate-50 dark:bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-foreground">Add New Vehicle</h4>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCreateForm(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="new_year" className="text-foreground">Year *</Label>
                            <Input
                                id="new_year"
                                type="number"
                                value={newVehicleData.year || ''}
                                onChange={(e) => handleNewVehicleFieldChange('year', parseInt(e.target.value) || undefined)}
                                placeholder="2020"
                                className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600"
                                min="1900"
                                max={new Date().getFullYear() + 1}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="new_make" className="text-foreground">Make *</Label>
                            <Input
                                id="new_make"
                                value={newVehicleData.make}
                                onChange={(e) => handleNewVehicleFieldChange('make', e.target.value)}
                                placeholder="Toyota"
                                className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="new_model" className="text-foreground">Model *</Label>
                            <Input
                                id="new_model"
                                value={newVehicleData.model}
                                onChange={(e) => handleNewVehicleFieldChange('model', e.target.value)}
                                placeholder="Camry"
                                className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="new_license_plate" className="text-foreground">License Plate *</Label>
                            <Input
                                id="new_license_plate"
                                value={newVehicleData.license_plate}
                                onChange={(e) => handleNewVehicleFieldChange('license_plate', e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600"
                                maxLength={10}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="new_color" className="text-foreground">Color</Label>
                            <Input
                                id="new_color"
                                value={newVehicleData.color || ''}
                                onChange={(e) => handleNewVehicleFieldChange('color', e.target.value)}
                                placeholder="Silver"
                                className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="new_vin" className="text-foreground">VIN</Label>
                            <Input
                                id="new_vin"
                                value={newVehicleData.vin || ''}
                                onChange={(e) => handleNewVehicleFieldChange('vin', e.target.value.toUpperCase())}
                                placeholder="1HGBH41JXMN109186"
                                className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600"
                                maxLength={17}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 mt-4">
                        <Label htmlFor="new_mileage" className="text-foreground">Mileage</Label>
                        <Input
                            id="new_mileage"
                            type="number"
                            value={newVehicleData.mileage || ''}
                            onChange={(e) => handleNewVehicleFieldChange('mileage', parseInt(e.target.value) || undefined)}
                            placeholder="45000"
                            className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600"
                            min="0"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCreateForm(false)}
                            disabled={createVehicleMutation.isPending}
                            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateVehicle}
                            disabled={createVehicleMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {createVehicleMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Vehicle'
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VehicleSearchByPlate
