'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Send, Download, Plus, Trash2, User, Car, Phone } from 'lucide-react'
import { useAuth } from '../../../operations/hooks/use-auth'
import { useInvoice, useCreateInvoice, useUpdateInvoice } from '../../hooks/use-invoices'
import type { InvoiceFormData, InvoiceItem } from '../../types/invoice'
import { toast } from 'sonner'

interface InvoiceFormProps {
    invoiceId: string | null
    onClose: () => void
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoiceId, onClose }) => {
    const { shopId } = useAuth()
    const { data: invoice, isLoading } = useInvoice(invoiceId || '')
    const createMutation = useCreateInvoice()
    const updateMutation = useUpdateInvoice()

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

    useEffect(() => {
        if (invoice) {
            setFormData({
                customer_id: invoice.customer_id,
                vehicle_id: invoice.vehicle_id,
                work_order_id: invoice.work_order_id,
                title: invoice.title || '',
                description: invoice.description,
                status: invoice.status,
                priority: invoice.priority,
                tax_rate: Number(invoice.tax_rate),
                discount_amount: Number(invoice.discount_amount),
                issue_date: invoice.issue_date.split('T')[0],
                due_date: invoice.due_date ? invoice.due_date.split('T')[0] : null,
                payment_method: invoice.payment_method,
                payment_reference: invoice.payment_reference,
                notes: invoice.notes,
                invoice_items: invoice.invoice_items
            })
        }
    }, [invoice])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!shopId) {
            toast.error('Shop ID not found')
            return
        }

        try {
            if (invoiceId) {
                await updateMutation.mutateAsync({
                    id: invoiceId,
                    data: formData
                })
                toast.success('Invoice updated successfully')
            } else {
                await createMutation.mutateAsync({
                    ...formData,
                    shop_id: shopId
                })
                toast.success('Invoice created successfully')
            }
            onClose()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save invoice')
        }
    }

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            invoice_items: [...prev.invoice_items, {
                id: crypto.randomUUID(),
                item_type: 'part',
                description: '',
                quantity: 1,
                unit_price: 0,
                total_price: 0
            }]
        }))
    }

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            invoice_items: prev.invoice_items.filter((_, i) => i !== index)
        }))
    }

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        setFormData(prev => {
            const items = [...prev.invoice_items]
            items[index] = { ...items[index], [field]: value }
            
            // Recalculate total_price
            if (field === 'quantity' || field === 'unit_price') {
                items[index].total_price = items[index].quantity * items[index].unit_price
            }
            
            return { ...prev, invoice_items: items }
        })
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

    if (isLoading && invoiceId) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                </div>
            </Card>
        )
    }

    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] h-full overflow-hidden flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold">Basic Information</h3>
                        
                        <div>
                            <Label htmlFor="title" className="text-gray-300">Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-[#0d0d0d] border-[#3a3a3a] text-white"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description" className="text-gray-300">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-[#0d0d0d] border-[#3a3a3a] text-white"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="status" className="text-gray-300">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger className="bg-[#0d0d0d] border-[#3a3a3a] text-white">
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
                                <Label htmlFor="priority" className="text-gray-300">Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                                >
                                    <SelectTrigger className="bg-[#0d0d0d] border-[#3a3a3a] text-white">
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

                    {/* Customer & Vehicle Information */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold">Customer & Vehicle Information</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Customer Information */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Customer
                                </h4>
                                <div className="bg-[#0d0d0d] rounded-lg p-3 border border-[#3a3a3a]">
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Customer Name"
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                                            className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                placeholder="Phone"
                                                value={customerInfo.phone}
                                                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                                                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                            />
                                            <Input
                                                placeholder="Email"
                                                value={customerInfo.email}
                                                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                                                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Information */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Car className="h-4 w-4" />
                                    Vehicle
                                </h4>
                                <div className="bg-[#0d0d0d] rounded-lg p-3 border border-[#3a3a3a]">
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            <Input
                                                placeholder="Year"
                                                value={vehicleInfo.year}
                                                onChange={(e) => setVehicleInfo(prev => ({ ...prev, year: e.target.value }))}
                                                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                            />
                                            <Input
                                                placeholder="Make"
                                                value={vehicleInfo.make}
                                                onChange={(e) => setVehicleInfo(prev => ({ ...prev, make: e.target.value }))}
                                                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                            />
                                            <Input
                                                placeholder="Model"
                                                value={vehicleInfo.model}
                                                onChange={(e) => setVehicleInfo(prev => ({ ...prev, model: e.target.value }))}
                                                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                placeholder="License Plate"
                                                value={vehicleInfo.licensePlate}
                                                onChange={(e) => setVehicleInfo(prev => ({ ...prev, licensePlate: e.target.value }))}
                                                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                            />
                                            <Input
                                                placeholder="VIN"
                                                value={vehicleInfo.vin}
                                                onChange={(e) => setVehicleInfo(prev => ({ ...prev, vin: e.target.value }))}
                                                className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-semibold">Line Items</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addItem}
                                className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        {formData.invoice_items.map((item, index) => (
                            <Card key={item.id} className="bg-[#0d0d0d] border-[#3a3a3a] p-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Select
                                            value={item.item_type}
                                            onValueChange={(value: any) => updateItem(index, 'item_type', value)}
                                        >
                                            <SelectTrigger className="w-32 bg-[#1a1a1a] border-[#3a3a3a] text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="labor">Labor</SelectItem>
                                                <SelectItem value="part">Part</SelectItem>
                                                <SelectItem value="service">Service</SelectItem>
                                                <SelectItem value="fee">Fee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(index)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <Input
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                    />

                                    <div className="grid grid-cols-3 gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                            className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                            min="0"
                                            step="0.01"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Unit Price"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                                            className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                            min="0"
                                            step="0.01"
                                        />
                                        <Input
                                            placeholder="Total"
                                            value={`$${item.total_price.toFixed(2)}`}
                                            disabled
                                            className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Totals */}
                    <Card className="bg-[#0d0d0d] border-[#3a3a3a] p-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-400">
                                <span>Subtotal:</span>
                                <span>${calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Tax ({(formData.tax_rate * 100).toFixed(0)}%):</span>
                                <span>${calculateTax().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Discount:</span>
                                <Input
                                    type="number"
                                    value={formData.discount_amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: Number(e.target.value) }))}
                                    className="w-24 h-6 bg-[#1a1a1a] border-[#3a3a3a] text-white text-right"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-[#3a3a3a]">
                                <span>Total:</span>
                                <span>${calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-[#2a2a2a] p-4 flex items-center gap-3">
                    <Button
                        type="submit"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {(createMutation.isPending || updateMutation.isPending) ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Invoice
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    )
}

export default InvoiceForm
