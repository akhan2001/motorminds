import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getShopInfo } from "@/utils/supabase/supabase-shop";
import { getCustomers, getCustomerVehicles } from "@/app/customers/api/customer-utils";
import { Button } from "@/components/ui/button";
import { createNewInvoice } from "@/app/invoices/utils/invoice-utils";
import { formatPhoneNumber } from "@/utils/format-phone";
import { createNewCustomer } from "@/app/customers/api/customer-utils";
import { getShopStaffNames } from "@/utils/shopinfo/getShopInfo";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceLineItems } from "./form-sections/InvoiceLineItems";
import { MinusIcon, PlusIcon, X, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CustomerInformation } from "@/app/(features)/operations/components/work-orders/shared/customer-information";
import { VehicleInformation } from "@/app/(features)/operations/components/work-orders/shared/vehicle-information";

export default function InvoiceForm({ 
    onClose, 
    shopId, 
    isOpen, 
    onInvoiceCreated
}: { 
    onClose: () => void, 
    shopId: string, 
    isOpen: boolean,
    onInvoiceCreated?: () => void
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

    // New state for CustomerInformation and VehicleInformation components
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    
    const [selectedVehicleId, setSelectedVehicleId] = useState("");
    const [vehicleId, setVehicleId] = useState("");
    const [vehicleYear, setVehicleYear] = useState("");
    const [vehicleMake, setVehicleMake] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [vehicleColor, setVehicleColor] = useState("");
    const [vehicleVin, setVehicleVin] = useState("");
    const [vehicleLicensePlate, setVehicleLicensePlate] = useState("");
    const [vehicleMileage, setVehicleMileage] = useState("");
    const [poNumber, setPoNumber] = useState("");

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

    // Handlers for CustomerInformation component
    const handleCustomerFieldChange = (field: string, value: string) => {
        switch (field) {
            case 'customer':
                setCustomerName(value);
                break;
            case 'customerEmail':
                setCustomerEmail(value);
                break;
            case 'customerPhone':
                setCustomerPhone(value);
                break;
            case 'customerAddress':
                setCustomerAddress(value);
                break;
        }
    };

    const handleCustomerChange = (newCustomerId: string) => {
        setCustomerId(newCustomerId);
        if (newCustomerId === "new") {
            setShowNewClientForm(true);
        } else {
            setShowNewClientForm(false);
        }
    };

    const handleCustomerSaved = (newCustomerId: string, customerData: any) => {
        setCustomerId(newCustomerId);
        setCustomerName(customerData.name);
        setCustomerEmail(customerData.email || '');
        setCustomerPhone(customerData.phone || '');
        setCustomerAddress(customerData.address || '');
        setShowNewClientForm(false);
    };

    // Handlers for VehicleInformation component
    const handleVehicleFieldChange = (field: string, value: string) => {
        switch (field) {
            case 'vehicleYear':
                setVehicleYear(value);
                break;
            case 'vehicleMake':
                setVehicleMake(value);
                break;
            case 'vehicleModel':
                setVehicleModel(value);
                break;
            case 'vehicleColor':
                setVehicleColor(value);
                break;
            case 'vehicleVin':
                setVehicleVin(value);
                break;
            case 'vehicleLicensePlate':
                setVehicleLicensePlate(value);
                break;
            case 'vehicleMileage':
                setVehicleMileage(value);
                break;
        }
    };

    const handleVehicleSelect = (newVehicleId: string, vehicleData?: any) => {
        setSelectedVehicleId(newVehicleId);
        if (newVehicleId === "new") {
            setShowNewVehicleForm(true);
        } else {
            setShowNewVehicleForm(false);
            if (vehicleData) {
                setVehicleId(vehicleData.id);
                setVehicleYear(vehicleData.year?.toString() || '');
                setVehicleMake(vehicleData.make || '');
                setVehicleModel(vehicleData.model || '');
                setVehicleColor(vehicleData.color || '');
                setVehicleVin(vehicleData.vin || '');
                setVehicleLicensePlate(vehicleData.licensePlate || '');
                setVehicleMileage(vehicleData.mileage || '');
            }
        }
    };

    const handleVehicleSaved = (newVehicleId: string, vehicleData: any) => {
        setVehicleId(newVehicleId);
        setSelectedVehicleId(newVehicleId);
        setVehicleYear(vehicleData.year?.toString() || '');
        setVehicleMake(vehicleData.make || '');
        setVehicleModel(vehicleData.model || '');
        setVehicleColor(vehicleData.color || '');
        setVehicleVin(vehicleData.vin || '');
        setVehicleLicensePlate(vehicleData.licensePlate || '');
        setVehicleMileage(vehicleData.mileage || '');
        setShowNewVehicleForm(false);
    };

    const validateForm = () => {
        if (!shopId) {
            toast.error("Shop ID is required");
            return false;
        }
        
        // Check customer information from new component state
        if (!customerName.trim()) {
            toast.error("Please enter customer name");
            return false;
        }
        
        if (!customerPhone.trim()) {
            toast.error("Please enter customer phone number");
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
        
        // if (!total || isNaN(parseFloat(total)) || parseFloat(total) <= 0) {
        //     toast.error("Please enter a valid total amount");
        //     return false;
        // }

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
        if (isOpen) {
            resetFormValues();
        }
    }, [isOpen]);

    // Update handleSave to handle both create and edit
    const handleSave = async () => {
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            // Create the invoice data structure
            const invoiceData = {
                shop_id: shopId,
                shop_name: shopName || "Unknown Shop",
                shop_address: shopAddress || "",
                shop_email: shopEmail || "",
                shop_phone: shopPhone || "",
                // Client info...
                client_name: customerName || "Unknown Client",
                client_address: customerAddress || "",
                client_email: customerEmail || "",
                client_phone: customerPhone || "",
                customer_id: customerId && customerId !== "new" ? customerId : null, // Include customer_id when using existing customer
                // Invoice details...
                issue_date: invoiceDate || new Date().toISOString(),
                notes: notes || "",
                mileage: mileage || "",
                description: description || "",
                assigned_to: assignedTo || "",
                amount: parseFloat(total) || 0,
                // For edit mode, keep existing status; for create mode, set to "UNPAID"
                status: "UNPAID",
                vehicle_info: {
                    year: vehicleYear,
                    make: vehicleMake,
                    model: vehicleModel,
                    license_plate: vehicleLicensePlate,
                    color: vehicleColor,
                    vin: vehicleVin,
                    mileage: vehicleMileage
                },
                po_number: poNumber,
                // Add the new arrays
                labour_items: labourItems.map(item => ({
                    description: item.description,
                    cost: parseFloat(item.cost) || 0
                })),
                parts_items: partsItems.map(item => ({
                    description: item.description,
                    cost: parseFloat(item.cost) || 0,
                    shop_cost: parseFloat(item.shop_cost || "0") || 0,
                    quantity: parseInt(item.quantity || "1", 10)
                }))
            };
            
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
            toast.error(`Failed to create invoice: ${(error as Error).message || "Unknown error"}`);
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
        
        // Reset new component state
        setCustomerId("");
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setCustomerAddress("");
        setVehicleId("");
        setVehicleYear("");
        setVehicleMake("");
        setVehicleModel("");
        setVehicleColor("");
        setVehicleVin("");
        setVehicleLicensePlate("");
        setVehicleMileage("");
        setPoNumber("");
        
        toast.success("Form cleared");
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent className="bg-white dark:bg-card text-foreground border border-border rounded-lg shadow-lg p-0 max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[75vw] md:max-w-[65vw] flex flex-col">
                {/* Sticky Header */}
                <DialogHeader className="sticky top-0 bg-slate-50 dark:bg-card z-10 p-4 sm:p-6 border-b border-border rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-foreground text-xl sm:text-2xl">
                                Create New Invoice
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
                                Fill in the details below to create a new invoice.
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                    {/* Shop information */}
                    <h3 className="text-lg font-medium pl-6 text-foreground">Shop Information</h3>
                    <div className="space-y-4 bg-slate-50 dark:bg-card rounded-xl px-6 py-4 border border-border">
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="shopName" className="text-foreground">Shop Name</Label>
                            <Input
                                id="shopName"
                                value={shopName}
                                disabled
                                className="bg-white dark:bg-card text-foreground border-border"
                            />
                        </div>
                        <div>
                            <Label htmlFor="shopAddress" className="text-foreground">Address</Label>
                            <Input
                                id="shopAddress"
                                value={shopAddress}
                                disabled
                                className="bg-white dark:bg-card text-foreground border-border"
                            />
                        </div>
                        <div>
                            <Label htmlFor="shopEmail" className="text-foreground">Email</Label>
                            <Input
                                id="shopEmail"
                                value={shopEmail}
                                disabled
                                className="bg-white dark:bg-card text-foreground border-border"
                            />
                        </div>
                        <div>
                            <Label htmlFor="shopPhone" className="text-foreground">Phone</Label>
                            <Input
                                id="shopPhone"
                                value={formatPhoneNumber(shopPhone)}
                                disabled
                                className="bg-white dark:bg-card text-foreground border-border"
                            />
                        </div>
                    </div>
                    </div>
       
                    {/* Customer Information */}
                    <CustomerInformation
                        customerId={customerId}
                        customerName={customerName}
                        customerEmail={customerEmail}
                        customerPhone={customerPhone}
                        customerAddress={customerAddress}
                        isEditing={true}
                        isCreating={true}
                        onFieldChange={handleCustomerFieldChange}
                        onCustomerChange={handleCustomerChange}
                        onCustomerSaved={handleCustomerSaved}
                    />

                    {/* Vehicle Information */}
                    <VehicleInformation
                        customerId={customerId}
                        selectedVehicleId={selectedVehicleId}
                        vehicleId={vehicleId}
                        vehicleYear={vehicleYear}
                        vehicleMake={vehicleMake}
                        vehicleModel={vehicleModel}
                        vehicleColor={vehicleColor}
                        vehicleVin={vehicleVin}
                        vehicleLicensePlate={vehicleLicensePlate}
                        vehicleMileage={vehicleMileage}
                        isEditing={true}
                        isCreating={true}
                        onFieldChange={handleVehicleFieldChange}
                        onVehicleSelect={handleVehicleSelect}
                        onVehicleSaved={handleVehicleSaved}
                    />

                    {/* Invoice date
                    <div className="space-y-2 bg-[#1A1A1A] rounded-xl p-6">
                    </div> */}

                    {/* Invoice details */}
                    <h3 className="text-lg font-medium pl-6 text-foreground">Invoice Details</h3>
                    <div className="space-y-3 bg-slate-50 dark:bg-card rounded-xl p-6 border border-border">
                        <label className="text-muted-foreground text-sm font-medium mb-1 block">Invoice Date</label>
                        <Input
                            className="bg-white dark:bg-card text-foreground text-sm border-border focus:ring-red-600 dark:focus:ring-red-500"
                            type="date"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                            max={formattedDate}
                        />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-3">
                            <label className="text-muted-foreground text-sm self-center sm:col-span-1">Title</label>
                            <div className="sm:col-span-3">
                                <Input
                                    className="bg-white dark:bg-card text-foreground text-sm border-border focus:ring-red-600 dark:focus:ring-red-500 w-full"
                                    placeholder="Enter a title for the invoice"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <label className="text-muted-foreground text-sm self-center sm:col-span-1">PO Number</label>
                            <div className="sm:col-span-3">
                                <Input
                                    className="bg-white dark:bg-card text-foreground text-sm border-border focus:ring-red-600 dark:focus:ring-red-500 w-full"
                                    placeholder="Enter PO number (optional)"
                                    value={poNumber}
                                    onChange={(e) => setPoNumber(e.target.value)}
                                />
                            </div>
                            
                            <label className="text-muted-foreground text-sm self-start sm:self-center sm:col-span-1 mt-1 sm:mt-0">Labour</label>
                            <InvoiceLineItems
                                title="Labour"
                                items={labourItems}
                                onItemsChange={setLabourItems}
                            />

                            <label className="text-muted-foreground text-sm self-center sm:col-span-1">Assigned To</label>
                            <div className="sm:col-span-3">
                                <Select
                                    value={assignedTo}
                                    onValueChange={handleAssignedToChange}
                                >
                                    <SelectTrigger className="bg-white dark:bg-card border-border text-foreground w-full">
                                        <SelectValue placeholder="Select a staff member" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-card border-border text-foreground">
                                        <SelectItem value="none">
                                            Unassigned
                                        </SelectItem>
                                        {staffNames.map((staff) => (
                                            <SelectItem key={staff.id} value={staff.full_name}>
                                                {staff.full_name} <span className="text-muted-foreground text-xs">({staff.role})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <label className="text-muted-foreground text-sm self-start sm:self-center sm:col-span-1 mt-1 sm:mt-0">Parts</label>
                            <InvoiceLineItems
                                title="Parts"
                                items={partsItems}
                                onItemsChange={setPartsItems}
                            />

                            <label className="text-muted-foreground text-sm self-center sm:col-span-1">Notes</label>
                            <div className="sm:col-span-3">
                                <Textarea
                                    className="bg-white dark:bg-card text-foreground text-sm border-border focus:ring-red-600 dark:focus:ring-red-500 w-full"
                                    placeholder="Enter any notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            
                            <label className="text-muted-foreground text-sm self-center sm:col-span-1">Total Amount</label>
                            <div className="flex flex-col gap-1 items-start sm:col-span-3">
                                <div className="flex flex-row justify-between w-full">
                                    <span className="text-foreground text-base font-medium">Subtotal:</span>
                                    <span className="text-foreground text-base font-medium">$ {parseFloat(total).toFixed(2)}</span>
                                </div>
                                <div className="flex flex-row justify-between w-full">
                                    <span className="text-muted-foreground text-sm">Tax (13%):</span>
                                    <span className="text-foreground text-sm">$ {(parseFloat(total) * 0.13).toFixed(2)}</span>
                                </div>
                                <div className="flex flex-row justify-between w-full border-t border-border pt-1 mt-1">
                                    <span className="text-foreground text-xl font-medium">Total:</span>
                                    <span className="text-green-600 dark:text-green-400 text-xl">$ {(parseFloat(total) + (parseFloat(total) * 0.13)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                
                <DialogFooter className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:justify-between w-full px-6 py-4 bg-slate-50 dark:bg-card border-t border-border">
                    <Button 
                        variant="outline" 
                        onClick={resetFormValues} 
                        className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground w-full sm:w-auto order-3 sm:order-1"
                    >
                        Clear Form
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto order-1 sm:order-2">
                        <Button 
                            variant="outline" 
                            onClick={onClose} 
                            className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground w-full sm:w-auto order-2 sm:order-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto order-1 sm:order-2" 
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