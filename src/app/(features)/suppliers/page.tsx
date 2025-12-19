'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
//import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SupplierModal from './components/supplier-modal'
import SuppliersList from './components/suppliers-list'
import SupplierDropdownSelector from './components/supplier-dropdown-selector'
import { useSuppliers } from './hooks/use-suppliers'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'

export default function SuppliersPage() {   
    const router = useRouter()
    const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier, handleCallSupplier } = useSuppliers()
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [selectedSupplierDemo, setSelectedSupplierDemo] = useState('')

    const handleSupplierAdded = (newSupplier: Supplier) => {
        addSupplier(newSupplier)
    }

    const handleSupplierUpdated = async (updatedSupplier: Supplier) => {
        if (editingSupplier) {
            try {
                await updateSupplier(editingSupplier.id, updatedSupplier)
                setEditingSupplier(null)
            } catch (error) {
                // Error already handled in hook
            }
        }
    }

    const handleOpenAddForm = () => {
        setEditingSupplier(null)
        setShowAddForm(true)
    }

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        setShowAddForm(true)
    }

    const handleDelete = async (supplier: Supplier) => {
        try {
            await deleteSupplier(supplier.id)
        } catch (error) {
            // Error already handled in hook
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* <Nav /> */}
            <div className="flex-1 flex flex-col">
                <div className="p-6 max-w-6xl mx-auto w-full">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Button variant="ghost" size="icon" onClick={() => router.push('/operations/work-orders')} className="-ml-2">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <h1 className="text-3xl font-bold text-foreground dark:text-white">
                                        Suppliers Management
                                    </h1>
                                </div>
                                <p className="text-muted-foreground dark:text-gray-400 ml-11">
                                    Manage your automotive parts suppliers and contact information
                                </p>
                            </div>
                            <SupplierModal
                                open={showAddForm}
                                onOpenChange={(open) => {
                                    setShowAddForm(open)
                                    if (!open) setEditingSupplier(null)
                                }}
                                onSuccess={editingSupplier ? handleSupplierUpdated : handleSupplierAdded}
                                supplier={editingSupplier}
                            />
                        </div>
                    </div>

                    {/* Suppliers List */}
                    <SuppliersList
                        suppliers={suppliers}
                        loading={loading}
                        onAddSupplier={handleOpenAddForm}
                        onCallSupplier={handleCallSupplier}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            </div>
        </div>
    )
}
