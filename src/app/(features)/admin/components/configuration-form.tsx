"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database, ArrowLeft, ArrowRight } from 'lucide-react'
import { InvoiceMigrationFormSchema, InvoiceMigrationFormData } from '../schemas/invoice-migration'
import { CSVAnalysis } from '../types/migrations'

interface ConfigurationFormComponentProps {
    csvAnalysis: CSVAnalysis
    shops: any[]
    loadingShops: boolean
    onSubmit: (data: InvoiceMigrationFormData) => void
    onBack: () => void
}

export default function ConfigurationFormComponent({
    csvAnalysis,
    shops,
    loadingShops,
    onSubmit,
    onBack
}: ConfigurationFormComponentProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<InvoiceMigrationFormData>({
        resolver: zodResolver(InvoiceMigrationFormSchema),
        defaultValues: {
            referenceCustomers: false,
            referenceVehicles: false,
            dateFormat: 'auto',
            currency: 'CAD',
            duplicateHandling: 'skip'
        }
    })

    const watchReferenceCustomers = watch('referenceCustomers')
    const watchReferenceVehicles = watch('referenceVehicles')

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Migration Configuration
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Shop Selection */}
                    <div>
                        <Label htmlFor="shopId" className="text-white">Target Shop *</Label>
                        <Select 
                            onValueChange={(value) => setValue('shopId', value)}
                            disabled={loadingShops}
                        >
                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                <SelectValue placeholder={loadingShops ? "Loading shops..." : "Select shop"} />
                            </SelectTrigger>
                            <SelectContent>
                                {shops.map((shop) => (
                                    <SelectItem key={shop.id} value={shop.id}>
                                        {shop.shop_name} - {shop.shop_city || 'Unknown City'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.shopId && (
                            <p className="text-red-400 text-sm mt-1">{errors.shopId.message}</p>
                        )}
                    </div>

                    {/* Data References */}
                    <div className="space-y-4 pb-2">
                        <h3 className="text-white font-medium">Data References</h3>
                        
                        {/* Customer Reference */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="referenceCustomers"
                                    {...register('referenceCustomers')}
                                    className="rounded border-gray-600"
                                />
                                <Label htmlFor="referenceCustomers" className="text-white">
                                    Link to existing customers
                                </Label>
                            </div>
                            
                            {watchReferenceCustomers && (
                                <div className="ml-6 p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg space-y-4">
                                    <div>
                                        <Label className="text-white text-sm">Which CSV column contains customer data? *</Label>
                                        <Select onValueChange={(value) => setValue('customerIdColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select CSV column (email, phone, name)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.customerIdColumn && (
                                            <p className="text-red-400 text-sm mt-1">{errors.customerIdColumn.message}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <Label className="text-white text-sm">Match against which staging_customers column? *</Label>
                                        <Select onValueChange={(value) => setValue('customerMatchColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select staging column to match" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="customer_email">Email</SelectItem>
                                                <SelectItem value="customer_phone">Phone</SelectItem>
                                                <SelectItem value="customer_name">Name</SelectItem>
                                                <SelectItem value="license_plate">License Plate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.customerMatchColumn && (
                                            <p className="text-red-400 text-sm mt-1">{errors.customerMatchColumn.message}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Vehicle Reference */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="referenceVehicles"
                                    {...register('referenceVehicles')}
                                    className="rounded border-gray-600"
                                />
                                <Label htmlFor="referenceVehicles" className="text-white">
                                    Link to existing vehicles
                                </Label>
                            </div>
                            
                            {watchReferenceVehicles && (
                                <div className="ml-6 p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg">
                                    <Label className="text-white text-sm">Which column identifies the vehicle?</Label>
                                    <Select onValueChange={(value) => setValue('vehicleIdColumn', value)}>
                                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                            <SelectValue placeholder="Select column (VIN, plate, etc.)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none_">No vehicle matching</SelectItem>
                                            {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                <SelectItem key={header} value={header}>
                                                    {header}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.vehicleIdColumn && (
                                        <p className="text-red-400 text-sm mt-1">{errors.vehicleIdColumn.message}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                        <div>
                            <Label htmlFor="dateFormat" className="text-white">Date Format</Label>
                            <Select 
                                defaultValue="auto"
                                onValueChange={(value: any) => setValue('dateFormat', value)}
                            >
                                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto-detect</SelectItem>
                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="currency" className="text-white">Currency</Label>
                            <Select 
                                defaultValue="CAD"
                                onValueChange={(value: any) => setValue('currency', value)}
                            >
                                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="duplicateHandling" className="text-white">Duplicate Handling</Label>
                            <Select 
                                defaultValue="skip"
                                onValueChange={(value: any) => setValue('duplicateHandling', value)}
                            >
                                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="skip">Skip duplicates</SelectItem>
                                    <SelectItem value="overwrite">Overwrite existing</SelectItem>
                                    <SelectItem value="create_new">Create new</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-between border-t border-[#2a2a2a] pt-4">
                        <Button
                            type="button"
                            onClick={onBack}
                            variant="outline"
                            className="border-gray-600 text-gray-300"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            Continue to Mapping
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
