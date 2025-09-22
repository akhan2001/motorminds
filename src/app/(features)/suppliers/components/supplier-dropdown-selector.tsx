'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'

interface SupplierDropdownSelectorProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    label?: string
    showCustomOption?: boolean
    customOptionValue?: string
    customOptionLabel?: string
    className?: string
    disabled?: boolean
    required?: boolean
}

export default function SupplierDropdownSelector({
    value,
    onValueChange,
    placeholder = "Choose a supplier...",
    label,
    showCustomOption = true,
    customOptionValue = "custom",
    customOptionLabel = "Custom Supplier",
    className,
    disabled = false,
    required = false
}: SupplierDropdownSelectorProps) {
    const { suppliers, loading, error } = useSuppliers()

    // Filter only active suppliers
    const activeSuppliers = suppliers.filter(supplier => supplier.status === 'active')

    if (loading) {
        return (
            <div className="space-y-2">
                {label && <Label className="text-gray-300 text-sm">{label}</Label>}
                <Select disabled>
                    <SelectTrigger className={`bg-[#1a1a1a] border-[#2a2a2a] text-white ${className}`}>
                        <SelectValue placeholder="Loading suppliers..." />
                    </SelectTrigger>
                </Select>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-2">
                {label && <Label className="text-gray-300 text-sm">{label}</Label>}
                <Select disabled>
                    <SelectTrigger className={`bg-[#1a1a1a] border-[#2a2a2a] text-white ${className}`}>
                        <SelectValue placeholder="Error loading suppliers" />
                    </SelectTrigger>
                </Select>
                <p className="text-red-400 text-xs">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {label && (
                <Label className="text-gray-300 text-sm">
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </Label>
            )}
            <Select 
                value={value} 
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <SelectTrigger className={`bg-[#1a1a1a] border-[#2a2a2a] text-white ${className}`}>
                    <SelectValue placeholder={placeholder}>
                        {value && value !== customOptionValue ? (
                            (() => {
                                const selectedSupplier = activeSuppliers.find(s => s.id === value)
                                return selectedSupplier ? (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-white">{selectedSupplier.name}</span>
                                            {selectedSupplier.contact_person && (
                                                <span className="text-xs text-gray-400">{selectedSupplier.contact_person}</span>
                                            )}
                                        </div>
                                        {selectedSupplier.phone_number && (
                                            <span className="text-green-400 text-sm">📞</span>
                                        )}
                                    </div>
                                ) : null
                            })()
                        ) : value === customOptionValue ? (
                            <div className="flex items-center">
                                <span className="text-blue-400 mr-2">+</span>
                                <span className="text-white">{customOptionLabel}</span>
                            </div>
                        ) : null}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    {activeSuppliers.map((supplier) => (
                        <SelectItem 
                            key={supplier.id} 
                            value={supplier.id}
                            className="text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]"
                        >
                            <div className="flex flex-col w-full">
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-medium text-white">{supplier.name}</span>
                                    {supplier.phone_number && (
                                        <span className="text-xs text-green-400 ml-2">📞</span>
                                    )}
                                </div>
                                <div className="flex flex-col mt-1">
                                    {supplier.contact_person && (
                                        <span className="text-xs text-gray-400">Contact: {supplier.contact_person}</span>
                                    )}
                                    {supplier.phone_number && (
                                        <span className="text-xs text-gray-400">Phone: {supplier.phone_number}</span>
                                    )}
                                    {supplier.email && (
                                        <span className="text-xs text-gray-400">Email: {supplier.email}</span>
                                    )}
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                    {showCustomOption && (
                        <SelectItem 
                            value={customOptionValue}
                            className="text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]"
                        >
                            <div className="flex items-center">
                                <span className="text-blue-400 mr-2">+</span>
                                {customOptionLabel}
                            </div>
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    )
}

// Helper function to get supplier details by ID
export function getSupplierById(suppliers: Supplier[], supplierId: string): Supplier | undefined {
    return suppliers.find(supplier => supplier.id === supplierId)
}

// Helper function to get supplier phone number by ID
export function getSupplierPhoneNumber(suppliers: Supplier[], supplierId: string): string | undefined {
    const supplier = getSupplierById(suppliers, supplierId)
    return supplier?.phone_number
}

// Helper function to get supplier name by ID
export function getSupplierName(suppliers: Supplier[], supplierId: string): string | undefined {
    const supplier = getSupplierById(suppliers, supplierId)
    return supplier?.name
}
