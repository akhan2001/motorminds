import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Customer } from "@/app/customers/components/customer-interface";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { formatPhoneNumber } from "@/app/invoices/utils/invoice-utils";
import { useRouter } from "next/navigation";

export function CustomerCard({ customer }: { customer: Customer }) {
    const router = useRouter();
    const formattedDate = customer.created_at 
        ? format(new Date(customer.created_at), "MMM d, yyyy") 
        : "N/A";

    const handleCustomerClick = () => {
        console.log(`Customer ${customer.id} clicked`)
        // TODO: Open a modal with the customer details
        router.push(`/customers/${customer.id}`)
    }

    return (
        <Card className="bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#3A3A3A] transition-all duration-200 cursor-pointer" onClick={handleCustomerClick}>
            <CardHeader className="pb-2">
                <CardTitle className="text-white text-xl">{customer.customer_name}</CardTitle>
                <CardDescription className="text-gray-400 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {formatPhoneNumber(customer.customer_phone)}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 mb-2">
                <div className="space-y-2 text-sm">
                    {customer.customer_email && (
                        <div className="flex items-center gap-2 text-gray-300">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{customer.customer_email}</span>
                        </div>
                    )}
                    {customer.customer_address && (
                        <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{customer.customer_address}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Added: {formattedDate}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
