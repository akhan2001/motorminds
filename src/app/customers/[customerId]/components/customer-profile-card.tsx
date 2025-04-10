import { formatPhoneNumber } from "@/app/invoices/utils/invoice-utils";
import { Card } from "@/components/ui/card";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Key, Home, Copy } from "lucide-react";
import { toast } from "sonner";

interface CustomerProfileCardProps {
    customer: any;
}

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
}

export function CustomerProfileCard({ customer }: CustomerProfileCardProps) {
    return (
        <Card className="bg-[#1A1A1A] border-[#333] text-white">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Customer Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div className="flex items-start">
                        <Home className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                        <div>
                            <p className="text-gray-400 text-sm">Name</p>
                            <p>{customer.customer_name}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                        <div className="flex items-start">
                            <div>
                                <p className="text-gray-400 text-sm">Email</p>
                                <p>{customer.customer_email || 'Not provided'}</p>
                            </div>
                            {customer.customer_email && (
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(customer.customer_email)
                                            .then(() => toast.success("Email copied to clipboard"))
                                            .catch(() => toast.error("Failed to copy email"));
                                    }}
                                    className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
                                >
                                    <Copy className="h-4 w-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                        <div>
                            <p className="text-gray-400 text-sm">Phone</p>
                            <p>{formatPhoneNumber(customer.customer_phone) || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                        <div>
                            <p className="text-gray-400 text-sm">Address</p>
                            <p>{customer.customer_address || 'Not provided'}</p>
                        </div>
                    </div>
                    {/* <div className="flex items-start">
                        <Key className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                        <div>
                            <p className="text-gray-400 text-sm">Customer ID</p>
                            <p className="font-mono text-sm">
                                {customer.id}
                                <Copy className="h-5 w-5 text-gray-400 mt-0.5 ml-3" />
                            </p>
                        </div>
                    </div> */}
                </div>
            </CardContent>
        </Card>
    );
}