'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SupplierModal from './components/supplier-modal'
import SuppliersList from './components/suppliers-list'
import SupplierDropdownSelector from './components/supplier-dropdown-selector'
import { useSuppliers } from './hooks/use-suppliers'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'

export default function SuppliersPage() {   
    const { suppliers, loading, addSupplier, handleCallSupplier } = useSuppliers()
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedSupplierDemo, setSelectedSupplierDemo] = useState('')

    const handleSupplierAdded = (newSupplier: Supplier) => {
        addSupplier(newSupplier)
    }

    const handleOpenAddForm = () => {
        setShowAddForm(true)
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col">
                <div className="p-6 max-w-6xl mx-auto w-full">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Suppliers Management
                            </h1>
                            <p className="text-gray-400">
                                Manage your automotive parts suppliers and contact information
                            </p>
                        </div>
                        <SupplierModal
                            open={showAddForm}
                            onOpenChange={setShowAddForm}
                            onSuccess={handleSupplierAdded}
                        />
                    </div>

                    {/* Suppliers List */}
                    <SuppliersList
                        suppliers={suppliers}
                        loading={loading}
                        onAddSupplier={handleOpenAddForm}
                        onCallSupplier={handleCallSupplier}
                    />
                </div>
            </div>
        </div>
    )
}
