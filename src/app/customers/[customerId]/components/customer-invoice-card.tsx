import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/app/invoices/utils/invoice-utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { File } from "lucide-react";
import { useRouter } from "next/navigation";

interface CustomerInvoiceCardProps {
    invoices: any[];
}

export function CustomerInvoiceCard({ invoices }: CustomerInvoiceCardProps) {
    const router = useRouter()
    return (
        <div className="space-y-4">
            {invoices.length > 0 ? (
                invoices.map((invoice) => (
                    <div key={invoice.id}>
                        <h3>{invoice.number}</h3>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-[#1A1A1A] rounded-lg border border-[#333]">
                    <File className="h-12 w-12 text-gray-500 mb-3" />
                    <h3 className="text-xl font-semibold mb-2">No Invoices</h3>
                    <p className="text-gray-400 text-center mb-4">This customer doesn't have any invoices yet.</p>
                    <Button 
                    className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                    onClick={() => {
                        router.push(`/invoices`)
                    }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                    </Button>
                </div>
            )}

        </div>
    )
}

