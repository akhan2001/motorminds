'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building } from 'lucide-react'
import SupplierMultiSelect from '@/app/(features)/suppliers/components/supplier-multi-select'
import { SelectedSupplier } from '@/app/(features)/voice-calling/types'

interface SupplierCallFormProps {
    selectedSuppliers: SelectedSupplier[]
    onSuppliersChange: (suppliers: SelectedSupplier[]) => void
}

export default function SupplierCallForm({ 
    selectedSuppliers, 
    onSuppliersChange 
}: SupplierCallFormProps) {
    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-400" />
                    Supplier Selection
                </CardTitle>
            </CardHeader>
            <CardContent>
                <SupplierMultiSelect
                    selectedSuppliers={selectedSuppliers}
                    onSuppliersChange={onSuppliersChange}
                    label="Select Suppliers"
                    placeholder="Choose suppliers to request quotes from..."
                />
            </CardContent>
        </Card>
    )
}
