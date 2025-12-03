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
import { useAuth } from '@/lib/auth/AuthProvider'
import { useCreateInvoice } from '../../hooks/use-invoices'
import type { InvoiceFormData, InvoiceItem } from '../../types/invoice'
import { toast } from 'sonner'
import { CustomerInformation } from '../../../operations/components/work-orders/shared/customer-information'
import { VehicleInformation } from '../../../operations/components/work-orders/shared/vehicle-information'
import { WalkInVehicleForm } from '../../../operations/components/work-orders/create/WalkInVehicleForm'
import { InvoiceLaborItems } from './InvoiceLaborItems'
import { InvoicePartsItems } from './InvoicePartsItems'
import { InvoiceServicesItems } from './InvoiceServicesItems'
import { InvoicePackagesItems } from './InvoicePackagesItems'
import { InvoiceDiscountsItems } from './InvoiceDiscountsItems'
import type { WalkInVehicleInfo } from '../../../customers/types/vehicle'

interface NewInvoiceProps {
    isOpen: boolean
    onClose: () => void
    onInvoiceCreated?: () => void
}

const NewInvoice: React.FC<NewInvoiceProps> = ({ isOpen, onClose, onInvoiceCreated }) => {
    const { shopId } = useAuth()
    const createMutation = useCreateInvoice()

    const [formData, setFormData] = useState<InvoiceFormData>({
        customer_id: null,
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
        invoice_items: [],
        customer_type: 'registered',
        walk_in_vehicle_info: undefined
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
        vin: '',
        mileage: '',
        color: ''
    })

    // Walk-in vehicle info state
    const [walkInVehicleInfo, setWalkInVehicleInfo] = useState<WalkInVehicleInfo>({
        year: new Date().getFullYear(),
        make: '',
        model: '',
        license_plate: '',
        color: '',
        vin: '',
        mileage: undefined
    })
    
    // Tax toggle state
    const [includeTax, setIncludeTax] = useState(true)

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            resetFormValues()
        }
    }, [isOpen])

    const resetFormValues = () => {
        setFormData({
            customer_id: null,
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
            invoice_items: [],
            customer_type: 'registered',
            walk_in_vehicle_info: undefined
        })
        
        setCustomerInfo({
            name: '',
            phone: '',
            email: '',
            address: ''
        })
        
        setVehicleInfo({
            year: '',
            make: '',
            model: '',
            licensePlate: '',
            vin: '',
            mileage: '',
            color: ''
        })

        setWalkInVehicleInfo({
            year: new Date().getFullYear(),
            make: '',
            model: '',
            license_plate: '',
            color: '',
            vin: '',
            mileage: undefined
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!shopId) {
            toast.error('Shop ID not found')
            return
        }

        try {
            // Prepare walk-in vehicle info if customer type is walk-in
            let walkInVehicleData = undefined
            if (formData.customer_type === 'walk_in') {
                walkInVehicleData = {
                    year: walkInVehicleInfo.year || new Date().getFullYear(),
                    make: walkInVehicleInfo.make || '',
                    model: walkInVehicleInfo.model || '',
                    license_plate: walkInVehicleInfo.license_plate || '',
                    color: walkInVehicleInfo.color || undefined,
                    vin: walkInVehicleInfo.vin || undefined,
                    mileage: walkInVehicleInfo.mileage || undefined
                }
            }

            // Ensure tax_rate is 0 if tax is disabled
            const finalFormData = {
                ...formData,
                tax_rate: includeTax ? formData.tax_rate : 0,
                walk_in_vehicle_info: walkInVehicleData
            }
            
            await createMutation.mutateAsync({
                ...finalFormData,
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
        // Tax rate is always 13% when enabled, 0 when disabled
        setFormData(prev => ({ ...prev, tax_rate: checked ? 0.13 : 0 }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="max-w-4xl h-[90vh] bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] p-0 flex flex-col [&>button:last-child]:hidden">
                {/* Fixed Header */}
                <DialogHeader className="bg-slate-50 dark:bg-[#131313] p-4 border-b border-border dark:border-[#333333] flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle className="text-xl font-semibold text-foreground dark:text-white">
                                Create Invoice
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">
                                Fill in the details below to create a new invoice
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
                        {/* Customer Type Selection */}
                        <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Customer Type</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="customer-type" className="text-muted-foreground dark:text-gray-400 text-xs">Customer Type</Label>
                                        <Select
                                            value={formData.customer_type}
                                            onValueChange={(value: 'registered' | 'walk_in') => {
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    customer_type: value, 
                                                    customer_id: value === 'walk_in' ? null : prev.customer_id 
                                                }))
                                            }}
                                        >
                                            <SelectTrigger className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                                                <SelectItem value="registered" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Registered Customer</SelectItem>
                                                <SelectItem value="walk_in" className="hover:bg-accent dark:hover:bg-[#2a2a2a]">Walk-in Customer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information Card - Only for Registered Customers */}
                        {formData.customer_type === 'registered' && (
                            <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                                <div className="p-4">
                                    <CustomerInformation
                                        customerId={formData.customer_id || ''}
                                        customerName={customerInfo.name}
                                        customerEmail={customerInfo.email}
                                        customerPhone={customerInfo.phone}
                                        customerAddress={customerInfo.address}
                                        isEditing={true}
                                        isCreating={true}
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
                        )}

                        {/* Vehicle Information Card */}
                        <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                            <div className="p-4">
                                {formData.customer_type === 'walk_in' ? (
                                    // Walk-in Vehicle Information with Search
                                    <WalkInVehicleForm
                                        data={walkInVehicleInfo}
                                        onDataChange={setWalkInVehicleInfo}
                                        shopId={shopId || ''}
                                        onVehicleSelected={(vehicleId) => {
                                            // Vehicle selected from search - form is already populated
                                            setFormData(prev => ({ ...prev, vehicle_id: vehicleId }))
                                        }}
                                        onVehicleCreated={(vehicleId) => {
                                            // Vehicle created from search - form is already populated
                                            setFormData(prev => ({ ...prev, vehicle_id: vehicleId }))
                                        }}
                                        isEditing={true}
                                    />
                                ) : (
                                    // Registered Customer Vehicle Information
                                    <VehicleInformation
                                        customerId={formData.customer_id || undefined}
                                        selectedVehicleId={formData.vehicle_id || ""}
                                        vehicleId={formData.vehicle_id || ""}
                                        vehicleYear={vehicleInfo.year}
                                        vehicleMake={vehicleInfo.make}
                                        vehicleModel={vehicleInfo.model}
                                        vehicleColor={vehicleInfo.color}
                                        vehicleVin={vehicleInfo.vin}
                                        vehicleLicensePlate={vehicleInfo.licensePlate}
                                        vehicleMileage={vehicleInfo.mileage}
                                        isEditing={true}
                                        isCreating={true}
                                        onFieldChange={(field, value) => {
                                            if (field === 'vehicleYear') setVehicleInfo(prev => ({ ...prev, year: value }))
                                            if (field === 'vehicleMake') setVehicleInfo(prev => ({ ...prev, make: value }))
                                            if (field === 'vehicleModel') setVehicleInfo(prev => ({ ...prev, model: value }))
                                            if (field === 'vehicleVin') setVehicleInfo(prev => ({ ...prev, vin: value }))
                                            if (field === 'vehicleLicensePlate') setVehicleInfo(prev => ({ ...prev, licensePlate: value }))
                                            if (field === 'vehicleMileage') setVehicleInfo(prev => ({ ...prev, mileage: value }))
                                            if (field === 'vehicleColor') setVehicleInfo(prev => ({ ...prev, color: value }))
                                        }}
                                        onVehicleSelect={(vehicleId) => setFormData(prev => ({ ...prev, vehicle_id: vehicleId }))}
                                    />
                                )}
                            </div>
                        </div>
                        
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
                                            maxLength={500}
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

                        {/* Invoice Items Card */}
                        <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Invoice Items</h3>
                                </div>

                                {/* Labor Items */}
                                <div className="mb-6">
                                    <InvoiceLaborItems
                                        items={formData.invoice_items}
                                        onItemsChange={handleItemsChange}
                                    />
                                </div>

                                {/* Parts Items */}
                                <div className="mb-6">
                                    <InvoicePartsItems
                                        items={formData.invoice_items}
                                        onItemsChange={handleItemsChange}
                                    />
                                </div>

                                {/* Service Items */}
                                <div className="mb-6">
                                    <InvoiceServicesItems
                                        items={formData.invoice_items}
                                        onItemsChange={handleItemsChange}
                                    />
                                </div>

                                {/* Package Items */}
                                <div className="mb-6">
                                    <InvoicePackagesItems
                                        items={formData.invoice_items}
                                        onItemsChange={handleItemsChange}
                                    />
                                </div>

                                {/* Discount Items */}
                                <div>
                                    <InvoiceDiscountsItems
                                        items={formData.invoice_items}
                                        onItemsChange={handleItemsChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Invoice Summary Card */}
                        <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Invoice Summary</h3>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Checkbox
                                            id="include-tax"
                                            checked={includeTax}
                                            onCheckedChange={handleTaxToggle}
                                            className="border-border dark:border-gray-500"
                                        />
                                        <Label htmlFor="include-tax" className="text-sm text-foreground dark:text-gray-300 cursor-pointer">
                                            Include Tax (13% HST)
                                        </Label>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                        <span>Subtotal:</span>
                                        <span>${calculateSubtotal().toFixed(2)}</span>
                                    </div>
                                    {includeTax && (
                                        <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                            <span>Tax (13% HST):</span>
                                            <span>${calculateTax().toFixed(2)}</span>
                                        </div>
                                    )}
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

export default NewInvoice
