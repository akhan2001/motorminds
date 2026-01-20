'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'
import { Phone, Plus, User, Mail } from 'lucide-react'

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
                {label && <Label className="text-muted-foreground text-sm">{label}</Label>}
                <Select disabled>
                    <SelectTrigger className={`bg-white dark:bg-background border-border text-foreground ${className}`}>
                        <SelectValue placeholder="Loading suppliers..." />
                    </SelectTrigger>
                </Select>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-2">
                {label && <Label className="text-muted-foreground text-sm">{label}</Label>}
                <Select disabled>
                    <SelectTrigger className={`bg-white dark:bg-background border-border text-foreground ${className}`}>
                        <SelectValue placeholder="Error loading suppliers" />
                    </SelectTrigger>
                </Select>
                <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {label && (
                <Label className="text-foreground text-sm">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}
            <Select 
                value={value} 
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <SelectTrigger className={`bg-white dark:bg-background border-border text-foreground ${className}`}>
                    <SelectValue placeholder={placeholder}>
                        {value && value !== customOptionValue ? (
                            (() => {
                                const selectedSupplier = activeSuppliers.find(s => s.id === value)
                                return selectedSupplier ? (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium text-foreground">{selectedSupplier.name}</span>
                                            {selectedSupplier.contact_person && (
                                                <span className="text-xs text-muted-foreground">{selectedSupplier.contact_person}</span>
                                            )}
                                        </div>
                                        {selectedSupplier.phone_number && (
                                            <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400 ml-2 flex-shrink-0" />
                                        )}
                                    </div>
                                ) : null
                            })()
                        ) : value === customOptionValue ? (
                            <div className="flex items-center">
                                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                                <span className="text-foreground">{customOptionLabel}</span>
                            </div>
                        ) : null}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                    {activeSuppliers.length === 0 && !showCustomOption ? (
                        <div className="py-3 px-2 text-center text-sm text-muted-foreground">
                            No suppliers found
                        </div>
                    ) : (
                        <>
                            {activeSuppliers.map((supplier) => (
                                <SelectItem 
                                    key={supplier.id} 
                                    value={supplier.id}
                                    className="text-popover-foreground hover:bg-muted focus:bg-muted cursor-pointer"
                                >
                                    <div className="flex flex-col w-full py-1">
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-medium text-foreground">{supplier.name}</span>
                                            {supplier.phone_number && (
                                                <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400 ml-2 flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex flex-col mt-1 gap-0.5">
                                            {supplier.contact_person && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {supplier.contact_person}
                                                </span>
                                            )}
                                            {supplier.phone_number && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {supplier.phone_number}
                                                </span>
                                            )}
                                            {supplier.email && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {supplier.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                            {showCustomOption && (
                                <SelectItem 
                                    value={customOptionValue}
                                    className="text-popover-foreground hover:bg-muted focus:bg-muted cursor-pointer"
                                >
                                    <div className="flex items-center py-1">
                                        <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                                        <span className="text-foreground">{customOptionLabel}</span>
                                    </div>
                                </SelectItem>
                            )}
                        </>
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
