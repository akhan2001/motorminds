'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from 'lucide-react'
import SupplierCard from './supplier-card'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'

interface SuppliersListProps {
    suppliers: Supplier[]
    loading: boolean
    onAddSupplier: () => void
    onCallSupplier: (supplier: Supplier) => void
}

export default function SuppliersList({ 
    suppliers, 
    loading, 
    onAddSupplier, 
    onCallSupplier 
}: SuppliersListProps) {
    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-400">Loading suppliers...</div>
            </div>
        )
    }

    if (suppliers.length === 0) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No suppliers yet</h3>
                    <p className="text-gray-400 mb-4">
                        Add your first automotive parts supplier to get started
                    </p>
                    <Button
                        onClick={onAddSupplier}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Supplier
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
                <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    onCallSupplier={onCallSupplier}
                />
            ))}
        </div>
    )
}
