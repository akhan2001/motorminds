import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DownloadIcon, TrashIcon, MailIcon, LayoutIcon, EditIcon, SendIcon, MoreHorizontal } from 'lucide-react';
import { toast } from "sonner";
import { formatCurrency, formatDate, setInvoiceStatus } from '../utils/invoice-utils';
import { deleteInvoice } from '../utils/invoice-utils';
import { ConfirmationProvider, useConfirmation } from '@/app/components/confirmation-service';
import { formatPhoneNumber } from '../utils/invoice-utils';
import { sendInvoiceEmail } from '@/app/customers/api/customer-utils';
import { generateInvoicePDF } from '../utils/pdf-generator';
import EditInvoiceForm from './EditInvoiceForm';

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
    onInvoiceUpdated?: () => void;
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
        source?: "customer_generated" | "shop_generated";
        customer_notes?: string;
        estimated_amount?: number;
        vehicleInfo: {
            year: string;
            make: string;
            model: string;
            license_plate: string;
        };
    };
}

export function InvoiceDialog({ isOpen, onClose, shopId, invoice, onEdit, onInvoiceUpdated }: InvoiceDialogProps) {
    const [status, setStatus] = useState(invoice.status);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isRegularEditFormOpen, setIsRegularEditFormOpen] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
        setIsRegularEditFormOpen(true);
    };

    const handleCloseRegularEditForm = () => {
        setIsRegularEditFormOpen(false);
    };

    const handleRegularInvoiceUpdated = () => {
        setIsRegularEditFormOpen(false);
        if (onInvoiceUpdated) {
            onInvoiceUpdated();
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
            console.log("Attempting to delete invoice:", invoice.invoiceNumber, "for shop:", shopId);
            const result = await deleteInvoice(invoice.invoiceNumber, shopId as string);
            console.log("Delete result:", result);
            toast.success(`Invoice #${invoice.displayNumber} deleted successfully`);
            setShowDeleteDialog(false);
            onClose();
            if (onInvoiceUpdated) {
                onInvoiceUpdated();
            }
        } catch (error) {
            console.error("Error deleting invoice:", error);
            console.error("Error details:", {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                error: error
            });
            toast.error(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setShowDeleteDialog(false);
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



    // Handle sending invoice to customer
    const handleSendToCustomer = async () => {
        if (!invoice.clientEmail) {
            toast.error('Customer email is required to send invoice');
            return;
        }

        setIsSendingEmail(true);
        try {
            const response = await fetch(`/api/invoices/send-customer-invoice/${invoice.invoiceNumber}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send invoice');
            }

            toast.success('Invoice sent to customer successfully!');
            
            // Optionally refresh invoice data
            if (onInvoiceUpdated) {
                onInvoiceUpdated();
            }
            
        } catch (error: any) {
            console.error('Error sending invoice:', error);
            toast.error(`Failed to send invoice: ${error.message}`);
        } finally {
            setIsSendingEmail(false);
        }
    };

    // Check if this is a customer-generated invoice
    const isCustomerGenerated = invoice.source === 'customer_generated';

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
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-0 w-[95vw] max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col">
                {/* Fixed Header */}
                <DialogHeader className="sticky top-0 bg-[#131313] z-10 p-4 sm:p-6 border-b border-[#333333] rounded-t-lg">
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
                
                {/* Scrollable Content */}
                <div id="invoice-container" className="bg-[#1A1A1A] text-white p-4 sm:p-6 rounded-lg border border-[#333333] flex-1 overflow-y-auto">
                    
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
                            
                            {/* Customer Notes - Only show for customer-generated invoices */}
                            {isCustomerGenerated && invoice.customer_notes && (
                                <div className="mb-2 pt-4">
                                    <p className="text-blue-400 font-medium">Customer's Original Request:</p>
                                    <div className="bg-blue-900/20 border border-blue-800 rounded-md p-3 mt-2">
                                        <p className="text-blue-100 italic">"{invoice.customer_notes}"</p>
                                    </div>
                                </div>
                            )}
                            
                            {invoice.notes && (
                                <div className="mb-2 pt-4">
                                    <p className="text-white font-medium">Shop Notes:</p>
                                    <p className="text-gray-400">{invoice.notes}</p>
                                </div>
                            )}
                        </div>

                        <Separator className="my-2 bg-gray-700" />
                        
                        {/* Amount and Status */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-[#222222] p-4 rounded-lg border border-[#333333]">
                            <div className="space-y-2 w-full sm:w-auto">
                                <div className="flex justify-between items-center gap-8">
                                    <p className="text-gray-400 text-sm">Labour Total:</p>
                                    <p className="text-white font-medium">{formatCurrency(invoice.labour_total_price || 0)}</p>
                                </div>
                                <div className="flex justify-between items-center gap-8">
                                    <p className="text-gray-400 text-sm">Parts Total:</p>
                                    <p className="text-white font-medium">{formatCurrency(invoice.parts_total_price || 0)}</p>
                                </div>
                                <Separator className="my-1 bg-gray-700" />
                                <div className="flex justify-between items-center gap-8">
                                    <p className="text-gray-400 font-medium">Subtotal:</p>
                                    <p className="text-white font-semibold">{formatAmount(invoice.amount)}</p>
                                </div>
                                <div className="flex justify-between items-center gap-8">
                                    <p className="text-gray-400 font-medium">Tax (13% HST):</p>
                                    <p className="text-white font-semibold">{formatCurrency(parseFloat(invoice.amount) * 0.13)}</p>
                                </div>
                                <Separator className="my-1 bg-blue-700" />
                                <div className="flex justify-between items-center gap-8">
                                    <p className="text-blue-400 font-bold text-lg">Total:</p>
                                    <p className="text-xl font-bold text-blue-400">{formatCurrency(parseFloat(invoice.amount) * 1.13)}</p>
                                </div>
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
        
                <DialogFooter className=" bottom-0 bg-[#131313] border-t border-[#333333] mt-4 p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-1">
                    {/* Customer-Generated Invoice Actions */}
                    {isCustomerGenerated && invoice.clientEmail && (
                        <Button 
                            className="bg-purple-600 text-white w-full sm:w-auto hover:bg-purple-700 border-none" 
                            onClick={handleSendToCustomer}
                            disabled={isSendingEmail}
                        >
                            <SendIcon className="w-4 h-4 mr-2" />
                            {isSendingEmail ? "Sending..." : "Send to Customer"}
                        </Button>
                    )}
                    
                    {/* Standard Invoice Actions */}
                    <Button 
                        className="bg-green-600 text-white w-full sm:w-auto hover:bg-green-700 border-none" 
                        onClick={handleEdit}
                    >
                        <EditIcon className="w-4 h-4 mr-2" />
                        Edit Invoice
                    </Button>
                    <Button 
                        className="bg-blue-600 text-white w-full sm:w-auto hover:bg-blue-700 border-none" 
                        onClick={toggleFormat}
                    >
                        <LayoutIcon className="w-4 h-4 mr-2" />
                        {isLandscape ? "Portrait" : "Landscape"}
                    </Button>
                    <Button 
                        className="bg-gray-600 text-white w-full sm:w-auto hover:bg-gray-700 border-none" 
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        {isDownloading ? "Generating..." : "Download PDF"}
                    </Button>
                    
                    {/* Delete with AlertDialog to prevent freezing */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                    <Button 
                        className="bg-red-600 text-white w-full sm:w-auto hover:bg-red-700 border-none" 
                                variant="outline"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <AlertDialog
                                open={showDeleteDialog}
                                onOpenChange={setShowDeleteDialog}
                            >
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                        className="text-red-600 cursor-pointer"
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            setShowDeleteDialog(true);
                                        }}
                                    >
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete Invoice
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#131313] text-white border-[#333333]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-400">
                                            This action cannot be undone. This will permanently delete invoice #{invoice.displayNumber} and all associated data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gray-600 text-white hover:bg-gray-700 border-gray-600">
                                            Cancel
                                        </AlertDialogCancel>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteInvoice}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Delete Invoice
                                        </Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </DialogFooter>
            </DialogContent>
            
            {/* Regular Invoice Edit Form */}
            {isRegularEditFormOpen && (
                <EditInvoiceForm
                    isOpen={isRegularEditFormOpen}
                    onClose={handleCloseRegularEditForm}
                    shopId={shopId || ''}
                    existingInvoice={invoice}
                    onInvoiceUpdated={handleRegularInvoiceUpdated}
                />
            )}
        </Dialog>    
    );
}