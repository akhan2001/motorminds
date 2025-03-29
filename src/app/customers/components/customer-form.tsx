import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function CustomerForm({ isOpen, onClose, shopId, onCustomerCreated }: { isOpen: boolean; onClose: () => void; shopId: string; onCustomerCreated?: () => void; }) {
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
        }));
    };

    const validateForm = () => {
        if (!customerData.customer_phone.trim()) {
            toast.error("Customer phone number is required");
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
        const { data, error } = await supabase
            .from('customers')
            .insert([
            {
                shop_id: shopId,
                customer_name: customerData.customer_name,
                customer_email: customerData.customer_email,
                customer_phone: customerData.customer_phone,
                customer_address: customerData.customer_address
            }
            ])
            .select();
        
        if (error) throw error;
        
        toast.success("Customer created successfully");
        
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
            <DialogContent className="bg-[#131313] text-white border-[#333] sm:max-w-md">
                <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Create New Customer</DialogTitle>
                <DialogDescription>
                    Please fill in the details below to create a new customer.
                </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input
                        id="customer_name"
                        name="customer_name"
                        value={customerData.customer_name}
                        onChange={handleChange}
                        className="bg-[#292929] text-white border-[#444] focus:border-[#666]"
                        placeholder="Enter customer name"
                        required
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="customer_email">Email</Label>
                    <Input
                        id="customer_email"
                        name="customer_email"
                        type="email"
                        value={customerData.customer_email}
                        onChange={handleChange}
                        className="bg-[#292929] text-white border-[#444] focus:border-[#666]"
                        placeholder="Enter customer email"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="customer_phone">Phone</Label>
                    <Input
                        id="customer_phone"
                        name="customer_phone"
                        value={customerData.customer_phone}
                        onChange={handleChange}
                        className="bg-[#292929] text-white border-[#444] focus:border-[#666]"
                        placeholder="Enter customer phone"
                        required
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="customer_address">Address</Label>
                    <Input
                        id="customer_address"
                        name="customer_address"
                        value={customerData.customer_address}
                        onChange={handleChange}
                        className="bg-[#292929] text-white border-[#444] focus:border-[#666]"
                        placeholder="Enter customer address"
                    />
                </div>
                
                <DialogFooter className="mt-6">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="border-[#444] text-gray-300 hover:bg-[#333] hover:text-white"
                        disabled={isSubmitting}
                    >
                    Cancel
                    </Button>
                    <Button 
                        type="submit"
                        className="bg-[#ef4444] hover:bg-[#ef4444]/80 text-white"
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
