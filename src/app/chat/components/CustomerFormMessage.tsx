import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createNewCustomer, checkCustomerExists } from "@/app/customers/api/customer-utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Sparkles } from "lucide-react";

interface CustomerFormMessageProps {
  initialName?: string;
  shopId: string;
  onSuccess: (customer: any) => void;
  onCancel: () => void;
}

export function CustomerFormMessage({ initialName, shopId, onSuccess, onCancel }: CustomerFormMessageProps) {
  const [customerName, setCustomerName] = useState(initialName || "");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!customerPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const customerExists = await checkCustomerExists(customerPhone, shopId);
      if (customerExists) {
        toast.error("Customer already exists with this phone number");
        setIsSubmitting(false);
        return;
      }

      const customer = { customerName, customerEmail, customerPhone, customerAddress };
      const newCustomer = await createNewCustomer(customer, shopId);
      
      if (newCustomer) {
        toast.success("Customer created successfully");
        onSuccess(newCustomer);
      } else {
        toast.error("Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("An error occurred while creating the customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[#1A1A1A] border-[#333333] text-white w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-400" />
            <CardTitle className="text-lg text-white">Create New Customer</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-transparent"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-gray-400 text-sm">
          Fill in the details to create a new customer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <div>
          <label className="text-gray-300 text-sm block mb-1">Customer Name</label>
          <Input
            className="bg-[#292929] text-white text-sm border-[#444444] focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter customer's full name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">Phone Number</label>
          <Input
            className="bg-[#292929] text-white text-sm border-[#444444] focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter customer's phone number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">Email Address</label>
          <Input
            className="bg-[#292929] text-white text-sm border-[#444444] focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter customer's email address"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            type="email"
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">Address</label>
          <Input
            className="bg-[#292929] text-white text-sm border-[#444444] focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter customer's address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-[#444444] text-gray-300 hover:bg-[#333333] hover:text-white"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
        >
          {isSubmitting ? "Creating..." : "Create Customer"}
        </Button>
      </CardFooter>
    </Card>
  );
} 