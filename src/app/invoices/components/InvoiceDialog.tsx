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
            <DialogContent className="bg-[#131313] text-white border-none">
                <DialogHeader>
                    <DialogTitle>Invoice Details</DialogTitle>
                    <DialogDescription>
                        Detailed view of the invoice.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6">
                    <p className="text-gray-400"><strong className="text-white">Invoice Number:</strong> {invoice.invoiceNumber}</p>
                    <p className="text-gray-400"><strong className="text-white">Status:</strong> {invoice.status}</p>
                    <p className="text-gray-400"><strong className="text-white">Shop Name:</strong> {invoice.shopName}</p>
                    <p className="text-gray-400"><strong className="text-white">Shop Address:</strong> {invoice.shopAddress}</p>
                    <p className="text-gray-400"><strong className="text-white">Shop Email:</strong> {invoice.shopEmail}</p>
                    <Separator className="my-3 bg-gray-800" />
                    <p className="text-gray-400"><strong className="text-white">Client Name:</strong> {invoice.clientName}</p>
                    <p className="text-gray-400"><strong className="text-white">Client Address:</strong> {invoice.clientAddress}</p>
                    <p className="text-gray-400"><strong className="text-white">Client Email:</strong> {invoice.clientEmail}</p>
                    <Separator className="my-3 bg-gray-800" />
                    <p className="text-gray-400"><strong className="text-white">Amount Due:</strong> {invoice.amount}</p>
                    <p className="text-gray-400"><strong className="text-white">Issue Date:</strong> {invoice.issueDate}</p>
                </div>
                <DialogFooter>
                    <Button className="bg-gray-600 text-white px-4 py-2 hover:bg-gray-700 border-none" disabled>
                        <DownloadIcon className="w-4 h-4" />
                        Download
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}