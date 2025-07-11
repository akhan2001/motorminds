import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DownloadIcon, TrashIcon, MailIcon, LayoutIcon, EditIcon } from 'lucide-react';
import { toast } from "sonner";
import { formatCurrency, formatDate, setInvoiceStatus } from '../utils/invoice-utils';
import { deleteInvoice } from '../utils/invoice-utils';
import { ConfirmationProvider, useConfirmation } from '@/app/components/confirmation-service';
import { formatPhoneNumber } from '../utils/invoice-utils';
import { sendInvoiceEmail } from '@/app/customers/api/customer-utils';
import { generateInvoicePDF } from '../utils/pdf-generator';

interface LineItem {
    description: string;
    cost: number;
    shop_cost?: number;
    quantity?: number;
}

interface InvoiceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    shopId?: string;
    onEdit?: (invoice: any) => void;
    invoice: {
        invoiceNumber: string;
        displayNumber: string;
        workOrder: string;
        status: string;
        shopName: string;
        shopAddress: string;
        shopEmail: string;
        shopPhone: string;
        amount: string;
        issueDate: string;
        clientName: string;
        clientAddress: string;
        clientEmail: string;
        clientPhone: string;
        labour: string;
        labour_total_price: number;
        parts: string;
        parts_total_price: number;
        notes: string;
        mileage: string;
        description: string;
        assignedTo: string;
        hst_number: string;
        business_number: string;
        labour_items: LineItem[];
        parts_items: LineItem[];
        vehicleInfo: {
            year: string;
            make: string;
            model: string;
            license_plate: string;
        };
    };
}

