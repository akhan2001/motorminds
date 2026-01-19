import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { updateCustomer, deleteCustomer, deleteCustomerVehicle, sendEmail } from "../api/customer-utils"
import { supabase } from "@/lib/supabase"
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
    const [editingVehicle, setEditingVehicle] = useState<any>(null);
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
            setEditingVehicle(null);
        }
        onOpenChange(open);
    };

    const handleAddVehicle = async (vehicle: Vehicle) => {
        try {
            const addedVehicle = await createCustomerVehicle(customer.id, {
                year: parseInt(vehicle.year),
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

    const handleEditVehicle = async (vehicleData: Vehicle) => {
        try {
            console.log("Updating vehicle:", editingVehicle.id, vehicleData);
            
            const { data, error } = await supabase
                .from('customer_vehicles')
                .update({
                    year: parseInt(vehicleData.year),
                    make: vehicleData.make,
                    model: vehicleData.model,
                    color: vehicleData.color || null,
                    vin: vehicleData.vin || null,
                    engine_type: vehicleData.engine || null
                })
                .eq('id', editingVehicle.id)
                .select()
                .single();

            console.log("Update result:", { data, error });

            if (error) {
                console.error("Supabase error:", error);
                throw new Error(error.message || 'Failed to update vehicle');
            }

            if (data) {
                toast.success("Vehicle updated successfully");
                setEditingVehicle(null);
                // Refresh vehicles list
                const vehicles = await getCustomerVehicles(customer.id);
                setCustomerVehicles(vehicles);
            } else {
                toast.error("No data returned from update");
            }
        } catch (error) {
            console.error("Error updating vehicle:", error);
            if (error instanceof Error) {
                toast.error(`Error updating vehicle: ${error.message}`);
            } else {
                toast.error("An unexpected error occurred while updating the vehicle");
            }
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
            console.error("Error deleting vehicle:", error);
            if (error instanceof Error) {
                if (error.message.includes('Vehicle is currently in an open work order')) {
                    toast.error(error.message);
                } else {
                    toast.error(`Error deleting vehicle: ${error.message}`);
                }
            } else {
                toast.error("An unexpected error occurred while deleting the vehicle");
            }
        } finally {
            setIsDeletingVehicle(null);
        }
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
                <SheetContent className="bg-slate-50 dark:bg-card text-foreground border-l border-border overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-foreground">
                            {customer.customer_name}
                        </SheetTitle>
                        <SheetDescription className="text-muted-foreground">
                            View and edit customer details
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-4 py-4">
                        <Button
                            variant="outline" 
                            className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground w-full"
                            onClick={() => router.push(`/customers/${customer.id}`)}
                        >
                            View Full Customer Profile
                            <ArrowUpRight className="w-3 h-3" />
                        </Button>
                        <Separator className="bg-border"/>
                        <h2 className="text-lg font-semibold text-foreground">Customer Information</h2>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-left text-foreground">
                                Name
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="name"
                                    value={editedCustomer.customerName}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, customerName: e.target.value })}
                                    className="col-span-3 bg-white dark:bg-background text-foreground border-border"
                                    readOnly={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-left text-foreground">
                                Email
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Input 
                                    id="email" 
                                    value={editedCustomer.customerEmail}
                                    onChange={(e) => setEditedCustomer({ ...editedCustomer, customerEmail: e.target.value })}
                                    className="flex-1 bg-white dark:bg-background text-foreground border-border"
                                    readOnly={!isEditing}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border border-border hover:border-red-500 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex-shrink-0"
                                    onClick={() => openSendEmailDialog(editedCustomer.customerEmail)}
                                >
                                    <Mail className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-left text-foreground">
                                Phone *
                            </Label>
                            <Input
                                id="phone"
                                value={editedCustomer.customerPhone}
                                onChange={(e) => setEditedCustomer({ ...editedCustomer, customerPhone: e.target.value })}
                                className="col-span-3 bg-white dark:bg-background text-foreground border-border"
                                readOnly={!isEditing}
                                required
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-left text-foreground">
                                Address
                            </Label>
                            <Input
                                id="address"
                                value={editedCustomer.customerAddress}
                                onChange={(e) => setEditedCustomer({ ...editedCustomer, customerAddress: e.target.value })}
                                className="col-span-3 bg-white dark:bg-background text-foreground border-border"
                                readOnly={!isEditing}
                            />
                        </div>

                        <Separator className="bg-border"/>

                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">Customer Vehicles</h2>
                            <span className="text-sm text-muted-foreground">{customerVehicles.length} vehicle{customerVehicles.length !== 1 ? 's' : ''}</span>
                        </div>
                        
                        {customerVehicles.length === 0 ? (
                            <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-foreground mb-2">No Vehicles Added</h3>
                                <p className="text-muted-foreground text-sm mb-4">Add a vehicle to get started with work orders and service history.</p>
                            </div>
                        ) : (
                            customerVehicles.map((vehicle) => (
                                <Card 
                                    key={vehicle.id} 
                                    className="bg-card border-border text-foreground mb-3 hover:border-border transition-colors"
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-2 text-foreground">
                                                    <Car className="w-5 h-5 text-blue-400" />
                                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                                </CardTitle>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {vehicle.color && (
                                                        <div className="flex items-center gap-2">
                                                            <div 
                                                                className="w-3 h-3 rounded-full border border-border"
                                                                style={{ backgroundColor: vehicle.color.toLowerCase() }}
                                                            />
                                                            <span className="text-foreground">{vehicle.color}</span>
                                                        </div>
                                                    )}
                                                    {vehicle.vin && (
                                                        <div className="text-muted-foreground">
                                                            <span className="text-muted-foreground">VIN:</span> {vehicle.vin.slice(-6)}
                                                        </div>
                                                    )}
                                                    {vehicle.engine_type && (
                                                        <div className="text-muted-foreground">
                                                            <span className="text-muted-foreground">Engine:</span> {vehicle.engine_type}
                                                        </div>
                                                    )}
                                                    <div className="text-muted-foreground">
                                                        <span className="text-muted-foreground">Added:</span> {vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 ml-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10"
                                                    onClick={() => setEditingVehicle(vehicle)}
                                                    title="Edit vehicle"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                                    onClick={() => setIsDeletingVehicle(vehicle.id)}
                                                    title="Delete vehicle"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))
                        )}

                        <Button
                            variant="outline"
                            className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
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
                                        className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
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
                                        className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="bg-red-600 text-white hover:bg-red-700"
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

            {editingVehicle && (
                <CustomerVehicleDialog
                    isOpen={!!editingVehicle}
                    onOpenChange={(open) => !open && setEditingVehicle(null)}
                    onAddVehicle={handleEditVehicle}
                    initialData={{
                        year: editingVehicle.year || "",
                        make: editingVehicle.make || "",
                        model: editingVehicle.model || "",
                        color: editingVehicle.color || "",
                        vin: editingVehicle.vin || "",
                        engine: editingVehicle.engine_type || ""
                    }}
                    isEditing={true}
                />
            )}

            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent className="bg-slate-50 dark:bg-card text-foreground border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete Customer?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This will remove the customer from your shop.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
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
                <AlertDialogContent className="bg-slate-50 dark:bg-card text-foreground border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete Vehicle</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete this vehicle? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
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
