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
import { PlusIcon } from "lucide-react";

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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    const formattedDate = today.toISOString().split('T')[0];
    const [invoiceDate, setInvoiceDate] = useState(formattedDate);
    const [labour, setLabour] = useState("");
    const [parts, setParts] = useState("");
    const [notes, setNotes] = useState("");
    const [mileage, setMileage] = useState("");
    const [description, setDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [total, setTotal] = useState("");
    const [vehicleInfo, setVehicleInfo] = useState<any>(null); //jsonb field
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [staffNames, setStaffNames] = useState<any[]>([]);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [clientInfo, setClientInfo] = useState({
        client_name: '',
        client_address: '',
        client_email: ''
    });
    const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
    const [manualVehicleInfo, setManualVehicleInfo] = useState({
        year: '',
        make: '',
        model: '',
        license_plate: ''
    });

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
        // Find the selected vehicle from customerVehicles array
        const selectedVehicle = customerVehicles.find(vehicle => vehicle.id === value);
        if (selectedVehicle) {
            const vehicleDetails = {
                year: selectedVehicle.year,
                make: selectedVehicle.make,
                model: selectedVehicle.model,
                license_plate: selectedVehicle.license_plate
            };
            setVehicleInfo(vehicleDetails);
        }
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
        
        // Check either selected customer or new client info
        if (!showNewClientForm && !selectedCustomerId) {
            toast.error("Please select a customer");
            return false;
        }
        
        if (showNewClientForm && !clientInfo.client_name) {
            toast.error("Please enter client name");
            return false;
        }
        
        if (!invoiceDate) {
            toast.error("Please select an invoice date");
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
                client_name: showNewClientForm ? clientInfo.client_name : (selectedCustomer?.customer_name || "Unknown Client"),
                client_address: showNewClientForm ? clientInfo.client_address : (selectedCustomer?.customer_address || ""),
                client_email: showNewClientForm ? clientInfo.client_email : (selectedCustomer?.customer_email || ""),
                issue_date: invoiceDate || new Date().toISOString(),
                labour: labour || "",
                parts: parts || "",
                notes: notes || "",
                mileage: mileage || "",
                description: description || "",
                assigned_to: assignedTo || "",
                amount: parseFloat(total) || 0,
                status: "UNPAID",
                vehicle_info: vehicleInfo
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
                    <div className="flex gap-2">
                        <Select 
                            value={selectedCustomerId} 
                            onValueChange={handleCustomerChange} 
                            disabled={showNewClientForm}
                        >
                            <SelectTrigger className={`bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 ${showNewClientForm ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                        <Button 
                            className={`mt-1 ${showNewClientForm ? 'bg-[#363636]' : 'bg-[#292929]'} hover:bg-[#363636] text-white border border-[#626262]`}
                            size="icon"
                            onClick={() => {
                                setShowNewClientForm(!showNewClientForm);
                                if (!showNewClientForm) {
                                    setSelectedCustomerId(''); // Clear selected customer when enabling manual input
                                }
                            }}
                        >
                            <PlusIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* New Client Form */}
                    {showNewClientForm && (
                        <div className="space-y-2 mt-2 p-3 border border-[#626262] rounded-md">
                            <Input
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
                                placeholder="Client Name"
                                value={clientInfo.client_name}
                                onChange={(e) => setClientInfo({...clientInfo, client_name: e.target.value})}
                            />
                            <Input
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
                                placeholder="Client Email"
                                type="email"
                                value={clientInfo.client_email}
                                onChange={(e) => setClientInfo({...clientInfo, client_email: e.target.value})}
                            />
                            <Input
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
                                placeholder="Client Address"
                                value={clientInfo.client_address}
                                onChange={(e) => setClientInfo({...clientInfo, client_address: e.target.value})}
                            />
                        </div>
                    )}
                </div>

                {/* Vehicle Information */}
                <div className="flex flex-col gap-4">
                    <label className="text-gray-300 text-sm">Vehicle Information</label>
                    <div className="flex gap-2">
                        <Select 
                            value={selectedVehicleId} 
                            onValueChange={handleVehicleChange}
                            disabled={showNewVehicleForm || showNewClientForm}
                        >
                            <SelectTrigger className={`bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 ${
                                (showNewVehicleForm || showNewClientForm) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}>
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
                        <Button 
                            className={`mt-1 ${showNewVehicleForm ? 'bg-[#363636]' : 'bg-[#292929]'} hover:bg-[#363636] text-white border border-[#626262]`}
                            size="icon"
                            onClick={() => {
                                setShowNewVehicleForm(!showNewVehicleForm);
                                if (!showNewVehicleForm) {
                                    setSelectedVehicleId('');
                                    setVehicleInfo(null);
                                }
                            }}
                        >
                            <PlusIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Manual Vehicle Form */}
                    {showNewVehicleForm && (
                        <div className="space-y-2 mt-2 p-3 border border-[#626262] rounded-md">
                            <Input
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
                                placeholder="Year"
                                value={manualVehicleInfo.year}
                                onChange={(e) => {
                                    setManualVehicleInfo({...manualVehicleInfo, year: e.target.value});
                                    setVehicleInfo({...manualVehicleInfo, year: e.target.value});
                                }}
                            />
                            <Input
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
                                placeholder="Make"
                                value={manualVehicleInfo.make}
                                onChange={(e) => {
                                    setManualVehicleInfo({...manualVehicleInfo, make: e.target.value});
                                    setVehicleInfo({...manualVehicleInfo, make: e.target.value});
                                }}
                            />
                            <Input
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
                                placeholder="Model"
                                value={manualVehicleInfo.model}
                                onChange={(e) => {
                                    setManualVehicleInfo({...manualVehicleInfo, model: e.target.value});
                                    setVehicleInfo({...manualVehicleInfo, model: e.target.value});
                                }}
                            />
                            <Input
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500"
                                placeholder="License Plate"
                                value={manualVehicleInfo.license_plate}
                                onChange={(e) => {
                                    setManualVehicleInfo({...manualVehicleInfo, license_plate: e.target.value});
                                    setVehicleInfo({...manualVehicleInfo, license_plate: e.target.value});
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Invoice date */}
                <div className="flex flex-col gap-4">
                    <label className="text-gray-300 text-sm">Invoice Date</label>
                    <Input
                        className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        max={formattedDate}
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
                            required
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