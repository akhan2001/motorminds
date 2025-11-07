'use client'

import React, { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { CustomerService } from '../../lib/customer-service'

interface CustomerFormProps {
    showNewCustomerForm: boolean
    setShowNewCustomerForm: (show: boolean) => void
    shopId: string
    onCustomerCreated?: (customer: any) => void
}

interface NewCustomerData {
    name: string
    email: string
    phone: string
    address: string
}

export function CustomerForm({
    showNewCustomerForm,
    setShowNewCustomerForm,
    shopId,
    onCustomerCreated
}: CustomerFormProps) {
    const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
        name: '',
        email: '',
        phone: '',
        address: ''
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const formatPhoneNumber = (value: string) => {
        // Remove all non-digits
        const digitsOnly = value.replace(/\D/g, '')
        
        // Apply formatting based on length
        if (digitsOnly.length <= 3) {
            return digitsOnly
        } else if (digitsOnly.length <= 6) {
            return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`
        } else {
            return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`
        }
    }

    const handleNewCustomerChange = (field: keyof NewCustomerData, value: string) => {
        let processedValue = value
        
        // Format phone number
        if (field === 'phone') {
            processedValue = formatPhoneNumber(value)
        }
        
        setNewCustomerData(prev => ({
            ...prev,
            [field]: processedValue
        }))
        
        // Clear error when user starts typing
        if (errors[`newCustomer.${field}`]) {
            setErrors(prev => ({
                ...prev,
                [`newCustomer.${field}`]: ''
            }))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!newCustomerData.name.trim()) {
            newErrors['newCustomer.name'] = 'Name is required'
        }

        const phoneDigits = newCustomerData.phone.replace(/\D/g, '')
        if (!phoneDigits) {
            newErrors['newCustomer.phone'] = 'Phone is required'
        } else if (phoneDigits.length !== 10) {
            newErrors['newCustomer.phone'] = 'Phone number must be 10 digits'
        }

        if (newCustomerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerData.email)) {
            newErrors['newCustomer.email'] = 'Please enter a valid email address'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSaveNewCustomer = async () => {
        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            // Extract digits only for database storage and checking
            const phoneDigits = newCustomerData.phone.replace(/\D/g, '')
            
            // Check if customer already exists
            const existingCustomer = await CustomerService.getCustomerByPhone(shopId, phoneDigits)
            if (existingCustomer) {
                toast.error('Customer with this phone number already exists')
                return
            }

            // Create new customer using CustomerService
            const customerData = {
                name: newCustomerData.name,
                email: newCustomerData.email || undefined,
                phone: phoneDigits, // Store only digits
                address: newCustomerData.address || undefined,
                source: 'manual'
            }

            const newCustomer = await CustomerService.createCustomer(shopId, customerData)
            
            if (newCustomer) {
                toast.success('Customer created successfully')
                
                // Reset form
                setNewCustomerData({
                    name: '',
                    email: '',
                    phone: '',
                    address: ''
                })
                setErrors({})
                
                // Close form
                setShowNewCustomerForm(false)
                
                // Notify parent component
                if (onCustomerCreated) {
                    onCustomerCreated(newCustomer)
                }
            } else {
                toast.error('Failed to create customer')
            }
        } catch (error: any) {
            console.error('Error creating customer:', error)
            toast.error(error.message || 'Failed to create customer')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!showNewCustomerForm) return null

    return (
        <Card className="bg-slate-50 dark:bg-card border-border p-4 mt-4">
            <CardTitle className="text-md font-medium text-foreground mb-3 flex items-center justify-between">
                New Customer Details
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowNewCustomerForm(false)} 
                    className="text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardTitle>
            
            <div className="space-y-3">
                <div>
                    <Label className="text-muted-foreground text-xs">Name *</Label>
                    <Input
                        value={newCustomerData.name}
                        onChange={(e) => handleNewCustomerChange('name', e.target.value)}
                        placeholder="John Doe"
                        className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                    />
                    {errors['newCustomer.name'] && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors['newCustomer.name']}</p>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-muted-foreground text-xs">Email</Label>
                        <Input
                            type="email"
                            value={newCustomerData.email}
                            onChange={(e) => handleNewCustomerChange('email', e.target.value)}
                            placeholder="john@example.com"
                            className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                        />
                        {errors['newCustomer.email'] && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors['newCustomer.email']}</p>
                        )}
                    </div>
                    <div>
                        <Label className="text-muted-foreground text-xs">Phone *</Label>
                        <Input
                            type="tel"
                            value={newCustomerData.phone}
                            onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
                            placeholder="555-123-4567"
                            className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                        />
                        {errors['newCustomer.phone'] && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors['newCustomer.phone']}</p>
                        )}
                    </div>
                </div>
                
                <div>
                    <Label className="text-muted-foreground text-xs">Address</Label>
                    <Input
                        value={newCustomerData.address}
                        onChange={(e) => handleNewCustomerChange('address', e.target.value)}
                        placeholder="123 Main St"
                        className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewCustomerForm(false)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    size="sm"
                    onClick={handleSaveNewCustomer}
                    disabled={!newCustomerData.name || !newCustomerData.phone || isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {isSubmitting ? 'Saving...' : 'Save Customer'}
                </Button>
            </div>
        </Card>
    )
}