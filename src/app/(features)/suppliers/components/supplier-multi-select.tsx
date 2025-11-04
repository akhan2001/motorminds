'use client'

import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Plus, Check } from 'lucide-react'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'
import SupplierIntakeForm from './supplier-intake-form'

interface SelectedSupplier {
    id: string
    name: string
    phone_number?: string
    contact_person?: string
    isCustom?: boolean
}

interface SupplierMultiSelectProps {
    selectedSuppliers: SelectedSupplier[]
    onSuppliersChange: (suppliers: SelectedSupplier[]) => void
    placeholder?: string
    label?: string
    className?: string
    disabled?: boolean
    required?: boolean
}

export default function SupplierMultiSelect({
    selectedSuppliers,
    onSuppliersChange,
    placeholder = "Choose suppliers...",
    label,
    className,
    disabled = false,
    required = false
}: SupplierMultiSelectProps) {
    const { suppliers, loading, error } = useSuppliers()
    const [showDropdown, setShowDropdown] = useState(false)
    const [showCustomForm, setShowCustomForm] = useState(false)

    // Filter only active suppliers
    const activeSuppliers = suppliers.filter(supplier => supplier.status === 'active')

    const handleSupplierToggle = (supplier: Supplier) => {
        const isSelected = selectedSuppliers.some(s => s.id === supplier.id)
        
        if (isSelected) {
            // Remove supplier
            onSuppliersChange(selectedSuppliers.filter(s => s.id !== supplier.id))
        } else {
            // Add supplier
            const newSupplier: SelectedSupplier = {
                id: supplier.id,
                name: supplier.name,
                phone_number: supplier.phone_number,
                contact_person: supplier.contact_person,
                isCustom: false
            }
            onSuppliersChange([...selectedSuppliers, newSupplier])
        }
    }

    const handleCustomSupplierSuccess = (newSupplier: any) => {
        const customSupplier: SelectedSupplier = {
            id: newSupplier.id,
            name: newSupplier.name,
            phone_number: newSupplier.phone_number,
            contact_person: newSupplier.contact_person,
            isCustom: false // This is now a real supplier in the database
        }

        onSuppliersChange([...selectedSuppliers, customSupplier])
        setShowCustomForm(false)
    }

    const removeSupplier = (supplierId: string) => {
        onSuppliersChange(selectedSuppliers.filter(s => s.id !== supplierId))
    }

    if (loading) {
        return (
            <div className="space-y-2">
                {label && <Label className="text-foreground dark:text-gray-300 text-sm">{label}</Label>}
                <div className="bg-card dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-md p-3">
                    <p className="text-muted-foreground dark:text-gray-400 text-sm">Loading suppliers...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-2">
                {label && <Label className="text-foreground dark:text-gray-300 text-sm">{label}</Label>}
                <div className="bg-card dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-md p-3">
                    <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {label && (
                <Label className="text-foreground dark:text-gray-300 text-sm">
                    {label}
                    {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                </Label>
            )}

            {/* Selected Suppliers Display */}
            {selectedSuppliers.length > 0 && (
                <div className="space-y-2">
                    {selectedSuppliers.map((supplier) => (
                        <div key={supplier.id} className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground dark:text-white">{supplier.name}</span>
                                    {supplier.isCustom && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-500/20 px-2 py-1 rounded">Custom</span>
                                    )}
                                    {supplier.phone_number && (
                                        <span className="text-green-600 dark:text-green-400 text-sm">📞</span>
                                    )}
                                </div>
                                <div className="space-y-1 mt-1">
                                    {supplier.contact_person && (
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">Contact: {supplier.contact_person}</p>
                                    )}
                                    {supplier.phone_number && (
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">Phone: {supplier.phone_number}</p>
                                    )}
                                </div>
                            </div>
                            <Button
                                onClick={() => removeSupplier(supplier.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10"
                                disabled={disabled}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Suppliers Section */}
            {!disabled && (
                <div className="space-y-2">
                    <Button
                        onClick={() => setShowDropdown(!showDropdown)}
                        variant="outline"
                        className="w-full justify-start border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-400 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Supplier
                    </Button>

                    {/* Supplier Selection Dropdown */}
                    {showDropdown && (
                        <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                            <CardContent className="p-3 space-y-2">
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                    {activeSuppliers.map((supplier) => {
                                        const isSelected = selectedSuppliers.some(s => s.id === supplier.id)
                                        return (
                                            <div
                                                key={supplier.id}
                                                onClick={() => handleSupplierToggle(supplier)}
                                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                                    isSelected 
                                                        ? 'bg-blue-500/20 border border-blue-500/30' 
                                                        : 'hover:bg-accent dark:hover:bg-[#2a2a2a]'
                                                }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-foreground dark:text-white text-sm">{supplier.name}</span>
                                                        {supplier.phone_number && (
                                                            <span className="text-green-600 dark:text-green-400 text-xs">📞</span>
                                                        )}
                                                    </div>
                                                    {supplier.contact_person && (
                                                        <p className="text-xs text-muted-foreground dark:text-gray-400">{supplier.contact_person}</p>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <Check className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                
                                <div className="border-t border-border dark:border-[#2a2a2a] pt-2">
                                    <Button
                                        onClick={() => setShowCustomForm(!showCustomForm)}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-500/10"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Custom Supplier
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Custom Supplier Dialog */}
                    <Dialog open={showCustomForm} onOpenChange={setShowCustomForm} >
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a]">
                            <DialogHeader>
                                <DialogTitle className="text-foreground dark:text-white">Add New Supplier</DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto">
                                <SupplierIntakeForm
                                    onSuccess={handleCustomSupplierSuccess}
                                    onCancel={() => setShowCustomForm(false)}
                                    isModal={true}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    )
}

// Helper function to get supplier details by ID
export function getSelectedSupplierById(selectedSuppliers: SelectedSupplier[], supplierId: string): SelectedSupplier | undefined {
    return selectedSuppliers.find(supplier => supplier.id === supplierId)
}