export function InvoiceDialog({ isOpen, onClose, shopId, invoice, onEdit }: InvoiceDialogProps) {
    const [status, setStatus] = useState(invoice.status);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const { confirm } = useConfirmation();

    // Update local status when invoice prop changes
    useEffect(() => {
        setStatus(invoice.status);
    }, [invoice.status]);

    const handleClose = () => {
        onClose();
    };

    const handleEdit = () => {
        console.log("Edit button clicked for invoice:", invoice.invoiceNumber);
        
        if (onEdit) {
            console.log("onEdit prop exists, calling it with invoice data");
            onEdit(invoice);
            onClose();
        } else {
            console.error("onEdit prop is not provided to InvoiceDialog component");
            toast.error("Edit functionality is not connected properly");
        }
    };

    const toggleStatus = async () => {
        const newStatus = status === "PAID" ? "UNPAID" : "PAID";
        try {
            // Optimistically update the UI
            setStatus(newStatus);
            
            // Call the server to update the status
            await setInvoiceStatus(invoice.invoiceNumber, newStatus, shopId as string);

            toast.success(`Invoice #${invoice.displayNumber} marked as ${newStatus}`);
        } catch (error) {
            // If the API call fails, revert the status and show an error
            setStatus(status); // Revert to original status
            console.error("Error updating invoice status:", error);
            toast.error("Failed to update invoice status");
        }
    };

    const handleDeleteInvoice = async () => {
        try {
            const confirmed = await confirm({
                title: "Delete Invoice",
                description: "Are you sure you want to delete this invoice?",
                confirmText: "Delete",
                cancelText: "Cancel",
                variant: "destructive"
            });
            if (!confirmed) return;
            await deleteInvoice(invoice.invoiceNumber, shopId as string);
            toast.success(`Invoice #${invoice.invoiceNumber} deleted successfully`);
            onClose();
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error("Failed to delete invoice");
        }
    };

    const toggleFormat = () => {
        setIsLandscape(!isLandscape);
        toast.success(`PDF format set to ${!isLandscape ? 'Landscape' : 'Portrait'}`);
    };
    
    const formatAmount = (amount: string) => {
        const numAmount = parseFloat(amount);
        return !isNaN(numAmount) 
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numAmount) 
            : amount;
    };

    const formatDateString = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const result = await generateInvoicePDF(invoice, isLandscape);
            if (result) {
                toast.success("Invoice downloaded successfully");
            } else {
                toast.error("Failed to download invoice");
            }
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("Failed to download invoice");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-4 sm:p-6 w-[95vw] max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <div id="invoice-container" className="bg-[#1A1A1A] text-white p-4 sm:p-6 rounded-lg border border-[#333333]">
                    <DialogHeader className="mb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <DialogTitle className="text-xl font-semibold text-white">
                                Invoice # {invoice.displayNumber}
                                <div className="text-gray-400 text-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div className="text-gray-500 text-sm">
                                            {invoice.invoiceNumber}
                                        </div>
                                    </div>
                                </div>
                            </DialogTitle>
                            <DialogDescription className="text-gray-400 text-sm">
                                Issued on: {formatDateString(invoice.issueDate)}
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <Separator className="my-2 bg-gray-700" />
                        
                        {/* Shop and Client Information side by side on larger screens */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">Shop Information</h3>
                                <p className="text-white font-medium">{invoice.shopName}</p>
                                <p className="text-gray-400 text-sm">{invoice.shopAddress}</p>
                                <p className="text-gray-400 text-sm">{invoice.shopEmail}</p>
                                <p className="text-gray-400 text-sm">{formatPhoneNumber(invoice.shopPhone)}</p>
                            </div>
                    
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">Client Information</h3>
                                <p className="text-white font-medium">{invoice.clientName}</p>
                                <p className="text-gray-400 text-sm">{invoice.clientAddress}</p>
                                <p className="text-gray-400 text-sm">{invoice.clientEmail}</p>
                                <p className="text-gray-400 text-sm">{formatPhoneNumber(invoice.clientPhone)}</p>
                            </div>
                        </div>
                        
                        <Separator className="my-2 bg-gray-700" />
                        
                        {/* Vehicle Information */}
                        {invoice.vehicleInfo && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">Vehicle Information</h3>
                                <p className="text-white">
                                    {invoice.vehicleInfo.year} {invoice.vehicleInfo.make} {invoice.vehicleInfo.model}
                                    {invoice.vehicleInfo.license_plate=='NULL' || invoice.vehicleInfo.license_plate==null ? '' : ` - ${invoice.vehicleInfo.license_plate}`}
                                </p>
                                {invoice.mileage && (
                                    <p className="text-gray-400 text-sm">Mileage: {invoice.mileage}</p>
                                )}
                            </div>
                        )}
            
                        <Separator className="my-2 bg-gray-700" />
                        
                        {/* Work Order Details */}
                        <div className="space-y-2">
                            {invoice.description && (
                                <div className="mb-2">
                                    <p className="text-lg font-semibold text-white">{invoice.description}</p>
                                </div>
                            )}

                            {/* --- Line Items Table --- */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 border-b border-gray-700 pb-2">
                                    <div className="col-span-5">DESCRIPTION</div>
                                    <div className="col-span-2 text-center">QTY</div>
                                    <div className="col-span-2 text-right">SHOP COST</div>
                                    <div className="col-span-3 text-right">TOTAL</div>
                                </div>
                                
                                {/* Labour Items */}
                                {(!invoice.labour_items || invoice.labour_items.length === 0) && invoice.labour_total_price > 0 ? (
                                    <div className="grid grid-cols-12 gap-2 items-center text-sm">
                                        <div className="col-span-10 text-white">{invoice.labour || 'General Labour'}</div>
                                        <div className="col-span-2 text-right text-white">{formatCurrency(invoice.labour_total_price)}</div>
                                    </div>
                                ) : (
                                    invoice.labour_items && invoice.labour_items.map((item, index) => (
                                        <div key={`labour-${index}`} className="grid grid-cols-12 gap-2 items-center text-sm">
                                            <div className="col-span-5 text-white">{item.description}</div>
                                            <div className="col-span-2 text-center text-gray-400">-</div>
                                            <div className="col-span-2 text-right text-gray-400">-</div>
                                            <div className="col-span-3 text-right text-white">{formatCurrency(item.cost)}</div>
                                        </div>
                                    ))
                                )}

                                {/* Parts Items */}
                                {(!invoice.parts_items || invoice.parts_items.length === 0) && invoice.parts_total_price > 0 ? (
                                    <div className="grid grid-cols-12 gap-2 items-center text-sm">
                                        <div className="col-span-10 text-white">{invoice.parts || 'General Parts'}</div>
                                        <div className="col-span-2 text-right text-white">{formatCurrency(invoice.parts_total_price)}</div>
                                    </div>
                                ) : (
                                    invoice.parts_items && invoice.parts_items.map((item, index) => (
                                        <div key={`parts-${index}`} className="grid grid-cols-12 gap-2 items-center text-sm">
                                            <div className="col-span-5 text-white">{item.description}</div>
                                            <div className="col-span-2 text-center text-white">{item.quantity}</div>
                                            <div className="col-span-2 text-right text-red-400">{formatCurrency(item.shop_cost)}</div>
                                            <div className="col-span-3 text-right text-white">
                                                {item.quantity && item.quantity > 1 ? (
                                                    <span>
                                                        {formatCurrency(item.cost * item.quantity)}
                                                        <span className="text-gray-400 text-xs ml-1">({formatCurrency(item.cost)}/ea)</span>
                                                    </span>
                                                ) : (
                                                    formatCurrency(item.cost)
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {invoice.notes && (
                                <div className="mb-2 pt-4">
                                    <p className="text-white font-medium">Notes:</p>
                                    <p className="text-gray-400">{invoice.notes}</p>
                                </div>
                            )}
                        </div>

                        <Separator className="my-2 bg-gray-700" />
                        
                        {/* Amount and Status */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#222222] p-4 rounded-lg border border-[#333333]">
                            <div>
                                <p className="text-gray-400 font-medium">Amount Due:</p>
                                <p className="text-xl font-bold text-white">{formatAmount(invoice.amount)}</p>
                            </div>
                            
                            <div className="flex flex-col gap-2">   
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
                                <span className="text-xs text-gray-500 text-center">
                                    Click to mark as {status === "PAID" ? "unpaid" : "paid"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
        
                <DialogFooter className="mt-4 flex flex-col sm:flex-row justify-end gap-1">
                    <Button 
                        className="bg-blue-600 text-white w-full sm:w-auto hover:bg-blue-700 border-none" 
                        onClick={toggleFormat}
                    >
                        <LayoutIcon className="w-4 h-4 mr-2" />
                        {isLandscape ? "Portrait" : "Landscape"}
                    </Button>
                    {/* <Button 
                        className="bg-green-600 text-white w-full sm:w-auto hover:bg-green-700 border-none" 
                        onClick={handleEdit}
                    >
                        <EditIcon className="w-4 h-4 mr-2" />
                        Edit
                    </Button> */}
                    <Button 
                        className="bg-gray-600 text-white w-full sm:w-auto hover:bg-gray-700 border-none" 
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        {isDownloading ? "Generating..." : "Download PDF"}
                    </Button>
                    <Button 
                        className="bg-red-600 text-white w-full sm:w-auto hover:bg-red-700 border-none" 
                        onClick={handleDeleteInvoice}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>    
    );
}