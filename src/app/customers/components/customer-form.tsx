import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { checkCustomerExists, createNewCustomer, validatePhoneNumber } from "../api/customer-utils";
import { useRouter } from "next/navigation";

export function CustomerForm({ 
    isOpen, 
    onClose, 
    shopId, 
    onCustomerCreated 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    shopId: string;
    onCustomerCreated?: () => void;
}) {
    const router = useRouter();
    const [customerData, setCustomerData] = useState({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        customer_address: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({
            ...prev,
            [name]: value
        }))
    };

    const validateForm = () => {
        if (!customerData.customer_name.trim()) {
            toast.error("Customer name is required");
            return false;
        }
        
        // Only validate phone if it's not empty
        if (customerData.customer_phone.trim() && !validatePhoneNumber(customerData.customer_phone)) {
            toast.error("Please enter a valid phone number");
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            // Create new customer in database
            const customerExists = await checkCustomerExists(customerData.customer_phone, shopId);
            if (customerExists) {
                toast.error("Customer already exists");
                return;
            }

            const newCustomer = await createNewCustomer(customerData, shopId);
            if (newCustomer) {
                toast.success("Customer created successfully");
                onClose();
                router.refresh();
            } else {
                toast.error("Failed to create customer");
            }

            // Reset form
            setCustomerData({
                customer_name: "",
                customer_email: "",
                customer_phone: "",
                customer_address: ""
            });
            
            // Call the callback if provided
            if (onCustomerCreated) {
                onCustomerCreated();
            }
            
            // Close the dialog
            onClose();
        } catch (error: any) {
            console.error("Error creating customer:", error);
            toast.error(error.message || "Failed to create customer");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-50 dark:bg-card text-foreground border-border sm:max-w-md">
            <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Create New Customer</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Enter customer details below to create a new customer</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
                <Label htmlFor="customer_name" className="text-foreground">Customer Name</Label>
                <Input
                id="customer_name"
                name="customer_name"
                value={customerData.customer_name}
                onChange={handleChange}
                className="bg-white dark:bg-background text-foreground border-border focus:border-border"
                placeholder="Enter customer name"
                required
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="customer_email" className="text-foreground">Email</Label>
                <Input
                id="customer_email"
                name="customer_email"
                type="email"
                value={customerData.customer_email}
                onChange={handleChange}
                className="bg-white dark:bg-background text-foreground border-border focus:border-border"
                placeholder="Enter customer email"
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="customer_phone" className="text-foreground">Phone</Label>
                <Input
                id="customer_phone"
                name="customer_phone"
                value={customerData.customer_phone}
                onChange={handleChange}
                className="bg-white dark:bg-background text-foreground border-border focus:border-border"
                placeholder="Enter customer phone number"
                maxLength={10}
                required
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="customer_address" className="text-foreground">Address</Label>
                <Input
                id="customer_address"
                name="customer_address"
                value={customerData.customer_address}
                onChange={handleChange}
                className="bg-white dark:bg-background text-foreground border-border focus:border-border"
                placeholder="Enter customer address"
                />
            </div>
            
            <DialogFooter className="mt-6">
                <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                disabled={isSubmitting}
                >
                Cancel
                </Button>
                <Button 
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isSubmitting}
                    >
                    {isSubmitting ? "Creating..." : "Save Customer"}
                </Button>
            </DialogFooter>
            </form>
        </DialogContent>
        </Dialog>
    );
}