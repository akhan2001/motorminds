'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Save, Plus, Trash2, User, Car, X, LayoutIcon } from 'lucide-react'
import { useAuth } from '../../../operations/hooks/use-auth'
import { useInvoice, useCreateInvoice, useUpdateInvoice } from '../../hooks/use-invoices'
import type { InvoiceFormData, InvoiceItem } from '../../types/invoice'
import { toast } from 'sonner'
import { CustomerInformation } from '../../../operations/components/work-orders/shared/customer-information'
import { VehicleInformation } from '../../../operations/components/work-orders/shared/vehicle-information'
import { WorkOrderItemsService } from '../../../operations/lib/work-order-items-service'
import type { WorkOrderItem } from '../../../operations/types/work-order-items'
import { InvoiceLaborItemsAdapter } from './items/InvoiceLaborItemsAdapter'
import { InvoicePartsItemsAdapter } from './items/InvoicePartsItemsAdapter'
import { InvoiceGenericItemsAdapter } from './items/InvoiceGenericItemsAdapter'
import { InvoiceExpenseItemsAdapter } from './items/InvoiceExpenseItemsAdapter'
import { Tag } from 'lucide-react'

interface InvoiceFormDialogProps {
    isOpen: boolean
    onClose: () => void
    invoiceId?: string | null
}

