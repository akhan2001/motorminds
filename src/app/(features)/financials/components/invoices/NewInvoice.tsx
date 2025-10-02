'use client'

import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from '../../../operations/hooks/use-auth';
import { useCreateInvoice } from '../../hooks/use-invoices';
import { CustomerDropdown } from "@/app/(features)/customers/components/Selection";
import { VehicleDropdown } from "@/app/(features)/customers/components/Selection";
import { CustomerService, type CustomerFormData } from "@/app/(features)/customers/lib/customer-service";
import { VehicleService } from "@/app/(features)/customers/lib/vehicle-service";
import type { InvoiceFormData, InvoiceStatus, InvoicePriority } from '../../types/invoice';
import { formatPhoneNumber } from "@/lib/utils/text";
import { Save, Loader2 } from "lucide-react";

interface NewInvoiceProps {
    isOpen: boolean;
    onClose: () => void;
    onInvoiceCreated?: () => void;
}

export default function NewInvoice({ 
    isOpen, 
    onClose, 
    onInvoiceCreated 
}: NewInvoiceProps) {
    const { shopId } = useAuth();
    const createInvoiceMutation = useCreateInvoice();
    
    // Form state following InvoiceFormData interface
    const [customerId, setCustomerId] = useState("");
    const [vehicleId, setVehicleId] = useState<string | null>(null);
    const [workOrderId, setWorkOrderId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<InvoiceStatus>('draft');
    const [priority, setPriority] = useState<InvoicePriority>('medium');
    const [taxRate, setTaxRate] = useState(0.13);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
    const [paymentReference, setPaymentReference] = useState("");
    const [notes, setNotes] = useState("");
    const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
    
    // Customer and vehicle info for display
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [vehicleYear, setVehicleYear] = useState("");
    const [vehicleMake, setVehicleMake] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [vehicleColor, setVehicleColor] = useState("");
    const [vehicleVin, setVehicleVin] = useState("");
    const [vehicleLicensePlate, setVehicleLicensePlate] = useState("");
    const [vehicleMileage, setVehicleMileage] = useState("");
    
    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);
    const [isSavingVehicle, setIsSavingVehicle] = useState(false);

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            resetFormValues();
        }
    }, [isOpen]);

    const resetFormValues = () => {
        setCustomerId("");
        setVehicleId(null);
        setWorkOrderId(null);
        setTitle("");
        setDescription("");
        setStatus('draft');
        setPriority('medium');
        setTaxRate(0.13);
        setDiscountAmount(0);
        setIssueDate(new Date().toISOString().split('T')[0]);
        setDueDate(null);
        setPaymentMethod(null);
        setPaymentReference("");
        setNotes("");
        setInvoiceItems([]);
        
        // Clear customer and vehicle info
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setCustomerAddress("");
        setVehicleYear("");
        setVehicleMake("");
        setVehicleModel("");
        setVehicleColor("");
        setVehicleVin("");
        setVehicleLicensePlate("");
        setVehicleMileage("");
    };

    // Handle customer selection from dropdown
    const handleCustomerSelect = (selectedCustomerId: string, customerData?: any) => {
        if (selectedCustomerId === "new") {
            // "Add New Customer" - clear all fields
            setCustomerId("new");
            setCustomerName("");
            setCustomerEmail("");
            setCustomerPhone("");
            setCustomerAddress("");
            setVehicleId(null);
        } else if (customerData) {
            // Existing customer - populate data
            setCustomerId(selectedCustomerId);
            setCustomerName(customerData.name);
            setCustomerEmail(customerData.email || '');
            setCustomerPhone(customerData.phone || '');
            setCustomerAddress(customerData.address || '');
            setVehicleId(null); // Reset vehicle selection
        }
    };

    // Handle vehicle selection from dropdown
    const handleVehicleSelect = (selectedVehicleId: string, vehicleData?: any) => {
        if (selectedVehicleId === "new") {
            // "Add New Vehicle" - clear all fields for manual input
            setVehicleId("new");
            setVehicleYear("");
            setVehicleMake("");
            setVehicleModel("");
            setVehicleColor("");
            setVehicleVin("");
            setVehicleLicensePlate("");
            setVehicleMileage("");
        } else if (vehicleData) {
            // Existing vehicle - populate data
            setVehicleId(selectedVehicleId);
            setVehicleYear(vehicleData.year.toString());
            setVehicleMake(vehicleData.make);
            setVehicleModel(vehicleData.model);
            setVehicleColor(vehicleData.color || '');
            setVehicleVin(vehicleData.vin || '');
            setVehicleLicensePlate(vehicleData.licensePlate || '');
            setVehicleMileage(''); // Mileage not included in dropdown data
        }
    };

    // Handle saving new customer
    const handleSaveCustomer = async () => {
        if (!shopId) {
            toast.error('Shop ID is required');
            return;
        }

        if (!customerName.trim()) {
            toast.error('Customer name is required');
            return;
        }

        if (!customerPhone.trim()) {
            toast.error('Customer phone is required');
            return;
        }

        setIsSavingCustomer(true);
        try {
            const customerData: CustomerFormData = {
                name: customerName.trim(),
                email: customerEmail.trim() || undefined,
                phone: customerPhone.trim(),
                address: customerAddress.trim() || undefined,
                source: 'invoice'
            };

            const savedCustomer = await CustomerService.createCustomer(shopId, customerData);
            
            toast.success(`Customer "${savedCustomer.customer_name}" created successfully`);
            
            // Update the customer ID to the newly created customer
            setCustomerId(savedCustomer.id);
            
        } catch (error: any) {
            console.error('Error saving customer:', error);
            toast.error(error.message || 'Failed to save customer');
        } finally {
            setIsSavingCustomer(false);
        }
    };

    // Handle saving new vehicle
    const handleSaveVehicle = async () => {
        if (!customerId || customerId === "new") {
            toast.error('Customer must be saved first before adding vehicles');
            return;
        }

        if (!vehicleYear.trim()) {
            toast.error('Vehicle year is required');
            return;
        }

        if (!vehicleMake.trim()) {
            toast.error('Vehicle make is required');
            return;
        }

        if (!vehicleModel.trim()) {
            toast.error('Vehicle model is required');
            return;
        }

        setIsSavingVehicle(true);
        try {
            const vehicleData = {
                year: vehicleYear.trim(),
                make: vehicleMake.trim(),
                model: vehicleModel.trim(),
                color: vehicleColor.trim() || undefined,
                vin: vehicleVin.trim() || undefined,
                licensePlate: vehicleLicensePlate.trim() || undefined,
                mileage: vehicleMileage.trim() || undefined,
            };

            const savedVehicle = await VehicleService.createVehicle(customerId, vehicleData);
            
            toast.success(`Vehicle "${savedVehicle.year} ${savedVehicle.make} ${savedVehicle.model}" created successfully`);
            
            // Update the vehicle ID to the newly created vehicle
            setVehicleId(savedVehicle.id);
            
        } catch (error: any) {
            console.error('Error saving vehicle:', error);
            toast.error(error.message || 'Failed to save vehicle');
        } finally {
            setIsSavingVehicle(false);
        }
    };

    const validateForm = () => {
        if (!shopId) {
            toast.error("Shop ID is required");
            return false;
        }
        
        if (!customerId || customerId === "new") {
            toast.error("Please select or create a customer");
            return false;
        }
        
        if (!issueDate) {
            toast.error("Please select an invoice date");
            return false;
        }

        if (!title.trim()) {
            toast.error("Please enter a title");
            return false;
        }
        
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            const invoiceData: InvoiceFormData = {
                customer_id: customerId,
                vehicle_id: vehicleId,
                work_order_id: workOrderId,
                title: title.trim(),
                description: description.trim() || null,
                status: status,
                priority: priority,
                tax_rate: taxRate,
                discount_amount: discountAmount,
                issue_date: issueDate,
                due_date: dueDate,
                payment_method: paymentMethod as any,
                payment_reference: paymentReference.trim() || null,
                notes: notes.trim() || null,
                invoice_items: invoiceItems
            };
            
            const result = await createInvoiceMutation.mutateAsync(invoiceData);
            if (result) {
                toast.success("Invoice created successfully");
                if (onInvoiceCreated) {
                    onInvoiceCreated();
                }
                onClose();
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
            toast.error(`Failed to create invoice: ${(error as Error).message || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-0 max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[75vw] md:max-w-[65vw] flex flex-col">
                {/* Sticky Header */}
                <DialogHeader className="sticky top-0 bg-[#131313] z-10 p-4 sm:p-6 border-b border-[#222222] rounded-t-lg">
                    <DialogTitle className="text-white text-xl sm:text-2xl">
                        Create New Invoice
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs sm:text-sm">
                        Fill in the details below to create a new invoice.
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                        {/* Customer Information */}
                        <h3 className="text-lg font-medium text-white">Customer Information</h3>
                        <div className="bg-[#1A1A1A] rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-4">
                                    {/* Customer Selection Dropdown */}
                                    <div className="flex flex-wrap gap-2">
                                        <div className="w-full sm:w-auto sm:flex-1">
                                            <CustomerDropdown
                                                shopId={shopId || ""}
                                                selectedCustomerId={customerId}
                                                onCustomerSelect={handleCustomerSelect}
                                                placeholder={shopId ? "Select Customer" : "Loading..."}
                                                className="w-full"
                                                isLoading={!shopId}
                                            />
                                        </div>
                                    </div>

                                    {/* Customer Information Fields */}
                                    <div className="space-y-2 mt-2 p-3 border border-[#2a2a2a] rounded-md">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {/* First row */}
                                            <div>
                                                <Input
                                                    className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                                    placeholder="Customer Name"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    disabled={customerId !== "new"}
                                                    required={customerId === "new"}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                                    placeholder="Phone Number"
                                                    value={formatPhoneNumber(customerPhone)}
                                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                                    disabled={customerId !== "new"}
                                                    required={customerId === "new"}
                                                    inputMode="numeric"
                                                />
                                            </div>
                                            
                                            {/* Second row */}
                                            <div>
                                                <Input
                                                    className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                                    placeholder="Email Address"
                                                    type="email"
                                                    value={customerEmail}
                                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                                    disabled={customerId !== "new"}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                                    placeholder="Address"
                                                    value={customerAddress}
                                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                                    disabled={customerId !== "new"}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Save Customer Button - Only show when creating new customer */}
                                        {customerId === "new" && (
                                            <div className="mt-4 flex justify-end">
                                                <Button
                                                    onClick={handleSaveCustomer}
                                                    disabled={isSavingCustomer || !customerName.trim() || !customerPhone.trim()}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    size="sm"
                                                >
                                                    {isSavingCustomer ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4 mr-2" />
                                                            Save Customer
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Information */}
                        <h3 className="text-lg font-medium text-white">Vehicle Information</h3>
                        <div className="bg-[#1A1A1A] rounded-xl p-6">
                            {/* Vehicle Selection Dropdown */}
                            {customerId && customerId !== "new" && (
                                <div className="mb-4">
                                    <VehicleDropdown
                                        customerId={customerId}
                                        selectedVehicleId={vehicleId || ""}
                                        onVehicleSelect={handleVehicleSelect}
                                        placeholder="Select Vehicle"
                                        className="w-full"
                                        isLoading={!customerId}
                                    />
                                </div>
                            )}
                            
                            {/* Vehicle Information Fields */}
                            <div className="space-y-2 mt-2 p-3 border border-[#2a2a2a] rounded-md">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Year</Label>
                                        <Input
                                            value={vehicleYear}
                                            onChange={(e) => setVehicleYear(e.target.value)}
                                            className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                            readOnly={!!vehicleId && vehicleId !== "new"}
                                            required={!vehicleId || vehicleId === "new"}
                                            placeholder="e.g. 2020"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Make</Label>
                                        <Input
                                            value={vehicleMake}
                                            onChange={(e) => setVehicleMake(e.target.value)}
                                            className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                            readOnly={!!vehicleId && vehicleId !== "new"}
                                            required={!vehicleId || vehicleId === "new"}
                                            placeholder="e.g. Honda"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Model</Label>
                                        <Input
                                            value={vehicleModel}
                                            onChange={(e) => setVehicleModel(e.target.value)}
                                            className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                            readOnly={!!vehicleId && vehicleId !== "new"}
                                            required={!vehicleId || vehicleId === "new"}
                                            placeholder="e.g. Civic"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Color</Label>
                                        <Input
                                            value={vehicleColor}
                                            onChange={(e) => setVehicleColor(e.target.value)}
                                            className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                            readOnly={!!vehicleId && vehicleId !== "new"}
                                            placeholder="e.g. Blue"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">VIN</Label>
                                        <Input
                                            value={vehicleVin}
                                            onChange={(e) => setVehicleVin(e.target.value.toUpperCase())}
                                            className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                            readOnly={!!vehicleId && vehicleId !== "new"}
                                            placeholder="17-character VIN"
                                            maxLength={17}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">License Plate</Label>
                                        <Input
                                            value={vehicleLicensePlate}
                                            onChange={(e) => setVehicleLicensePlate(e.target.value.toUpperCase())}
                                            className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                            readOnly={!!vehicleId && vehicleId !== "new"}
                                            placeholder="ABC123"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-gray-400">Mileage</Label>
                                        <Input
                                            value={vehicleMileage}
                                            onChange={(e) => setVehicleMileage(e.target.value)}
                                            className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                            placeholder="Current mileage"
                                            type="number"
                                        />
                                    </div>
                                </div>
                                
                                {/* Save New Vehicle Button - Only show when creating new vehicle */}
                                {(!vehicleId || vehicleId === "new") && customerId && customerId !== "new" && (
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            onClick={handleSaveVehicle}
                                            disabled={isSavingVehicle || !vehicleYear.trim() || !vehicleMake.trim() || !vehicleModel.trim()}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            size="sm"
                                        >
                                            {isSavingVehicle ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Vehicle
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <h3 className="text-lg font-medium text-white">Invoice Details</h3>
                        <div className="space-y-3 bg-[#1A1A1A] rounded-xl p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-300 text-sm font-medium mb-1 block">Invoice Date</Label>
                                    <Input
                                        className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500"
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-300 text-sm font-medium mb-1 block">Due Date (Optional)</Label>
                                    <Input
                                        className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500"
                                        type="date"
                                        value={dueDate || ""}
                                        onChange={(e) => setDueDate(e.target.value || null)}
                                        min={issueDate}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-300 text-sm font-medium mb-1 block">Title *</Label>
                                    <Input
                                        className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                        placeholder="Enter a title for the invoice"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-300 text-sm font-medium mb-1 block">Priority</Label>
                                    <select
                                        className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full p-2 rounded-md"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as InvoicePriority)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-300 text-sm font-medium mb-1 block">Description</Label>
                                <Textarea
                                    className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                    placeholder="Enter invoice description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label className="text-gray-300 text-sm font-medium mb-1 block">Notes</Label>
                                <Textarea
                                    className="bg-[#1a1a1a] text-white text-sm border-[#2a2a2a] focus:ring-gray-500 w-full"
                                    placeholder="Enter any notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                <DialogFooter className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:justify-between w-full px-6 py-4">
                    <Button 
                        variant="outline" 
                        onClick={resetFormValues} 
                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white w-full sm:w-auto order-3 sm:order-1"
                    >
                        Clear Form
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto order-1 sm:order-2">
                        <Button 
                            variant="outline" 
                            onClick={onClose} 
                            className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white w-full sm:w-auto order-2 sm:order-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="bg-[#22C55E] text-white hover:bg-[#22C55E]/80 w-full sm:w-auto order-1 sm:order-2" 
                            onClick={handleSave}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating..." : "Create Invoice"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
