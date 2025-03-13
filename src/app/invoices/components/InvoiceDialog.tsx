import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DownloadIcon, TrashIcon } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Switch } from "@/components/ui/switch";
import { setInvoiceStatus } from '../utils/invoice-utils';
import { deleteInvoice } from '../utils/invoice-utils';

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
    const invoiceRef = useRef<HTMLDivElement>(null);
    
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

    const handleDownload = async () => {
        if (!isOpen || !invoiceRef.current) {
            toast.error("Cannot generate PDF: Invoice content not available");
            return;
        }

        try {
            const canvas = await html2canvas(invoiceRef.current);
            const pdf = new jsPDF();
            const imgData = canvas.toDataURL("image/png");
            
            // Reduce size by using smaller width and adding margins
            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const margin = 15; // Margin in mm
            
            // Use 75% of page width with margins
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Add image with margins
            pdf.addImage(imgData, "SVG", margin, margin, imgWidth, imgHeight);
            
            // If content is too tall, adjust the PDF
            if (imgHeight > pageHeight - (margin * 2)) {
                // Scale down further to fit on one page
                const scaleFactor = (pageHeight - (margin * 2)) / imgHeight;
                const adjustedWidth = imgWidth * scaleFactor;
                const adjustedHeight = imgHeight * scaleFactor;
                
                // Create a new PDF and add the scaled image
                const newPdf = new jsPDF();
                newPdf.addImage(imgData, "SVG", margin, margin, adjustedWidth, adjustedHeight);
                newPdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
            } else {
                pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
            }
            
            toast.success("Invoice downloaded successfully");
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("Failed to download invoice");
        }
    };

    const toggleStatus = async () => {
        try {
            const newStatus = status === "PAID" ? "UNPAID" : "PAID";
            const { error } = await supabase
                .from('invoices')
                .update({ status: newStatus })
                .eq('invoice_number', invoice.invoiceNumber);
            
            if (error) throw error;
            
            setStatus(newStatus);
            toast.success(`Invoice #${invoice.invoiceNumber} updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating invoice status:", error);
            toast.error("Failed to update invoice status");
        }
    };

    const handleDeleteInvoice = async () => {
        try {
            await deleteInvoice(invoice.invoiceNumber);
            toast.success(`Invoice #${invoice.invoiceNumber} deleted successfully`);
            onClose();
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error("Failed to delete invoice");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-6">
                <div ref={invoiceRef} id="invoice-container" className="bg-white text-black p-6 rounded-lg">
                    <DialogHeader className="text-black">
                        <DialogTitle className="text-xl font-semibold flex items-center justify-between text-black">
                            Invoice<br/># {invoice.invoiceNumber}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Issued on: {invoice.issueDate}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <Separator className="my-2 bg-gray-300" />
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-black">Shop Information</h3>
                            <p className="text-gray-600">
                                Shop Name: {invoice.shopName}
                            </p>
                            <p className="text-gray-600">
                                Shop Address: {invoice.shopAddress}
                            </p>
                            <p className="text-gray-600">
                                Shop Email: {invoice.shopEmail}
                            </p>
                        </div>
            
                        <Separator className="my-2 bg-gray-300" />
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-black">Work Order Details</h3>
                            <p className="text-gray-600">
                                Labour: {invoice.labour}
                            </p>
                            <p className="text-gray-600">
                                Parts: {invoice.parts}
                            </p>
                            <p className="text-gray-600">
                                Notes: {invoice.notes}
                            </p>
                            <p className="text-gray-600">
                                Mileage: {invoice.mileage}
                            </p>
                            <p className="text-gray-600">
                                Description: {invoice.description}
                            </p>
                        </div>       

                        <Separator className="my-2 bg-gray-300" />
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-black">Client Information</h3>
                            <p className="text-gray-600">
                                {invoice.clientName}
                            </p>
                            <p className="text-gray-600">
                                {invoice.clientAddress}
                            </p>
                            <p className="text-gray-600">
                                {invoice.clientEmail}
                            </p>
                        </div>

                        <Separator className="my-2 bg-gray-300" />        
                        <div className="space-y-2">
                            <p className="text-gray-600">
                                Amount Due: {invoice.amount}
                            </p>
                            <div className="flex items-center gap-3">   
                                <Button
                                    onClick={toggleStatus}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                        status === "PAID" 
                                            ? "bg-green-600 hover:bg-green-700 text-white" 
                                            : "bg-red-600 hover:bg-red-700 text-white"
                                    }`}
                                >
                                    {status === "PAID" ? "PAID" : "UNPAID"}
                                </Button>
                                <span className="text-sm text-gray-600">
                                    Click to mark as {status === "PAID" ? "unpaid" : "paid"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
        
                <DialogFooter className="mt-4 flex justify-end">
                    <Button className="bg-red-600 text-white px-4 py-2 hover:bg-red-700 border-none" onClick={handleDeleteInvoice}>
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete Invoice
                    </Button>
                    <Button className="bg-gray-600 text-white px-4 py-2 hover:bg-gray-700 border-none" onClick={handleDownload}>
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>    
    );
}