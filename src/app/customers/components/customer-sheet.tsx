import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { updateCustomer, deleteCustomer } from "../api/customer-utils"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getCustomerVehicles } from "../api/customer-utils"

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

    useEffect(() => {
        const fetchVehicles = async () => {
            const vehicles = await getCustomerVehicles(customer.id);
            setCustomerVehicles(vehicles);
        };

        fetchVehicles();
    }, [customer.id]);

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

    if (!customer) return null;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent className="bg-[#131313] text-white border-l-1 border-l-[#222]">
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

                        <Card className="bg-[#292929] border-[#626262] text-white">
                            <CardHeader>
                                <CardTitle>Vehicle 1</CardTitle>
                            </CardHeader>
                            <CardContent>
                            </CardContent>
                        </Card>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="year" className="text-left text-gray-300">Year</Label>
                            <Input
                                id="year"
                                value={editedVehicle.customerYear}
                                onChange={(e) => setEditedVehicle({ ...editedVehicle, customerYear: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="YYYY"
                                type="number"
                                readOnly={!isEditing}
                            />
                        </div>

                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="make" className="text-left text-gray-300">Make</Label>
                            <Input
                                id="make"
                                value={editedVehicle.customerMake}
                                onChange={(e) => setEditedVehicle({ ...editedVehicle, customerMake: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="Make"
                                readOnly={!isEditing}
                            />
                        </div>

                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="model" className="text-left text-gray-300">Model</Label>
                            <Input
                                id="model"
                                value={editedVehicle.customerModel}
                                onChange={(e) => setEditedVehicle({ ...editedVehicle, customerModel: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="Model"
                                readOnly={!isEditing}
                            />
                        </div>
                        
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-left text-gray-300">Color</Label>
                            <Input
                                id="color"
                                value={editedVehicle.customerColor}
                                onChange={(e) => setEditedVehicle({ ...editedVehicle, customerColor: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="Color"
                                readOnly={!isEditing}
                            />
                        </div>

                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="vin" className="text-left text-gray-300">VIN</Label>
                            <Input
                                id="vin"
                                value={editedVehicle.customerVin}
                                onChange={(e) => setEditedVehicle({ ...editedVehicle, customerVin: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="VIN"
                                readOnly={!isEditing}
                            />
                        </div>
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
        </>
    );
}
