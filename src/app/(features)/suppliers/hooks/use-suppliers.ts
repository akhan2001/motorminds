'use client'

import { useState, useEffect } from 'react'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'
import { toast } from 'sonner'

interface UseSuppliersReturn {
    suppliers: Supplier[]
    loading: boolean
    error: string | null
    fetchSuppliers: () => Promise<void>
    addSupplier: (supplier: Supplier) => void
    updateSupplier: (id: string, supplier: Supplier) => Promise<void>
    deleteSupplier: (id: string) => Promise<void>
    handleCallSupplier: (supplier: Supplier) => void
}

export function useSuppliers(): UseSuppliersReturn {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSuppliers = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/suppliers')
            const data = await response.json()
            
            if (response.ok) {
                setSuppliers(data.suppliers || [])
            } else {
                const errorMessage = data.error || 'Failed to fetch suppliers'
                setError(errorMessage)
                toast.error(errorMessage)
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error)
            const errorMessage = 'Failed to fetch suppliers'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const addSupplier = (newSupplier: Supplier) => {
        setSuppliers(prev => [newSupplier, ...prev])
    }

    const updateSupplier = async (id: string, updatedSupplier: Supplier) => {
        try {
            const response = await fetch(`/api/suppliers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: updatedSupplier.name,
                    contact_person: updatedSupplier.contact_person,
                    phone_number: updatedSupplier.phone_number,
                    email: updatedSupplier.email,
                    address: updatedSupplier.address,
                    account_number: updatedSupplier.account_number,
                    notes: updatedSupplier.notes,
                    status: updatedSupplier.status
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update supplier')
            }

            const data = await response.json()
            setSuppliers(prev => 
                prev.map(supplier => 
                    supplier.id === id ? data.supplier : supplier
                )
            )
            toast.success('Supplier updated successfully')
        } catch (error) {
            console.error('Error updating supplier:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update supplier')
            throw error
        }
    }

    const deleteSupplier = async (id: string) => {
        try {
            const response = await fetch(`/api/suppliers/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete supplier')
            }

            setSuppliers(prev => prev.filter(supplier => supplier.id !== id))
            toast.success('Supplier deleted successfully')
        } catch (error) {
            console.error('Error deleting supplier:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete supplier')
            throw error
        }
    }

    const handleCallSupplier = (supplier: Supplier) => {
        if (!supplier.phone_number) {
            toast.error('No phone number available for this supplier')
            return
        }

        // Navigate to voice calling with pre-filled supplier
        window.location.href = `/voice-calling`
    }

    useEffect(() => {
        fetchSuppliers()
    }, [])

    return {
        suppliers,
        loading,
        error,
        fetchSuppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        handleCallSupplier
    }
}
