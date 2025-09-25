'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2 } from 'lucide-react'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'
import { SupplierInfo } from '@/app/(features)/parts/types/parts'

interface SupplierSelectProps {
    suppliers: Supplier[]
    selectedSupplier: SupplierInfo
    onSupplierChange: (supplier: SupplierInfo) => void
    loading?: boolean
    disabled?: boolean
    className?: string
}

export default function SupplierSelect({ 
    suppliers, 
    selectedSupplier, 
    onSupplierChange, 
    loading = false, 
    disabled = false,
    className = "" 
}: SupplierSelectProps) {
    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find(s => s.id === supplierId)
        if (supplier) {
            onSupplierChange({
                supplier_id: supplier.id,
                supplier_name: supplier.name,
                contact_person: supplier.contact_person || '',
                phone_number: supplier.phone_number || '',
                account_number: supplier.account_number || ''
            })
        }
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <Label htmlFor="supplier" className="text-gray-300">
                Supplier *
            </Label>
            <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select
                    value={selectedSupplier.supplier_id}
                    onValueChange={handleSupplierChange}
                    disabled={disabled || loading}
                >
                    <SelectTrigger className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white">
                        <SelectValue placeholder={loading ? "Loading suppliers..." : "Select a supplier"} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id} className="text-white">
                                {supplier.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
