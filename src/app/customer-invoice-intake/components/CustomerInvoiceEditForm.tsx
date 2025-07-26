'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

// Form validation schema
const editFormSchema = z.object({
    customer_notes: z.string()
        .min(10, { message: 'Service description must be at least 10 characters' })
        .max(500, { message: 'Service description is too long' }),
    
    estimated_amount: z.string()
        .optional()
        .default('0')
})

type EditFormValues = z.infer<typeof editFormSchema>

interface CustomerInvoiceEditFormProps {
    isOpen: boolean
    onClose: () => void
    shopId: string
    invoice: {
        invoice_number: string
        client_name: string
        client_email?: string
        client_phone?: string
        customer_notes?: string
        estimated_amount?: number
        vehicle_information?: {
            year: string
            make: string
            model: string
            license_plate: string
        }
    }
    onInvoiceUpdated: () => void
}

export default function CustomerInvoiceEditForm({
    isOpen,
    onClose,
    shopId,
    invoice,
    onInvoiceUpdated
}: CustomerInvoiceEditFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const form = useForm<EditFormValues>({
        resolver: zodResolver(editFormSchema),
        defaultValues: {
            customer_notes: invoice.customer_notes || '',
            estimated_amount: invoice.estimated_amount?.toString() || '0',
        },
        mode: 'onBlur',
    })

    // Update form when invoice prop changes
    useEffect(() => {
        if (invoice) {
            form.setValue('customer_notes', invoice.customer_notes || '')
            form.setValue('estimated_amount', invoice.estimated_amount?.toString() || '0')
        }
    }, [invoice, form])

    // Show form errors if any
    const errors = form.formState.errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0]
            if (firstError && firstError.message) {
                setFormError(firstError.message as string)
            }
        } else {
            setFormError(null)
        }
    }, [errors])

    async function onSubmit(data: EditFormValues) {
        setIsSubmitting(true)
        setFormError(null)
        
        try {
            const response = await fetch(`/api/customer-invoices/update/${invoice.invoice_number}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shopId,
                    customer_notes: data.customer_notes.trim(),
                    estimated_amount: parseFloat(data.estimated_amount) || 0
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update invoice')
            }

            toast.success('Invoice updated successfully!')
            onInvoiceUpdated()
            onClose()
            
        } catch (error: any) {
            setFormError(error.message || 'Failed to update invoice')
            toast.error(`Error: ${error.message || 'Failed to update invoice'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        form.reset()
        setFormError(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d0d0d] border-[#1f1f1f] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Edit Customer Invoice Request</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Update the customer's service request details and budget estimate.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-6">
                    {formError && (
                        <div className="mb-4 p-3 bg-[#3a0505] border border-[#b22222] rounded-md text-white">
                            <p className="text-sm">{formError}</p>
                        </div>
                    )}

                    {/* Read-only Customer Information */}
                    <div className="mb-6 p-4 bg-[#1A1A1A] rounded-md border border-[#333]">
                        <h3 className="text-lg font-medium text-gray-300 mb-3">Customer Information (Read-only)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Name:</span>
                                <span className="ml-2 text-white">{invoice.client_name}</span>
                            </div>
                            {invoice.client_email && (
                                <div>
                                    <span className="text-gray-400">Email:</span>
                                    <span className="ml-2 text-white">{invoice.client_email}</span>
                                </div>
                            )}
                            {invoice.client_phone && (
                                <div>
                                    <span className="text-gray-400">Phone:</span>
                                    <span className="ml-2 text-white">{invoice.client_phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Read-only Vehicle Information */}
                    {invoice.vehicle_information && (
                        <div className="mb-6 p-4 bg-[#1A1A1A] rounded-md border border-[#333]">
                            <h3 className="text-lg font-medium text-gray-300 mb-3">Vehicle Information (Read-only)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400">Vehicle:</span>
                                    <span className="ml-2 text-white">
                                        {invoice.vehicle_information.year} {invoice.vehicle_information.make} {invoice.vehicle_information.model}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">License Plate:</span>
                                    <span className="ml-2 text-white">{invoice.vehicle_information.license_plate}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Editable Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Service Description */}
                            <FormField
                                control={form.control}
                                name="customer_notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300">Service Description <span className="text-[#b22222]">*</span></FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Please describe the service you need in detail. Include any symptoms, issues, or specific work you'd like done..."
                                                rows={4}
                                                {...field} 
                                                className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222] resize-none"
                                                required
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[#b22222]" />
                                        <p className="text-xs text-gray-400 mt-1">
                                            {field.value.length}/500 characters
                                        </p>
                                    </FormItem>
                                )}
                            />

                            {/* Estimated Amount */}
                            <FormField
                                control={form.control}
                                name="estimated_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300">Budget Range <span className="text-gray-500 text-sm">(optional)</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="text-gray-300 text-md self-center absolute left-2 top-1/2 -translate-y-1/2">$</span>
                                                <Input 
                                                    type="number"
                                                    placeholder="0"
                                                    min="0"
                                                    step="0.01"
                                                    {...field} 
                                                    className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222] pl-6"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[#b22222]" />
                                        <p className="text-xs text-gray-400 mt-1">
                                            This helps us provide accurate estimates
                                        </p>
                                    </FormItem>
                                )}
                            />

                            <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-end">
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    onClick={handleClose}
                                    className="bg-transparent border-[#333] text-gray-300 hover:bg-[#1A1A1A] hover:text-white"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-[#b22222] hover:bg-[#8c1c1c] text-white border-none"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Invoice'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
} 