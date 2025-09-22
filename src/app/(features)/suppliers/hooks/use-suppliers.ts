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

    const handleCallSupplier = (supplier: Supplier) => {
        if (!supplier.phone_number) {
            toast.error('No phone number available for this supplier')
            return
        }

        // Navigate to voice ordering with pre-filled phone number
        const encodedPhone = encodeURIComponent(supplier.phone_number)
        const encodedName = encodeURIComponent(supplier.name)
        window.location.href = `/voice-calling/ordering?phone=${encodedPhone}&supplier=${encodedName}`
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
        handleCallSupplier
    }
}
