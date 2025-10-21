'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Save, Plus, Trash2, User, Car, X, LayoutIcon } from 'lucide-react'
import { useAuth } from '../../../operations/hooks/use-auth'
import { useCreateInvoice } from '../../hooks/use-invoices'
import type { InvoiceFormData, InvoiceItem } from '../../types/invoice'
import { toast } from 'sonner'
import { CustomerInformation } from '../../../operations/components/work-orders/shared/customer-information'
import { VehicleInformation } from '../../../operations/components/work-orders/shared/vehicle-information'
import { InvoiceLaborItems } from './InvoiceLaborItems'
import { InvoicePartsItems } from './InvoicePartsItems'

interface NewInvoiceProps {
    isOpen: boolean
    onClose: () => void
    onInvoiceCreated?: () => void
}

const NewInvoice: React.FC<NewInvoiceProps> = ({ isOpen, onClose, onInvoiceCreated }) => {
    const { shopId } = useAuth()
    const createMutation = useCreateInvoice()

    const [formData, setFormData] = useState<InvoiceFormData>({
        customer_id: '',
        vehicle_id: null,
        work_order_id: null,
        title: '',
        description: null,
        status: 'draft',
        priority: 'medium',
        tax_rate: 0.13,
        discount_amount: 0,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: null,
        payment_method: null,
        payment_reference: null,
        notes: null,
        invoice_items: []
    })

    // Additional form state for customer and vehicle information
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        email: ''
    })

    const [vehicleInfo, setVehicleInfo] = useState({
        year: '',
        make: '',
        model: '',
        licensePlate: '',
        vin: ''
    })

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            resetFormValues()
        }
    }, [isOpen])

    const resetFormValues = () => {
        setFormData({
            customer_id: '',
            vehicle_id: null,
            work_order_id: null,
            title: '',
            description: null,
            status: 'draft',
            priority: 'medium',
            tax_rate: 0.13,
            discount_amount: 0,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: null,
            payment_method: null,
            payment_reference: null,
            notes: null,
            invoice_items: []
        })
        
        setCustomerInfo({
            name: '',
            phone: '',
            email: ''
        })
        
        setVehicleInfo({
            year: '',
            make: '',
            model: '',
            licensePlate: '',
            vin: ''
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!shopId) {
            toast.error('Shop ID not found')
            return
        }

        try {
            await createMutation.mutateAsync({
                ...formData,
                shop_id: shopId
            })
            toast.success('Invoice created successfully')
            if (onInvoiceCreated) {
                onInvoiceCreated()
            }
            onClose()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create invoice')
        }
    }

    const handleItemsChange = (items: InvoiceItem[]) => {
        setFormData(prev => ({
            ...prev,
            invoice_items: items
        }))
    }

    const calculateSubtotal = () => {
        return formData.invoice_items.reduce((sum, item) => sum + item.total_price, 0)
    }

    const calculateTax = () => {
        return calculateSubtotal() * formData.tax_rate
    }

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax() - formData.discount_amount
    }


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] bg-[#0d0d0d] border-[#2a2a2a] p-0 flex flex-col">
                {/* Fixed Header */}
                <DialogHeader className="bg-[#131313] p-4 border-b border-[#333333] flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-xl font-semibold text-white">
                                Create Invoice
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 text-xs sm:text-sm">
                                Fill in the details below to create a new invoice
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white hover:bg-transparent"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-[#1A1A1A] p-4">
                    <form id="invoice-form" onSubmit={handleSubmit} className="space-y-4">                     
                        {/* Customer Information Card */}
                        <div className="bg-[#131313] border border-[#333333] rounded-lg">
                            <div className="p-4">
                                <CustomerInformation
                                    customerId={formData.customer_id}
                                    customerName={customerInfo.name}
                                    customerEmail={customerInfo.email}
                                    customerPhone={customerInfo.phone}
                                    customerAddress=""
                                    isEditing={true}
                                    isCreating={true}
                                    onFieldChange={(field, value) => {
                                        if (field === 'customer') setCustomerInfo(prev => ({ ...prev, name: value }))
                                        if (field === 'customerEmail') setCustomerInfo(prev => ({ ...prev, email: value }))
                                        if (field === 'customerPhone') setCustomerInfo(prev => ({ ...prev, phone: value }))
                                    }}
                                    onCustomerChange={(customerId) => setFormData(prev => ({ ...prev, customer_id: customerId }))}
                                />
                            </div>
                        </div>

                        {/* Vehicle Information Card */}
                        <div className="bg-[#131313] border border-[#333333] rounded-lg">
                            <div className="p-4">
                                <VehicleInformation
                                    customerId={formData.customer_id}
                                    selectedVehicleId={formData.vehicle_id || ""}
                                    vehicleId={formData.vehicle_id || ""}
                                    vehicleYear={vehicleInfo.year}
                                    vehicleMake={vehicleInfo.make}
                                    vehicleModel={vehicleInfo.model}
                                    vehicleColor=""
                                    vehicleVin={vehicleInfo.vin}
                                    vehicleLicensePlate={vehicleInfo.licensePlate}
                                    vehicleMileage=""
                                    isEditing={true}
                                    isCreating={true}
                                    onFieldChange={(field, value) => {
                                        if (field === 'vehicleYear') setVehicleInfo(prev => ({ ...prev, year: value }))
                                        if (field === 'vehicleMake') setVehicleInfo(prev => ({ ...prev, make: value }))
                                        if (field === 'vehicleModel') setVehicleInfo(prev => ({ ...prev, model: value }))
                                        if (field === 'vehicleVin') setVehicleInfo(prev => ({ ...prev, vin: value }))
                                        if (field === 'vehicleLicensePlate') setVehicleInfo(prev => ({ ...prev, licensePlate: value }))
                                    }}
                                    onVehicleSelect={(vehicleId) => setFormData(prev => ({ ...prev, vehicle_id: vehicleId }))}
                                />
                            </div>
                        </div>
                        
                        {/* Basic Information Card */}
                        <div className="bg-[#131313] border border-[#333333] rounded-lg">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <LayoutIcon className="h-4 w-4 text-purple-400" />
                                    <h3 className="text-lg font-semibold text-white">Invoice Information</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="title" className="text-gray-400 text-xs">Title</Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                            placeholder="Invoice title"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-gray-400 text-xs">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                            placeholder="Invoice description"
                                            rows={3}
                                            maxLength={500}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="status" className="text-gray-400 text-xs">Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                                            >
                                                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="sent">Sent</SelectItem>
                                                    <SelectItem value="viewed">Viewed</SelectItem>
                                                    <SelectItem value="paid">Paid</SelectItem>
                                                    <SelectItem value="overdue">Overdue</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="priority" className="text-gray-400 text-xs">Priority</Label>
                                            <Select
                                                value={formData.priority}
                                                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                                            >
                                                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="urgent">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Items Card */}
                        <div className="bg-[#131313] border border-[#333333] rounded-lg">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-lg font-semibold text-white">Invoice Items</h3>
                                </div>

                                {/* Labor Items */}
                                <div className="mb-6">
                                    <InvoiceLaborItems
                                        items={formData.invoice_items}
                                        onItemsChange={handleItemsChange}
                                    />
                                </div>

                                {/* Parts Items */}
                                <div>
                                    <InvoicePartsItems
                                        items={formData.invoice_items}
                                        onItemsChange={handleItemsChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Invoice Summary Card */}
                        <div className="bg-[#131313] border border-[#333333] rounded-lg">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-lg font-semibold text-white">Invoice Summary</h3>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Subtotal:</span>
                                        <span>${calculateSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Tax ({(formData.tax_rate * 100).toFixed(0)}%):</span>
                                        <span>${calculateTax().toFixed(2)}</span>
                                    </div>
                                    <Separator className="bg-gray-700" />
                                    <div className="flex justify-between text-white font-bold text-lg pt-2">
                                        <span>Total:</span>
                                        <span>${calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Fixed Footer with Actions */}
                <div className="bg-[#131313] border-t border-[#333333] p-4 flex flex-wrap gap-2 flex-shrink-0">
                    <Button
                        type="submit"
                        form="invoice-form"
                        className="bg-green-600 text-white hover:bg-green-700" 
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Create Invoice
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default NewInvoice
