import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getShopInfo } from "@/utils/supabase/supabase-shop";
import { getCustomers, getCustomerVehicles } from "@/app/customers/api/customer-utils";
import { Button } from "@/components/ui/button";
import { updateInvoice, formatPhoneNumber } from "@/app/invoices/utils/invoice-utils";
import { getShopStaffNames } from "@/utils/shopinfo/getShopInfo";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceLineItems } from "./form-sections/InvoiceLineItems";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function EditInvoiceForm({ 
    onClose, 
    shopId, 
    isOpen, 
    onInvoiceUpdated,
    existingInvoice
}: { 
    onClose: () => void, 
    shopId: string, 
    isOpen: boolean,
    onInvoiceUpdated?: () => void,
    existingInvoice: any
}) {
    // Form state
    const [shopName, setShopName] = useState("");
    const [shopAddress, setShopAddress] = useState("");
    const [shopEmail, setShopEmail] = useState("");
    const [shopPhone, setShopPhone] = useState("");
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerVehicles, setCustomerVehicles] = useState<any[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState("");
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const [invoiceDate, setInvoiceDate] = useState(formattedDate);
    const [labour, setLabour] = useState("");
    const [labourCost, setLabourCost] = useState("0");
    const [parts, setParts] = useState("");
    const [partsCost, setPartsCost] = useState("0");
    
    // New state for multiple items
    const [labourItems, setLabourItems] = useState<{id: string, description: string, cost: string, shop_cost?: string}[]>([]);
    const [partsItems, setPartsItems] = useState<{id: string, description: string, cost: string, shop_cost?: string, quantity?: string}[]>([]);
    const [notes, setNotes] = useState("");
    const [mileage, setMileage] = useState("");
    const [description, setDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [total, setTotal] = useState("");
    const [vehicleInfo, setVehicleInfo] = useState<any>(null); //jsonb field
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [staffNames, setStaffNames] = useState<{id: string, full_name: string, role: string}[]>([]);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [clientInfo, setClientInfo] = useState({
        client_name: '',
        client_phone: '',
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

    // Pre-fill form with existing invoice data
    useEffect(() => {
        if (existingInvoice && isOpen) {
            console.log("Pre-filling form with existing invoice:", existingInvoice);
            
            // Basic invoice fields
            setInvoiceDate(existingInvoice.issueDate ? existingInvoice.issueDate.split('T')[0] : formattedDate);
            setDescription(existingInvoice.description || "");
            setNotes(existingInvoice.notes || "");
            setMileage(existingInvoice.mileage || "");
            setAssignedTo(existingInvoice.assignedTo || "");
            setTotal(existingInvoice.amount?.toString() || "0");
            
            // Vehicle info
            if (existingInvoice.vehicleInfo) {
                setVehicleInfo(existingInvoice.vehicleInfo);
                setManualVehicleInfo({
                    year: existingInvoice.vehicleInfo.year || '',
                    make: existingInvoice.vehicleInfo.make || '',
                    model: existingInvoice.vehicleInfo.model || '',
                    license_plate: existingInvoice.vehicleInfo.license_plate || ''
                });
            }
            
            // Client info (set manual form if not from existing customer)
            setClientInfo({
                client_name: existingInvoice.clientName || '',
                client_phone: existingInvoice.clientPhone || '',
                client_address: existingInvoice.clientAddress || '',
                client_email: existingInvoice.clientEmail || ''
            });
            
            // Labour items - convert from existing data
            if (existingInvoice.labour_items && existingInvoice.labour_items.length > 0) {
                const formattedLabourItems = existingInvoice.labour_items.map((item: any) => ({
                    id: uuidv4(),
                    description: item.description || '',
                    cost: item.cost?.toString() || '0',
                    shop_cost: item.shop_cost?.toString() || '0'
                }));
                setLabourItems(formattedLabourItems);
            } else if (existingInvoice.labour) {
                // Fallback to single labour entry
                setLabourItems([{
                    id: uuidv4(),
                    description: existingInvoice.labour,
                    cost: existingInvoice.labour_total_price?.toString() || '0',
                    shop_cost: '0'
                }]);
            }
            
            // Parts items - convert from existing data
            if (existingInvoice.parts_items && existingInvoice.parts_items.length > 0) {
                const formattedPartsItems = existingInvoice.parts_items.map((item: any) => ({
                    id: uuidv4(),
                    description: item.description || '',
                    cost: item.cost?.toString() || '0',
                    shop_cost: item.shop_cost?.toString() || '0',
                    quantity: item.quantity?.toString() || '1'
                }));
                setPartsItems(formattedPartsItems);
            } else if (existingInvoice.parts) {
                // Fallback to single parts entry
                setPartsItems([{
                    id: uuidv4(),
                    description: existingInvoice.parts,
                    cost: existingInvoice.parts_total_price?.toString() || '0',
                    shop_cost: '0',
                    quantity: '1'
                }]);
            }
            
            // Show manual forms for editing
            setShowNewClientForm(true);
            setShowNewVehicleForm(true);
        }
    }, [existingInvoice, isOpen]);

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
                    setShopPhone(shopInfo.shop_phone || "");
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

    useEffect(() => {
        calculateTotal();
    }, [labourItems, partsItems]);

    const calculateTotal = () => {
        const labourItemsTotal = labourItems.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
        const partsItemsTotal = partsItems.reduce((sum, item) => {
            const price = parseFloat(item.cost) || 0;
            const quantity = parseInt(item.quantity || '1', 10);
            return sum + (price * quantity);
        }, 0);
        
        const subtotal = labourItemsTotal + partsItemsTotal;
        setTotal(subtotal.toFixed(2));
    };

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
        if (!shopId) {
            toast.error("Shop ID is required");
            return false;
        }
        
        if (!invoiceDate) {
            toast.error("Please select an invoice date");
            return false;
        }

        if (!description) {
            toast.error("Please enter a title");
            return false;
        }
        
        if (!clientInfo.client_name) {
            toast.error("Please enter client name");
            return false;
        }

        if (!labourCost || isNaN(parseFloat(labourCost)) || parseFloat(labourCost) < 0) {
            toast.error("Labour cost cannot be negative");
            return false;
        }

        if (!partsCost || isNaN(parseFloat(partsCost)) || parseFloat(partsCost) < 0) {
            toast.error("Parts cost cannot be negative");
            return false;
        }
        
        return true;
    };

    const handleAssignedToChange = (value: string) => {
        setAssignedTo(value);
    };

    useEffect(() => {
        if (isOpen && !existingInvoice) {
            resetFormValues();
            }
    }, [isOpen]);

    // Update handleSave to handle edit mode
    const handleSave = async () => {
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            // Create the invoice data structure
            const invoiceData = {
                invoice_number: existingInvoice.invoiceNumber, // Keep the same invoice number for edit
                shop_id: shopId,
                shop_name: shopName || "Unknown Shop",
                shop_address: shopAddress || "",
                shop_email: shopEmail || "",
                shop_phone: shopPhone || "",
                // Client info from manual form...
                client_name: clientInfo.client_name,
                client_address: clientInfo.client_address,
                client_email: clientInfo.client_email,
                client_phone: clientInfo.client_phone,
                // Invoice details...
                issue_date: invoiceDate || new Date().toISOString(),
                notes: notes || "",
                mileage: mileage || "",
                description: description || "",
                assigned_to: assignedTo || "",
                amount: parseFloat(total) || 0,
                status: existingInvoice.status, // Keep existing status
                vehicle_information: vehicleInfo,
                // Add the new arrays
                labour_items: labourItems.map(item => ({
                    description: item.description,
                    cost: parseFloat(item.cost) || 0,
                    shop_cost: parseFloat(item.shop_cost || "0") || 0
                })),
                parts_items: partsItems.map(item => ({
                    description: item.description,
                    cost: parseFloat(item.cost) || 0,
                    shop_cost: parseFloat(item.shop_cost || "0") || 0,
                    quantity: parseInt(item.quantity || "1", 10)
                })),
                labour_total_price: labourItems.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0),
                parts_total_price: partsItems.reduce((sum, item) => {
                    const price = parseFloat(item.cost) || 0;
                    const quantity = parseInt(item.quantity || '1', 10);
                    return sum + (price * quantity);
                }, 0)
            };
            
            const result = await updateInvoice(existingInvoice.invoiceNumber, invoiceData, shopId);
            if (result) {
                toast.success("Invoice updated successfully");
                if (onInvoiceUpdated) {
                    onInvoiceUpdated();
                }
                onClose();
            } else {
                toast.error("Failed to update invoice");
            }
        } catch (error) {
            console.error("Error updating invoice:", error);
            toast.error(`Failed to update invoice: ${(error as Error).message || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to reset all form values
    const resetFormValues = () => {
        setSelectedCustomerId("");
        setSelectedCustomer(null);
        setSelectedVehicleId("");
        setVehicleInfo(null);
        setInvoiceDate(formattedDate);
        setLabourItems([]);
        setPartsItems([]);
        setNotes("");
        setMileage("");
        setDescription("");
        setAssignedTo("");
        setTotal("0.00");
        setShowNewClientForm(false);
        setShowNewVehicleForm(false);
        setClientInfo({
            client_name: '',
            client_phone: '',
            client_address: '',
            client_email: ''
        });
        setManualVehicleInfo({
            year: '',
            make: '',
            model: '',
            license_plate: ''
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-0 max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[75vw] md:max-w-[65vw] flex flex-col">
                {/* Sticky Header */}
                <DialogHeader className="sticky top-0 bg-[#131313] z-10 p-4 sm:p-6 border-b border-[#222222] rounded-t-lg">
                    <DialogTitle className="text-white text-xl sm:text-2xl">
                        Edit Invoice #{existingInvoice?.displayNumber}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-xs sm:text-sm">
                        Update the details below to edit this invoice.
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                    {/* Shop information */}
                    <h3 className="text-lg font-medium pl-6">Shop Information</h3>
                    <div className="space-y-4 bg-[#1A1A1A] rounded-xl px-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="shopName">Shop Name</Label>
                            <Input
                                id="shopName"
                                value={shopName}
                                disabled
                            />
                        </div>
                        <div>
                            <Label htmlFor="shopAddress">Address</Label>
                            <Input
                                id="shopAddress"
                                value={shopAddress}
                                disabled
                            />
                        </div>
                        <div>
                            <Label htmlFor="shopEmail">Email</Label>
                            <Input
                                id="shopEmail"
                                value={shopEmail}
                                disabled
                            />
                        </div>
                        <div>
                            <Label htmlFor="shopPhone">Phone</Label>
                            <Input
                                id="shopPhone"
                                value={formatPhoneNumber(shopPhone)}
                                disabled
                            />
                        </div>
                    </div>
                    </div>
       
                    <h3 className="text-lg font-medium pl-6">Client & Vehicle Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1A1A1A] rounded-xl p-6">
                        {/* Customer selection */}
                        <div className="space-y-2 ">
                            <label className="text-gray-300 text-sm font-medium mb-1 block">Customer Information</label>
                            <div className="flex flex-wrap gap-2">
                                <div className="w-full sm:w-auto sm:flex-1">
                                    <Select 
                                        value={selectedCustomerId} 
                                        onValueChange={handleCustomerChange} 
                                        disabled={showNewClientForm}
                                    >
                                        <SelectTrigger className={`bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 ${showNewClientForm ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <SelectValue placeholder="Select a customer" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.customer_name} <span className="text-gray-400 text-xs">{formatPhoneNumber(customer.customer_phone)}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button 
                                    className={`${showNewClientForm ? 'bg-[#363636]' : 'bg-[#292929]'} hover:bg-[#363636] text-white border border-[#626262] h-10 w-10 p-0 sm:h-10 sm:w-10`}
                                    onClick={() => {
                                        setShowNewClientForm(!showNewClientForm);
                                        if (!showNewClientForm) {
                                            setSelectedCustomerId(''); // Clear selected customer when enabling manual input
                                        }
                                    }}
                                >
                                    {showNewClientForm ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                                </Button>
                            </div>

                            {/* Client Form - Always shown in edit mode */}
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
                                        placeholder="Client Phone"
                                        value={clientInfo.client_phone}
                                        onChange={(e) => setClientInfo({...clientInfo, client_phone: e.target.value})}
                                        required
                                        pattern="\d{10}"                                    
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
                        <div className="space-y-2">
                            <label className="text-gray-300 text-sm font-medium mb-1 block">Vehicle Information</label>
                            <div className="flex flex-wrap gap-2">
                                <div className="w-full sm:w-auto sm:flex-1">
                                    <Select 
                                        value={selectedVehicleId} 
                                        onValueChange={handleVehicleChange}
                                        disabled={showNewVehicleForm || showNewClientForm}
                                    >
                                        <SelectTrigger className={`bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 ${
                                            (showNewVehicleForm || showNewClientForm) ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}>
                                            <SelectValue placeholder="Select a vehicle" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                            {customerVehicles.map((vehicle) => (
                                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                                    {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.license_plate===null || vehicle.license_plate==="NULL" ? <span className="text-gray-400 text-xs">(No License Plate)</span> : <span className="text-gray-400 text-xs">({vehicle.license_plate})</span>}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button 
                                    className={`${showNewVehicleForm ? 'bg-[#363636]' : 'bg-[#292929]'} hover:bg-[#363636] text-white border border-[#626262] h-10 w-10 p-0 sm:h-10 sm:w-10`}
                                    onClick={() => {
                                        setShowNewVehicleForm(!showNewVehicleForm);
                                        if (!showNewVehicleForm) {
                                            setSelectedVehicleId('');
                                            setVehicleInfo(null);
                                        }
                                    }}
                                >
                                    {showNewVehicleForm ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                                </Button>
                            </div>

                            {/* Vehicle Form - Always shown in edit mode */}
                            {showNewVehicleForm && (
                                <div className="space-y-2 mt-2 p-3 border border-[#626262] rounded-md">
                                    <div className="grid grid-cols-1 gap-2">
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
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invoice details */}
                    <h3 className="text-lg font-medium pl-6">Invoice Details</h3>
                    <div className="space-y-3 bg-[#1A1A1A] rounded-xl p-6">
                        <label className="text-gray-300 text-sm font-medium mb-1 block">Invoice Date</label>
                        <Input
                            className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500"
                            type="date"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                            max={formattedDate}
                        />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-3">
                            <label className="text-gray-300 text-sm self-center sm:col-span-1">Title</label>
                            <div className="sm:col-span-3">
                                <Input
                                    className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                    placeholder="Enter a title for the invoice"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <label className="text-gray-300 text-sm self-start sm:self-center sm:col-span-1 mt-1 sm:mt-0">Labour</label>
                            <InvoiceLineItems
                                title="Labour"
                                items={labourItems}
                                onItemsChange={setLabourItems}
                            />

                            <label className="text-gray-300 text-sm self-center sm:col-span-1">Assigned To</label>
                            <div className="sm:col-span-3">
                                <Select
                                    value={assignedTo}
                                    onValueChange={handleAssignedToChange}
                                >
                                    <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white w-full">
                                        <SelectValue placeholder="Select a staff member" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                                        <SelectItem value="none">
                                            Unassigned
                                        </SelectItem>
                                        {staffNames.map((staff) => (
                                            <SelectItem key={staff.id} value={staff.full_name}>
                                                {staff.full_name} <span className="text-gray-400 text-xs">({staff.role})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <label className="text-gray-300 text-sm self-start sm:self-center sm:col-span-1 mt-1 sm:mt-0">Parts</label>
                            <InvoiceLineItems
                                title="Parts"
                                items={partsItems}
                                onItemsChange={setPartsItems}
                            />

                            <label className="text-gray-300 text-sm self-center sm:col-span-1">Notes</label>
                            <div className="sm:col-span-3">
                                <Textarea
                                    className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                    placeholder="Enter any notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            
                            <label className="text-gray-300 text-sm self-center sm:col-span-1">Total Amount</label>
                            <div className="flex flex-col gap-1 items-start sm:col-span-3">
                                <div className="flex flex-row justify-between w-full">
                                    <span className="text-white text-base font-medium">Subtotal:</span>
                                    <span className="text-white text-base font-medium">$ {parseFloat(total).toFixed(2)}</span>
                                </div>
                                <div className="flex flex-row justify-between w-full">
                                    <span className="text-gray-400 text-sm">Tax (13%):</span>
                                    <span className="text-gray-300 text-sm">$ {(parseFloat(total) * 0.13).toFixed(2)}</span>
                                </div>
                                <div className="flex flex-row justify-between w-full border-t border-[#333] pt-1 mt-1">
                                    <span className="text-white text-xl font-medium">Total:</span>
                                    <span className="text-white text-xl">$ {(parseFloat(total) + (parseFloat(total) * 0.13)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                
                <DialogFooter className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:justify-between w-full px-6 py-4">
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
                            {isSubmitting ? "Updating..." : "Update Invoice"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}