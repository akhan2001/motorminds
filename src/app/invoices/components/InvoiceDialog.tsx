import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DownloadIcon } from 'lucide-react';

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
    };
}

export function InvoiceDialog({ isOpen, onClose, invoice }: InvoiceDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Invoice Details</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {invoice.invoiceNumber}
                            <span className={`ml-2 px-2 py-1 text-xs rounded-md text-white
                                ${invoice.status === "PAID" ? "bg-green-600" : "bg-red-600"}`}>
                                {invoice.status}
                            </span>
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
                        <p className="text-gray-400">
                            Issue Date: {invoice.issueDate}
                        </p>
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