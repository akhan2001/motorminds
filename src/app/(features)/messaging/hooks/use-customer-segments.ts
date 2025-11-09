import { useState } from 'react'
import { toast } from 'sonner'
import type { CustomerSegment, SegmentPreview } from '../types/mass-campaign'

interface Customer {
    id: string
    customer_name: string
    customer_phone: string
    customer_email?: string
    last_service_date?: string
}

export function useCustomerSegments() {
    const [isLoading, setIsLoading] = useState(false)
    const [preview, setPreview] = useState<SegmentPreview | null>(null)

    // Preview customer segment
    const previewSegment = async (segment: CustomerSegment): Promise<SegmentPreview> => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/messaging/segments/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(segment)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to preview segment')
            }

            const data = await response.json()
            setPreview(data)
            
            return data
        } catch (error: any) {
            console.error('Error previewing segment:', error)
            toast.error(error.message || 'Failed to preview segment')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Get all customers matching segment
    const getSegmentCustomers = async (segment: CustomerSegment): Promise<Customer[]> => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/messaging/segments/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(segment)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to fetch customers')
            }

            const data = await response.json()
            return data.customers || []
        } catch (error: any) {
            console.error('Error fetching segment customers:', error)
            toast.error(error.message || 'Failed to fetch customers')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Validate segment (check if it returns any customers)
    const validateSegment = async (segment: CustomerSegment): Promise<boolean> => {
        try {
            const result = await previewSegment(segment)
            return result.count > 0
        } catch (error) {
            return false
        }
    }

    // Get segment statistics
    const getSegmentStats = async (segment: CustomerSegment) => {
        const preview = await previewSegment(segment)
        
        return {
            totalCustomers: preview.count,
            hasPhoneNumbers: preview.sample_customers.filter(c => c.customer_phone).length,
            avgCustomersPerDay: preview.count / 30, // Rough estimate
            estimatedCost: preview.count * 0.02, // Rough SMS cost estimate
        }
    }

    // Clear preview
    const clearPreview = () => {
        setPreview(null)
    }

    return {
        preview,
        isLoading,
        previewSegment,
        getSegmentCustomers,
        validateSegment,
        getSegmentStats,
        clearPreview
    }
}

