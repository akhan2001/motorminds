import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { updateCustomer, deleteCustomer, deleteCustomerVehicle, sendEmail } from "../api/customer-utils"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getCustomerVehicles, createCustomerVehicle } from "../api/customer-utils"
import { Car, Plus, Minus, Mail, ArrowUpRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { EmailDialog } from "./email-dialog"
import { useRouter } from "next/navigation"
import { CustomerVehicleDialog } from "./customer-vehicle-dialog"
import { ConfirmationProvider, useConfirmation } from "@/app/components/confirmation-service"

interface CustomerSheetProps {
    customer: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCustomerUpdated: () => void;
}

interface Vehicle {
    year: string;
    make: string;
    model: string;
    color: string;
    vin: string;
    engine: string;
}

export function CustomerSheet({ customer, isOpen, onOpenChange, onCustomerUpdated }: CustomerSheetProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [customerVehicles, setCustomerVehicles] = useState<any[]>([]);
    const [editedCustomer, setEditedCustomer] = useState({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: ""
    });
    const [editedVehicle, setEditedVehicle] = useState({
        customerYear: "",
        customerMake: "",
        customerModel: "",
        customerColor: "",
        customerVin: ""
    });
    const [isAddingVehicle, setIsAddingVehicle] = useState(false);
    const [isDeletingVehicle, setIsDeletingVehicle] = useState<string | null>(null);
    const [newVehicle, setNewVehicle] = useState({
        year: "",
        make: "",
        model: "",
        color: "",
        vin: "",
        engine: ""
    });
    const [emailToSend, setEmailToSend] = useState("");
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const router = useRouter();

    // Reset form and states when sheet opens/closes
    useEffect(() => {
        if (isOpen) {
            setEditedCustomer({
                customerName: customer?.customer_name || "",
                customerEmail: customer?.customer_email || "",
                customerPhone: customer?.customer_phone || "",
                customerAddress: customer?.customer_address || ""
            });
            setIsEditing(false);
        }
    }, [isOpen, customer]);

    // Fetch vehicles when customer changes or sheet opens
    useEffect(() => {
        if (isOpen && customer?.id) {
            const fetchVehicles = async () => {
                const vehicles = await getCustomerVehicles(customer.id);
                setCustomerVehicles(vehicles);
            };
            fetchVehicles();
        }
    }, [customer?.id, isOpen]);

    const handleSheetOpenChange = (open: boolean) => {
        if (!open) {
            setIsEditing(false);
            setIsDeleting(false);
            setIsDeletingVehicle(null);
        }
        onOpenChange(open);
    };

    const handleAddVehicle = async (vehicle: Vehicle) => {
        try {
            const addedVehicle = await createCustomerVehicle(customer.id, {
                year: vehicle.year,
                make: vehicle.make,
                model: vehicle.model,
                color: vehicle.color || null,
                vin: vehicle.vin || null,
                engine: vehicle.engine || null
            });

            if (addedVehicle) {
                toast.success("Vehicle added successfully");
                setIsAddingVehicle(false);
                // Refresh vehicles list
                const vehicles = await getCustomerVehicles(customer.id);
                setCustomerVehicles(vehicles);
            } else {
                toast.error("Failed to add vehicle");
            }
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Error adding vehicle");
            }
            console.error("Error adding vehicle:", error);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditedCustomer({
            customerName: customer.customer_name,
            customerEmail: customer.customer_email,
            customerPhone: customer.customer_phone,
            customerAddress: customer.customer_address
        });
        setIsEditing(false);
    };

    const handleSave = async () => {
        // Basic validation
        if (!editedCustomer.customerName.trim()) {
            toast.error("Customer name is required");
            return;
        }

        // Email validation
        if (editedCustomer.customerEmail && !editedCustomer.customerEmail.includes('@')) {
            toast.error("Please enter a valid email address");
            return;
        }

        // Phone validation - ensure it's not null or empty
        if (!editedCustomer.customerPhone?.trim()) {
            toast.error("Phone number is required");
            return;
        }

        const updated = await updateCustomer(customer.id, {
            ...editedCustomer,
            customerPhone: editedCustomer.customerPhone.trim() || '' // Ensure we never send null
        });
        
        if (updated) {
            toast.success("Customer updated successfully");
            setIsEditing(false);
            onCustomerUpdated();
        } else {
            toast.error("Failed to update customer. Please try again.");
        }
    };

    const handleDelete = async () => {
        try {
            if (!customer?.id || !customer?.shop_id) {
                toast.error("Invalid customer or shop ID");
                setIsDeleting(false);
                return;
            }

            console.log("Removing customer from shop:", customer.id);
            await deleteCustomer(customer.id, customer.shop_id);
            
            toast.success("Removed customer from shop");
            onOpenChange(false);
            onCustomerUpdated();
            
        } catch (error) {
            console.error("Error in handleDelete:", error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred while removing the customer");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteVehicle = async (vehicleId: string) => {
        try {
            const deleted = await deleteCustomerVehicle(vehicleId);
            if (deleted) {
                toast.success("Vehicle deleted successfully");
                // Refresh vehicles list
                const vehicles = await getCustomerVehicles(customer.id);
                setCustomerVehicles(vehicles);
            } else {
                toast.error("Failed to delete vehicle");
            }
        } catch (error) {
            if (error instanceof Error && error.message === 'Vehicle is in use') {
                toast.error("Vehicle is currently in an open work order. Please close the work order before deleting the vehicle.");
            } else {
                toast.error("Error deleting vehicle");
            }
            console.error("Error deleting vehicle:", error);
        }
        setIsDeletingVehicle(null);
    };

    const openSendEmailDialog = (email: string) => {
        if (!email) {
            toast.error("No email address provided");
            return;
        }

        setEmailToSend(email);
        setIsSendingEmail(true);
    };
    
    if (!customer) return null;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
                <SheetContent className="bg-[#131313] text-white border-l-1 border-l-[#222] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-white">
                            {customer.customer_name}
                        </SheetTitle>
                        <SheetDescription className="text-gray-400">
                            View and edit customer details
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-4 py-4">
                        <Button
                            variant="outline" 
                            className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white w-full"
                            onClick={() => router.push(`/customers/${customer.id}`)}
                        >
                            View Full Customer Profile
                            <ArrowUpRight className="w-3 h-3" />
                        </Button>
                        <Separator className="bg-[#666]"/>
                        <h2 className="text-lg font-semibold text-gray-300">Customer Information</h2>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-left text-gray-300">
                                Name
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="name"
                                    value={editedCustomer.customerName}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, customerName: e.target.value })}
                                    className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                    readOnly={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-left text-gray-300">
                                Email
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Input 
                                    id="email" 
                                    value={editedCustomer.customerEmail}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, customerEmail: e.target.value })}
                                    className="flex-1 bg-[#292929] text-white border-[#626262]"
                                    readOnly={!isEditing}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border border-[#626262] hover:border-red-500 text-gray-400 hover:text-red-500 hover:bg-red-500/10 flex-shrink-0"
                                    onClick={() => openSendEmailDialog(editedCustomer.customerEmail)}
                                >
                                    <Mail className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-left text-gray-300">
                                Phone *
                            </Label>
                            <Input
                                id="phone"
                                value={editedCustomer.customerPhone}
                                onChange={(e) => setEditedCustomer({ ...editedCustomer, customerPhone: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                readOnly={!isEditing}
                                required
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-left text-gray-300">
                                Address
                            </Label>
                            <Input
                                id="address"
                                value={editedCustomer.customerAddress}
                                onChange={(e) => setEditedCustomer({ ...editedCustomer, customerAddress: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                readOnly={!isEditing}
                            />
                        </div>

                        <Separator className="bg-[#666]"/>

                        <h2 className="text-lg font-semibold text-gray-300">Customer Vehicles</h2>                        
                        {customerVehicles.map((vehicle) => (
                            <Card 
                                key={vehicle.id} 
                                className="bg-[#292929] border-[#626262] text-white mb-1"
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                                    <CardTitle className="text-md font-semibold flex items-center gap-2">
                                        <Car className="w-4 h-4" />
                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                                        onClick={() => setIsDeletingVehicle(vehicle.id)}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                            </Card>
                        ))}

                        <Button
                            variant="outline"
                            className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                            onClick={() => setIsAddingVehicle(true)}
                        >
                            Add Vehicle <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </div>

                    <SheetFooter className="flex flex-row gap-2 justify-end">
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                                        onClick={handleEdit}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setIsDeleting(true)}
                                    >
                                        Delete
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
                                        onClick={handleSave}
                                    >
                                        Save Changes
                                    </Button>
                                </>
                            )}
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <CustomerVehicleDialog
                isOpen={isAddingVehicle}
                onOpenChange={setIsAddingVehicle}
                onAddVehicle={handleAddVehicle}
            />

            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent className="bg-[#131313] text-white border border-[#222]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This will remove the customer from your shop.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={handleDelete}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <AlertDialog open={Boolean(isDeletingVehicle)} onOpenChange={() => setIsDeletingVehicle(null)}>
                <AlertDialogContent className="bg-[#131313] text-white border border-[#222]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete this vehicle? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => isDeletingVehicle && handleDeleteVehicle(isDeletingVehicle)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EmailDialog 
                isOpen={isSendingEmail} 
                onOpenChange={setIsSendingEmail} 
                emailToSend={emailToSend}
                recipient_name={customer.customer_name}
            />
        </>
    );
}
