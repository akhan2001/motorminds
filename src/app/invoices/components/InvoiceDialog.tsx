import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DownloadIcon } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface InvoiceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: {
        invoiceNumber: string;
        status: string;
        shopName: string;
        shopAddress: string;
        shopEmail: string;
        amount: string;
        issueDate: string;
        clientName: string;
        clientAddress: string;
        clientEmail: string;
        labour: string;
        parts: string;
        notes: string;
        mileage: string;
        description: string;
        assignedTo: string;
    };
}

export function InvoiceDialog({ isOpen, onClose, invoice }: InvoiceDialogProps) {
    const [status, setStatus] = useState(invoice.status);
    
    // Update local status when invoice prop changes
    useEffect(() => {
        setStatus(invoice.status);
    }, [invoice.status]);

    const handleClose = async () => {
        try {
            // Only update if status has changed
            if (status !== invoice.status) {
                const { error } = await supabase
                    .from('invoices')
                    .update({ status: status })
                    .eq('invoice_number', invoice.invoiceNumber);
                
                if (error) throw error;
                
                // Show success toast
                toast.success(`Invoice #${invoice.invoiceNumber} saved as ${status}`);
            }
            onClose();
        } catch (error) {
            console.error("Error updating invoice status:", error);
            toast.error("Failed to update invoice status");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center justify-between">
                        Invoice<br/># {invoice.invoiceNumber}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Issued on: {invoice.issueDate}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <Separator className="my-2 bg-gray-700" />
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Shop Information</h3>
                        <p className="text-gray-400">
                            Shop Name: {invoice.shopName}
                        </p>
                        <p className="text-gray-400">
                            Shop Address: {invoice.shopAddress}
                        </p>
                        <p className="text-gray-400">
                            Shop Email: {invoice.shopEmail}
                        </p>
                    </div>
        
                    <Separator className="my-2 bg-gray-700" />
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Work Order Details</h3>
                        <p className="text-gray-400">
                            Labour: {invoice.labour}
                        </p>
                        <p className="text-gray-400">
                            Parts: {invoice.parts}
                        </p>
                        <p className="text-gray-400">
                            Notes: {invoice.notes}
                        </p>
                        <p className="text-gray-400">
                            Mileage: {invoice.mileage}
                        </p>
                        <p className="text-gray-400">
                            Description: {invoice.description}
                        </p>
                    </div>       

                    <Separator className="my-2 bg-gray-700" />
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Client Information</h3>
                        <p className="text-gray-400">
                            {invoice.clientName}
                        </p>
                        <p className="text-gray-400">
                            {invoice.clientAddress}
                        </p>
                        <p className="text-gray-400">
                            {invoice.clientEmail}
                        </p>
                    </div>

                    <Separator className="my-2 bg-gray-700" />        
                    <div className="space-y-2">
                        <p className="text-gray-400">
                            Amount Due: {invoice.amount}
                        </p>
                        <div className="flex items-center gap-3">   
                            <span className={`px-3 py-1 text-xs rounded-md text-white ${status === "PAID" ? "bg-green-600" : "bg-red-600"}`}>
                                {status}
                            </span>
                        </div>
                    </div>
                </div>
        
                <DialogFooter className="mt-4 flex justify-end">
                    <Button className="bg-gray-600 text-white px-4 py-2 hover:bg-gray-700 border-none" disabled>
                        <DownloadIcon className="w-4 h-4" />
                        Download
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>    
    );
}