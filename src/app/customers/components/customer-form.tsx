import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createNewCustomer } from "../api/customer-utils";
import { useRouter } from "next/navigation";

export default function CustomerForm({ onClose, shopId }: { onClose: () => void, shopId: string }) {
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const router = useRouter();

    async function getShopID() {
        return shopId;
    }

    const handleSubmit = async () => {
        const shopId = await getShopID();
        const customer = { customerName, customerEmail, customerPhone, customerAddress };
        const newCustomer = await createNewCustomer(customer, shopId);
        if (newCustomer) {
            toast.success("Customer created successfully");
            onClose();
            router.refresh();
        } else {
            toast.error("Failed to create customer");
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border border-[#626262]">
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-white">Create New Customer</DialogTitle>
                    <DialogDescription className="text-gray-400 text-sm">
                        Add a new customer to your database. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Customer Name */}
                    <div>
                        <label className="text-gray-300 text-sm">Customer Name</label>
                        <Input
                            className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                            placeholder="Enter customer's full name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                    </div>

                    {/* Customer Email */}
                    <div>
                        <label className="text-gray-300 text-sm">Customer Email</label>
                        <Input
                            type="email"
                            className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                            placeholder="Enter customer's email address"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                    </div>

                    {/* Customer Phone */}
                    <div>
                        <label className="text-gray-300 text-sm">Customer Phone</label>
                        <Input
                            type="tel"
                            className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                            placeholder="Enter customer's phone number"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                    </div>

                    {/* Customer Address */}
                    <div>
                        <label className="text-gray-300 text-sm">Customer Address</label>
                        <Input
                            className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                            placeholder="Enter customer's address"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
                    >
                        Save Customer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
