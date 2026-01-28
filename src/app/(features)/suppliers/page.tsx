'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { SecondaryPageHeader } from '@/components/common/feedback/SecondaryPageHeader'
import { ScaffoldContainer } from '@/components/layout'
import SupplierModal from './components/supplier-modal'
import SuppliersList from './components/suppliers-list'
import { useSuppliers } from './hooks/use-suppliers'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'

export default function SuppliersPage() {   
    const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier, handleCallSupplier } = useSuppliers()
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

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
        <div className="h-full flex flex-col bg-background">
            <SecondaryPageHeader
                title="Suppliers Management"
                description="Manage your automotive parts suppliers and contact information"
                backHref="/operations/work-orders"
                actions={
                    <SupplierModal
                        open={showAddForm}
                        onOpenChange={(open) => {
                            setShowAddForm(open)
                            if (!open) setEditingSupplier(null)
                        }}
                        onSuccess={editingSupplier ? handleSupplierUpdated : handleSupplierAdded}
                        supplier={editingSupplier}
                    />
                }
            />
            <div className="flex-1 overflow-auto">
                <ScaffoldContainer size="large" className="py-6">
                    <SuppliersList
                        suppliers={suppliers}
                        loading={loading}
                        onAddSupplier={handleOpenAddForm}
                        onCallSupplier={handleCallSupplier}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </ScaffoldContainer>
            </div>
        </div>
    )
}
