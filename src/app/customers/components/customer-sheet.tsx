import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { updateCustomer, deleteCustomer, deleteCustomerVehicle } from "../api/customer-utils"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getCustomerVehicles, createCustomerVehicle } from "../api/customer-utils"
import { Car, Plus, Minus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface CustomerSheetProps {
    customer: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCustomerUpdated: () => void;
}

export function CustomerSheet({ customer, isOpen, onOpenChange, onCustomerUpdated }: CustomerSheetProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [customerVehicles, setCustomerVehicles] = useState<any[]>([]);
    const [editedCustomer, setEditedCustomer] = useState({
        customerName: customer?.customer_name || "",
        customerEmail: customer?.customer_email || "",
        customerPhone: customer?.customer_phone || "",
        customerAddress: customer?.customer_address || ""
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
        vin: ""
    });

    useEffect(() => {
        const fetchVehicles = async () => {
            const vehicles = await getCustomerVehicles(customer.id);
            setCustomerVehicles(vehicles);
        };

        fetchVehicles();
    }, [customer.id]);
    
    const handleAddVehicle = async () => {
        // Validate year
        const year = parseInt(newVehicle.year);
        const currentYear = new Date().getFullYear();
        
        if (!year || year < 1960 || year > currentYear) {
            toast.error(`Year must be between 1960 and ${currentYear}`);
            return;
        }

        if (!newVehicle.make.trim()) {
            toast.error("Make is required");
            return;
        }

        if (!newVehicle.model.trim()) {
            toast.error("Model is required");
            return;
        }

        try {
            const addedVehicle = await createCustomerVehicle(customer.id, {
                year: newVehicle.year,
                make: newVehicle.make,
                model: newVehicle.model,
                color: newVehicle.color || null,
                vin: newVehicle.vin || null
            });

            if (addedVehicle) {
                toast.success("Vehicle added successfully");
                setIsAddingVehicle(false);
                // Refresh vehicles list
                const vehicles = await getCustomerVehicles(customer.id);
                setCustomerVehicles(vehicles);
                // Reset form
                setNewVehicle({
                    year: "",
                    make: "",
                    model: "",
                    color: "",
                    vin: ""
                });
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

        const updated = await updateCustomer(customer.id, editedCustomer);
        if (updated) {
            toast.success("Customer updated successfully");
            setIsEditing(false);
            onCustomerUpdated();
        } else {
            toast.error("Failed to update customer. Please try again.");
        }
    };

    const handleDelete = async () => {
        const deleted = await deleteCustomer(customer.id);
        if (deleted) {
            toast.success("Customer deleted successfully");
            onOpenChange(false);
            onCustomerUpdated();
        } else {
            toast.error("Failed to delete customer");
        }
        setIsDeleting(false);
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
            toast.error("Error deleting vehicle");
            console.error("Error deleting vehicle:", error);
        }
        setIsDeletingVehicle(null);
    };

    if (!customer) return null;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent className="bg-[#131313] text-white border-l-1 border-l-[#222] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-white">{customer.customer_name}</SheetTitle>
                        <SheetDescription className="text-gray-400">
                            View and edit customer details
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-4 py-4">
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
                            <Input 
                                id="email" 
                                value={editedCustomer.customerEmail}
                                onChange={(e) => setEditedCustomer({ ...editedCustomer, customerEmail: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                readOnly={!isEditing}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-left text-gray-300">
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                value={editedCustomer.customerPhone}
                                onChange={(e) => setEditedCustomer({ ...editedCustomer, customerPhone: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                readOnly={!isEditing}
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

            <Dialog open={isAddingVehicle} onOpenChange={setIsAddingVehicle}>
                <DialogContent className="bg-[#131313] text-white border border-[#222]">
                    <DialogHeader>
                        <DialogTitle>Add New Vehicle</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="year" className="text-left text-gray-300">Year</Label>
                            <Input
                                id="year"
                                value={newVehicle.year}
                                onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="YYYY"
                                type="number"
                                min="1960"
                                max={new Date().getFullYear()}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="make" className="text-left text-gray-300">Make</Label>
                            <Input
                                id="make"
                                value={newVehicle.make}
                                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="Make"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="model" className="text-left text-gray-300">Model</Label>
                            <Input
                                id="model"
                                value={newVehicle.model}
                                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="Model"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-left text-gray-300">Color</Label>
                            <Input
                                id="color"
                                value={newVehicle.color}
                                onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="Color"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="vin" className="text-left text-gray-300">VIN</Label>
                            <Input
                                id="vin"
                                value={newVehicle.vin}
                                onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="VIN"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                            onClick={() => setIsAddingVehicle(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
                            onClick={handleAddVehicle}
                        >
                            Add Vehicle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent className="bg-[#131313] text-white border border-[#222]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This action cannot be undone. This will permanently delete the customer
                            and all associated data.
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
                            Delete
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
        </>
    );
}