const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({ isOpen, onClose, invoiceId }) => {
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
        email: '',
        address: ''
    })

    const [vehicleInfo, setVehicleInfo] = useState({
        year: '',
        make: '',
        model: '',
        licensePlate: '',
        vin: ''
    })

    // State for work order items
    const [workOrderItems, setWorkOrderItems] = useState<WorkOrderItem[]>([])
    const [isLoadingWorkOrderItems, setIsLoadingWorkOrderItems] = useState(false)
    
    // Tax toggle state
    const [includeTax, setIncludeTax] = useState(true)

    // Function to fetch work order items
    const fetchWorkOrderItems = async (workOrderId: string) => {
        if (!workOrderId) return
        
        setIsLoadingWorkOrderItems(true)
        try {
            const items = await WorkOrderItemsService.getWorkOrderItems(workOrderId)
            setWorkOrderItems(items)
            
            // Convert work order items to invoice items format
            const invoiceItems = items.map(item => ({
                id: item.id,
                item_type: item.item_type,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                part_number: item.part_number,
                supplier: item.supplier,
                category: item.category,
                warranty_period: item.warranty_period,
                labor_hours: item.labor_hours,
                technician_id: item.technician_id
            }))
            
            // Update form data with work order items
            setFormData(prev => ({
                ...prev,
                invoice_items: invoiceItems as any
            }))
        } catch (error) {
            console.error('Error fetching work order items:', error)
            toast.error('Failed to load Work Order items')
        } finally {
            setIsLoadingWorkOrderItems(false)
        }
    }

    useEffect(() => {
        if (invoice) {
            // Parse invoice_items from JSONB field - handle both array and object formats
            let invoiceItems = invoice.invoice_items || []
            
            // If invoice_items is a string, parse it
            if (typeof invoiceItems === 'string') {
                try {
                    invoiceItems = JSON.parse(invoiceItems)
                } catch (e) {
                    console.error('Error parsing invoice_items:', e)
                    invoiceItems = []
                }
            }
            
            // Ensure it's an array
            if (!Array.isArray(invoiceItems)) {
                invoiceItems = []
            }

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
                invoice_items: invoiceItems
            })
            
            // Set tax toggle based on tax_rate
            setIncludeTax(Number(invoice.tax_rate) > 0)

            // Only fetch work order items if invoice_items is empty and there's a work order ID
            if (invoice.work_order_id && invoiceItems.length === 0) {
                fetchWorkOrderItems(invoice.work_order_id)
            }

            // Set customer info from invoice
            if (invoice.customer) {
                setCustomerInfo({
                    name: invoice.customer.customer_name || '',
                    phone: invoice.customer.customer_phone || '',
                    email: invoice.customer.customer_email || '',
                    address: invoice.customer.customer_address || ''
                })
            }

            // Set vehicle info from invoice
            if (invoice.vehicle) {
                setVehicleInfo({
                    year: invoice.vehicle.year?.toString() || '',
                    make: invoice.vehicle.make || '',
                    model: invoice.vehicle.model || '',
                    licensePlate: invoice.vehicle.license_plate || '',
                    vin: (invoice.vehicle as any).vin || ''
                })
            }
        }
    }, [invoice])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!shopId) {
            toast.error('Shop ID not found')
            return
        }

        try {
            // Ensure tax_rate is 0 if tax is disabled
            const finalFormData = {
                ...formData,
                tax_rate: includeTax ? formData.tax_rate : 0
            }
            
            if (invoiceId) {
                await updateMutation.mutateAsync({
                    id: invoiceId,
                    data: finalFormData
                })
                toast.success('Invoice updated successfully')
            } else {
                await createMutation.mutateAsync({
                    ...finalFormData,
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
        return formData.invoice_items.reduce((sum, item) => {
            // Discounts subtract from subtotal, all other items add
            if ((item as any).item_type === 'discount') {
                return sum - item.total_price
            }
            return sum + item.total_price
        }, 0)
    }

    const calculateTax = () => {
        if (!includeTax) return 0
        return calculateSubtotal() * formData.tax_rate
    }

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax() - formData.discount_amount
    }
    
    const handleTaxToggle = (checked: boolean) => {
        setIncludeTax(checked)
        if (!checked) {
            setFormData(prev => ({ ...prev, tax_rate: 0 }))
        } else {
            setFormData(prev => ({ ...prev, tax_rate: 0.13 })) // Default tax rate
        }
    }

    if (isLoading && invoiceId) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl h-[90vh] bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center justify-center h-full">
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-lg p-8">
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="max-w-4xl h-[90vh] bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] p-0 flex flex-col [&>button:last-child]:hidden">
                {/* Fixed Header */}
                <DialogHeader className="bg-slate-50 dark:bg-[#131313] p-4 border-b border-border dark:border-[#333333] flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-xl font-semibold text-foreground dark:text-white">
                                {invoiceId ? 'Edit Invoice' : 'Create Invoice'}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">
                                {invoiceId ? `Invoice #${invoice?.invoice_number || invoiceId}` : 'New Invoice'}
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-transparent"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-background dark:bg-[#1A1A1A] p-4">
                        <form id="invoice-form" onSubmit={handleSubmit} className="space-y-4">
                            {/* Basic Information Card */}
                            <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <LayoutIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <h3 className="text-lg font-semibold text-foreground dark:text-white">Invoice Information</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="title" className="text-muted-foreground dark:text-gray-400 text-xs">Title</Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                                placeholder="Invoice title"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="description" className="text-muted-foreground dark:text-gray-400 text-xs">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                                placeholder="Invoice description"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="status" className="text-muted-foreground dark:text-gray-400 text-xs">Status</Label>
                                                <Select
                                                    value={formData.status}
                                                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                                                >
                                                    <SelectTrigger className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                                                        <SelectItem value="draft" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Draft</SelectItem>
                                                        <SelectItem value="sent" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Sent</SelectItem>
                                                        <SelectItem value="viewed" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Viewed</SelectItem>
                                                        <SelectItem value="paid" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Paid</SelectItem>
                                                        <SelectItem value="overdue" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Overdue</SelectItem>
                                                        <SelectItem value="cancelled" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor="priority" className="text-muted-foreground dark:text-gray-400 text-xs">Priority</Label>
                                                <Select
                                                    value={formData.priority}
                                                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                                                >
                                                    <SelectTrigger className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                                                        <SelectItem value="low" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Low</SelectItem>
                                                        <SelectItem value="medium" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Medium</SelectItem>
                                                        <SelectItem value="high" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">High</SelectItem>
                                                        <SelectItem value="urgent" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Urgent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Information Card */}
                            <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                        <h3 className="text-lg font-semibold text-foreground dark:text-white">Customer Information</h3>
                                    </div>
                                    
                                    <CustomerInformation
                                        customerId={formData.customer_id}
                                        customerName={customerInfo.name}
                                        customerEmail={customerInfo.email}
                                        customerPhone={customerInfo.phone}
                                        customerAddress={customerInfo.address}
                                        isEditing={true}
                                        isCreating={!invoiceId}
                                        onFieldChange={(field, value) => {
                                            if (field === 'customer') setCustomerInfo(prev => ({ ...prev, name: value }))
                                            if (field === 'customerEmail') setCustomerInfo(prev => ({ ...prev, email: value }))
                                            if (field === 'customerPhone') setCustomerInfo(prev => ({ ...prev, phone: value }))
                                            if (field === 'customerAddress') setCustomerInfo(prev => ({ ...prev, address: value }))
                                        }}
                                        onCustomerChange={(customerId) => setFormData(prev => ({ ...prev, customer_id: customerId }))}
                                    />
                                </div>
                            </div>

                            {/* Vehicle Information Card */}
                            <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <h3 className="text-lg font-semibold text-foreground dark:text-white">Vehicle Information</h3>
                                    </div>
                                    
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
                                        isCreating={!invoiceId}
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

                            {/* Invoice Items Card */}
                            <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-4 w-4 bg-yellow-500 dark:bg-yellow-400 rounded-full"></div>
                                        <h3 className="text-lg font-semibold text-foreground dark:text-white">
                                            Invoice Items
                                            {invoice?.work_order_id && (
                                                <span className="text-sm text-muted-foreground dark:text-gray-400 ml-2">(from Work Order)</span>
                                            )}
                                        </h3>
                                    </div>

                                    {isLoadingWorkOrderItems ? (
                                        <div className="text-center py-8 text-muted-foreground dark:text-gray-500">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading work order items...
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Labor / Services Items */}
                                            <InvoiceLaborItemsAdapter
                                                items={formData.invoice_items}
                                                onItemsChange={(items) => setFormData(prev => ({ ...prev, invoice_items: items }))}
                                                isEditing={true}
                                            />

                                            {/* Parts Items */}
                                            <InvoicePartsItemsAdapter
                                                items={formData.invoice_items}
                                                onItemsChange={(items) => setFormData(prev => ({ ...prev, invoice_items: items }))}
                                                isEditing={true}
                                            />

                                            {/* Expense Items */}
                                            <InvoiceExpenseItemsAdapter
                                                items={formData.invoice_items}
                                                onItemsChange={(items) => setFormData(prev => ({ ...prev, invoice_items: items }))}
                                                isEditing={true}
                                            />

                                            {/* Discount Items */}
                                            <InvoiceGenericItemsAdapter
                                                items={formData.invoice_items}
                                                onItemsChange={(items) => setFormData(prev => ({ ...prev, invoice_items: items }))}
                                                isEditing={true}
                                                itemType="discount"
                                                title="Discounts"
                                                icon={Tag}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Invoice Summary Card */}
                            <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-4 w-4 bg-yellow-500 dark:bg-yellow-400 rounded-full"></div>
                                        <h3 className="text-lg font-semibold text-foreground dark:text-white">Invoice Summary</h3>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="include-tax"
                                                    checked={includeTax}
                                                    onCheckedChange={handleTaxToggle}
                                                    className="border-border dark:border-gray-500"
                                                />
                                                <Label htmlFor="include-tax" className="text-sm text-foreground dark:text-gray-300 cursor-pointer">
                                                    Include Tax
                                                </Label>
                                            </div>
                                            {includeTax && (
                                                <Input
                                                    type="number"
                                                    value={(formData.tax_rate * 100).toFixed(0)}
                                                    onChange={(e) => {
                                                        const rate = Number(e.target.value) / 100
                                                        setFormData(prev => ({ ...prev, tax_rate: rate }))
                                                    }}
                                                    className="w-20 h-8 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white text-right text-sm"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                />
                                            )}
                                        </div>
                                        <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                            <span>Subtotal:</span>
                                            <span>${calculateSubtotal().toFixed(2)}</span>
                                        </div>
                                        {includeTax && (
                                            <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                                <span>Tax ({(formData.tax_rate * 100).toFixed(0)}%):</span>
                                                <span>${calculateTax().toFixed(2)}</span>
                                            </div>
                                        )}
                                        {/* <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                            <span>Discount:</span>
                                            <Input
                                                type="number"
                                                value={formData.discount_amount}
                                                onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: Number(e.target.value) }))}
                                                className="w-24 h-6 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white text-right"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div> */}
                                        <Separator className="bg-border dark:bg-gray-700" />
                                        <div className="flex justify-between text-foreground dark:text-white font-bold text-lg pt-2">
                                            <span>Total:</span>
                                            <span>${calculateTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                </div>

                {/* Fixed Footer with Actions */}
                <div className="bg-slate-50 dark:bg-[#131313] border-t border-border dark:border-[#333333] p-4 flex flex-wrap gap-2 flex-shrink-0">
                    <Button
                        type="submit"
                        form="invoice-form"
                        className="bg-green-600 text-white hover:bg-green-700" 
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
                        className="bg-transparent border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a]"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default InvoiceFormDialog
