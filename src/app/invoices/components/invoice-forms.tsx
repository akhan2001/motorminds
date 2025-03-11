import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getShopInfo } from "@/utils/supabase/supabase-shop";
import { getCustomers, getCustomerVehicles } from "@/app/customers/api/customer-utils";
import { Button } from "@/components/ui/button";
import { createNewInvoice } from "@/app/invoices/utils/invoice-utils";
import { getShopStaffNames } from "@/utils/shopinfo/getShopInfo";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function InvoiceForm({ onClose, shopId, isOpen, onInvoiceCreated }: { 
    onClose: () => void, 
    shopId: string, 
    isOpen: boolean,
    onInvoiceCreated?: () => void 
}) {
    // Form state
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [shopName, setShopName] = useState("");
    const [shopAddress, setShopAddress] = useState("");
    const [shopEmail, setShopEmail] = useState("");
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerVehicles, setCustomerVehicles] = useState<any[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [labour, setLabour] = useState("");
    const [parts, setParts] = useState("");
    const [notes, setNotes] = useState("");
    const [mileage, setMileage] = useState("");
    const [description, setDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [total, setTotal] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [staffNames, setStaffNames] = useState<any[]>([]);

    // Load customers
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const customersData = await getCustomers(shopId);
                setCustomers(customersData);
            } catch (error) {
                console.error("Error fetching customers:", error);
                toast.error("Failed to load customers");
            }
        };

        if (shopId) {
            fetchCustomers();
        }
    }, [shopId]);

    // Load shop info
    useEffect(() => {
        const fetchShopInfo = async () => {
            try {
                const shopInfo = await getShopInfo(shopId);
                if (shopInfo) {
                    setShopName(shopInfo.shop_name || "");
                    setShopAddress(shopInfo.shop_address || "");
                    setShopEmail(shopInfo.shop_email || "");
                }
            } catch (error) {
                console.error("Error fetching shop info:", error);
                toast.error("Failed to load shop information");
            }
        };

        const fetchStaffNames = async () => {
            try {
                const staffNamesData = await getShopStaffNames(shopId);
                setStaffNames(staffNamesData);
            } catch (error) {
                console.error("Error fetching staff names:", error);
                toast.error("Failed to load staff names");
            }
        };
        
        if (shopId) {
            fetchShopInfo();
            fetchStaffNames();
        }
    }, [shopId]);

    // Generate invoice number
    useEffect(() => {
        setInvoiceNumber(uuidv4());
    }, []);

    // Update selected customer details when customer changes
    useEffect(() => {
        if (selectedCustomerId) {
            const customer = customers.find(c => c.id === selectedCustomerId);
            if (customer) {
                setSelectedCustomer(customer);
            }
        }
    }, [selectedCustomerId, customers]);

    // Load vehicles for selected customer
    useEffect(() => {
        const loadVehicles = async () => {
            if (selectedCustomerId) {
                try {
                    console.log("Fetching vehicles for customer:", selectedCustomerId);
                    const vehicles = await getCustomerVehicles(selectedCustomerId);
                    setCustomerVehicles(vehicles);
                } catch (error) {
                    console.error("Error fetching vehicles:", error);
                    toast.error("Failed to load vehicles");
                }
            }
        };

        if (selectedCustomerId) {
            loadVehicles();
        }
    }, [selectedCustomerId]);

    const handleCustomerChange = (value: string) => {
        setSelectedCustomerId(value);
    };

    const handleVehicleChange = (value: string) => {
        setSelectedVehicleId(value);
    };

    const validateForm = () => {
        if (!invoiceNumber) {
            toast.error("Invoice number is required");
            return false;
        }
        
        if (!shopId) {
            toast.error("Shop ID is required");
            return false;
        }
        
        if (!selectedCustomerId) {
            toast.error("Please select a customer");
            return false;
        }
        
        if (!invoiceDate) {
            toast.error("Please select an invoice date");
            return false;
        }

        if (!labour || !description) {
            toast.error("Please enter a valid labour or description");
            return false;
        }
        
        if (!total || isNaN(parseFloat(total)) || parseFloat(total) <= 0) {
            toast.error("Please enter a valid total amount");
            return false;
        }
        
        return true;
    };

    const handleAssignedToChange = (value: string) => {
        setAssignedTo(value);
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            // Ensure invoice number is set
            if (!invoiceNumber) {
                setInvoiceNumber(uuidv4());
            }
            
            // Create the invoice data with proper validation
            const invoiceData = {
                invoice_number: invoiceNumber || uuidv4(),
                shop_id: shopId,
                shop_name: shopName || "Unknown Shop",
                shop_address: shopAddress || "",
                shop_email: shopEmail || "",
                client_name: selectedCustomer?.customer_name || "Unknown Client",
                client_address: selectedCustomer?.customer_address || "",
                client_email: selectedCustomer?.customer_email || "",
                issue_date: invoiceDate || new Date().toISOString().split('T')[0],
                labour: labour || "",
                parts: parts || "",
                notes: notes || "",
                mileage: mileage || "",
                description: description || "",
                assigned_to: assignedTo || "",
                amount: parseFloat(total) || 0,
                status: "UNPAID"
            };
            
            console.log("Sending invoice data:", invoiceData);
            
            const result = await createNewInvoice(invoiceData, shopId);
            
            if (result) {
                toast.success("Invoice created successfully");
                if (onInvoiceCreated) {
                    onInvoiceCreated();
                }
                onClose();
            } else {
                toast.error("Failed to create invoice");
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
            toast.error("Failed to create invoice: " + (error as Error).message || "Unknown error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-white">Create New Invoice</DialogTitle>
                    <DialogDescription className="text-gray-400 text-sm">
                        Invoice Number: <span className="text-gray-400 text-xs">{invoiceNumber}</span>
                    </DialogDescription>
                </DialogHeader>

                {/* Shop information */}
                <div>
                    <label className="text-gray-300 text-sm">Shop Information</label>
                    <Input
                        className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                        value={shopName}
                        disabled
                    />
                    <Input
                        className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                        value={shopAddress}
                        disabled
                    />
                    <Input
                        className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                        value={shopEmail}
                        disabled
                    />
                </div>

                {/* Customer selection */}
                <div className="flex flex-col gap-4">
                    <label className="text-gray-300 text-sm">Customer Information</label>
                    <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                        <SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1">
                            <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#292929] text-white border-[#626262]">
                            {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                    {customer.customer_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/** Vehicle Information */}
                <div className="flex flex-col gap-4">
                    <label className="text-gray-300 text-sm">Vehicle Information</label>
                    <Select value={selectedVehicleId} onValueChange={handleVehicleChange}>
                        <SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1">
                            <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#292929] text-white border-[#626262]">
                            {customerVehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Invoice date */}
                <div className="flex flex-col gap-4">
                    <label className="text-gray-300 text-sm">Invoice Date</label>
                    <Input
                        className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                </div>

                {/* Invoice details */}
                <div className="flex flex-col gap-1">
                    <label className="text-gray-300 text-sm">Invoice Details</label>
                    
                    <div className="flex flex-row justify-between gap-4 items-center">
                        <label className="text-gray-300 text-sm">Description</label>
                        <Input
                            className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 w-[75%]"
                            placeholder="Enter the description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-row justify-between gap-4 items-center">
                        <label className="text-gray-300 text-sm">Labour</label>
                        <Textarea
                            className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 w-[75%]"
                            placeholder="Enter the labour cost"
                            value={labour}
                            onChange={(e) => setLabour(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-row justify-between gap-4 items-center">
                        <label className="text-gray-300 text-sm">Parts</label>
                        <Input
                            className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 w-[75%]"
                            placeholder="Enter the parts"
                            value={parts}
                            onChange={(e) => setParts(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-row justify-between gap-4 items-center">
                        <label className="text-gray-300 text-sm">Notes</label>
                        <Input
                            className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 w-[75%]"
                            placeholder="Enter the notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-row justify-between gap-4 items-center">
                        <label className="text-gray-300 text-sm">Mileage</label>
                        <Input
                            className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 w-[75%]"
                            placeholder="Enter the mileage"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-row justify-between gap-4 items-center">
                        <label className="text-gray-300 text-sm">Assigned To</label>
                        {/* <Input
                            className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 w-[75%]"
                            placeholder="Enter the assigned to"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                        /> */}
                        <Select value={assignedTo} onValueChange={handleAssignedToChange}>
                            <SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 w-[75%]">
                                <SelectValue placeholder="Select a staff member" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                {staffNames.map((staff) => (
                                    <SelectItem key={staff.id} value={staff.id}>
                                        {staff.staff_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-row justify-between gap-4 items-center">
                        <label className="text-gray-300 text-sm">Total ($)</label>
                        <Input
                            className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 w-[75%]"
                            placeholder="Enter the total amount"
                            type="number"
                            value={total}
                            onChange={(e) => setTotal(e.target.value)}
                        />
                    </div>
                </div>
                
                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        className="bg-[#22C55E] text-white hover:bg-[#22C55E]/80" 
                        onClick={handleSave}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating..." : "Create Invoice"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}