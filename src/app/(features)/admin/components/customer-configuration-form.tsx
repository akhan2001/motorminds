"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database, ArrowLeft, ArrowRight, Users } from 'lucide-react'
import { CustomerMigrationFormSchema, CustomerMigrationFormData } from '../schemas/customer-migration'
import { CSVAnalysis } from '../types/migrations'

interface CustomerConfigurationFormComponentProps {
    csvAnalysis: CSVAnalysis
    shops: any[]
    loadingShops: boolean
    onSubmit: (data: CustomerMigrationFormData) => void
    onBack: () => void
}

export default function CustomerConfigurationFormComponent({
    csvAnalysis,
    shops,
    loadingShops,
    onSubmit,
    onBack
}: CustomerConfigurationFormComponentProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<CustomerMigrationFormData>({
        resolver: zodResolver(CustomerMigrationFormSchema),
        defaultValues: {
            concatName: false,
            concatAddress: false,
            concatPhone: false,
            validateEmails: true,
            validatePhones: true,
            duplicateHandling: 'skip'
        }
    })

    const watchConcatName = watch('concatName')
    const watchConcatAddress = watch('concatAddress')
    const watchConcatPhone = watch('concatPhone')

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Customer Migration Configuration
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

                    {/* Data Concatenation Options */}
                    <div className="space-y-4 pb-2">
                        <h3 className="text-white font-medium">Data Concatenation</h3>
                        
                        {/* Name Concatenation */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="concatName"
                                    {...register('concatName')}
                                    className="rounded border-gray-600"
                                />
                                <Label htmlFor="concatName" className="text-white">
                                    Concatenate first and last name
                                </Label>
                            </div>
                            
                            {watchConcatName && (
                                <div className="ml-6 p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg space-y-4">
                                    <div>
                                        <Label className="text-white text-sm">First Name Column *</Label>
                                        <Select onValueChange={(value) => setValue('firstNameColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select first name column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.firstNameColumn && (
                                            <p className="text-red-400 text-sm mt-1">{errors.firstNameColumn.message}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <Label className="text-white text-sm">Last Name Column *</Label>
                                        <Select onValueChange={(value) => setValue('lastNameColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select last name column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.lastNameColumn && (
                                            <p className="text-red-400 text-sm mt-1">{errors.lastNameColumn.message}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Address Concatenation */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="concatAddress"
                                    {...register('concatAddress')}
                                    className="rounded border-gray-600"
                                />
                                <Label htmlFor="concatAddress" className="text-white">
                                    Concatenate address fields
                                </Label>
                            </div>
                            
                            {watchConcatAddress && (
                                <div className="ml-6 p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg space-y-4">
                                    <div>
                                        <Label className="text-white text-sm">Street Column *</Label>
                                        <Select onValueChange={(value) => setValue('streetColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select street column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.streetColumn && (
                                            <p className="text-red-400 text-sm mt-1">{errors.streetColumn.message}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <Label className="text-white text-sm">City Column *</Label>
                                        <Select onValueChange={(value) => setValue('cityColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select city column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.cityColumn && (
                                            <p className="text-red-400 text-sm mt-1">{errors.cityColumn.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-white text-sm">Province Column (Optional)</Label>
                                        <Select onValueChange={(value) => setValue('provinceColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select province column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="_none_">No province column</SelectItem>
                                                {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label className="text-white text-sm">Postal Code Column (Optional)</Label>
                                        <Select onValueChange={(value) => setValue('postalCodeColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select postal code column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="_none_">No postal code column</SelectItem>
                                                {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Phone Concatenation */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="concatPhone"
                                    {...register('concatPhone')}
                                    className="rounded border-gray-600"
                                />
                                <Label htmlFor="concatPhone" className="text-white">
                                    Concatenate phone number fields
                                </Label>
                            </div>
                            
                            {watchConcatPhone && (
                                <div className="ml-6 p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg space-y-4">
                                    <div>
                                        <Label className="text-white text-sm">Area Code Column *</Label>
                                        <Select onValueChange={(value) => setValue('areaCodeColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select area code column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.areaCodeColumn && (
                                            <p className="text-red-400 text-sm mt-1">{errors.areaCodeColumn.message}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <Label className="text-white text-sm">Phone Number Column *</Label>
                                        <Select onValueChange={(value) => setValue('phoneNumberColumn', value)}>
                                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2">
                                                <SelectValue placeholder="Select phone number column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                    <SelectItem key={header} value={header}>
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.phoneNumberColumn && (
                                            <p className="text-red-400 text-sm mt-1">{errors.phoneNumberColumn.message}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Validation Options */}
                    <div className="space-y-4 pb-2">
                        <h3 className="text-white font-medium">Data Validation</h3>
                        
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="validateEmails"
                                    {...register('validateEmails')}
                                    className="rounded border-gray-600"
                                />
                                <Label htmlFor="validateEmails" className="text-white">
                                    Validate email addresses
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="validatePhones"
                                    {...register('validatePhones')}
                                    className="rounded border-gray-600"
                                />
                                <Label htmlFor="validatePhones" className="text-white">
                                    Validate phone numbers
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Additional Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 pb-4">
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
