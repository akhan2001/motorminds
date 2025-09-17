// React hook for managing vehicle form state
'use client'

import { useState, useCallback } from 'react'
import type { VehicleFormData, CustomerVehicle } from '../types/vehicle'

export interface VehicleFormState {
    formData: VehicleFormData
    isValid: boolean
    errors: Record<string, string>
    isDirty: boolean
}

interface UseVehicleFormOptions {
    initialData?: Partial<VehicleFormData>
    onSubmit?: (data: VehicleFormData) => void | Promise<void>
}

/**
 * Hook for managing vehicle form state and validation
 */
export function useVehicleForm(options: UseVehicleFormOptions = {}) {
    const { initialData = {}, onSubmit } = options

    const [formData, setFormData] = useState<VehicleFormData>({
        year: initialData.year || '',
        make: initialData.make || '',
        model: initialData.model || '',
        vin: initialData.vin || '',
        licensePlate: initialData.licensePlate || '',
        engineType: initialData.engineType || '',
        color: initialData.color || '',
        mileage: initialData.mileage || '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isDirty, setIsDirty] = useState(false)

    // Validation rules
    const validateField = useCallback((field: keyof VehicleFormData, value: string): string => {
        switch (field) {
            case 'year':
                if (!value.trim()) return 'Year is required'
                const year = parseInt(value)
                if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
                    return 'Enter a valid year'
                }
                return ''

            case 'make':
                if (!value.trim()) return 'Make is required'
                if (value.trim().length < 2) return 'Make must be at least 2 characters'
                return ''

            case 'model':
                if (!value.trim()) return 'Model is required'
                if (value.trim().length < 1) return 'Model must be at least 1 character'
                return ''

            case 'vin':
                if (value && value.length !== 17) return 'VIN must be 17 characters'
                return ''

            case 'mileage':
                if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
                    return 'Mileage must be a positive number'
                }
                return ''

            default:
                return ''
        }
    }, [])

    // Validate entire form
    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {}

        Object.keys(formData).forEach((key) => {
            const field = key as keyof VehicleFormData
            const error = validateField(field, formData[field] || '')
            if (error) {
                newErrors[field] = error
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData, validateField])

    // Update form field
    const updateField = useCallback((field: keyof VehicleFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setIsDirty(true)

        // Clear error for this field if it's now valid
        const error = validateField(field, value)
        setErrors(prev => ({
            ...prev,
            [field]: error
        }))
    }, [validateField])

    // Update multiple fields at once
    const updateFields = useCallback((updates: Partial<VehicleFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }))
        setIsDirty(true)

        // Validate updated fields
        const newErrors = { ...errors }
        Object.entries(updates).forEach(([key, value]) => {
            const field = key as keyof VehicleFormData
            const error = validateField(field, value || '')
            newErrors[field] = error
        })
        setErrors(newErrors)
    }, [errors, validateField])

    // Reset form to initial state
    const resetForm = useCallback(() => {
        setFormData({
            year: initialData.year || '',
            make: initialData.make || '',
            model: initialData.model || '',
            vin: initialData.vin || '',
            licensePlate: initialData.licensePlate || '',
            engineType: initialData.engineType || '',
            color: initialData.color || '',
            mileage: initialData.mileage || '',
        })
        setErrors({})
        setIsDirty(false)
    }, [initialData])

    // Populate form from vehicle data
    const populateFromVehicle = useCallback((vehicle: CustomerVehicle) => {
        setFormData({
            year: vehicle.year.toString(),
            make: vehicle.make,
            model: vehicle.model,
            vin: vehicle.vin || '',
            licensePlate: vehicle.license_plate || '',
            engineType: vehicle.engine_type || '',
            color: vehicle.color || '',
            mileage: vehicle.mileage?.toString() || '',
        })
        setErrors({})
        setIsDirty(false)
    }, [])

    // Clear form completely
    const clearForm = useCallback(() => {
        setFormData({
            year: '',
            make: '',
            model: '',
            vin: '',
            licensePlate: '',
            engineType: '',
            color: '',
            mileage: '',
        })
        setErrors({})
        setIsDirty(false)
    }, [])

    // Submit form
    const submitForm = useCallback(async () => {
        if (validateForm() && onSubmit) {
            try {
                await onSubmit(formData)
            } catch (error) {
                console.error('Form submission error:', error)
            }
        }
    }, [formData, validateForm, onSubmit])

    // Check if form is valid
    const isValid = Object.values(errors).every(error => error === '') && 
                   formData.year.trim() !== '' && 
                   formData.make.trim() !== '' && 
                   formData.model.trim() !== ''

    return {
        formData,
        errors,
        isValid,
        isDirty,
        updateField,
        updateFields,
        resetForm,
        populateFromVehicle,
        clearForm,
        validateForm,
        submitForm,
    }
}
