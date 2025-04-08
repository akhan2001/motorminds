import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DownloadIcon, TrashIcon, MailIcon } from 'lucide-react';
import { toast } from "sonner";
import { formatDate, setInvoiceStatus } from '../utils/invoice-utils';
import { deleteInvoice } from '../utils/invoice-utils';
import { ConfirmationProvider, useConfirmation } from '@/app/components/confirmation-service';
import { formatPhoneNumber } from '../utils/invoice-utils';
import { sendInvoiceEmail } from '@/app/customers/api/customer-utils';
import { generateInvoicePDF } from '../utils/pdf-generator';

interface InvoiceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    shopId?: string;
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
        parts: string;
        notes: string;
        mileage: string;
        description: string;
        assignedTo: string;
        vehicleInfo: {
            year: string;
            make: string;
            model: string;
            license_plate: string;
        };
    };
}

export function InvoiceDialog({ isOpen, onClose, shopId, invoice }: InvoiceDialogProps) {
    const [status, setStatus] = useState(invoice.status);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { confirm } = useConfirmation();

    // Update local status when invoice prop changes
    useEffect(() => {
        setStatus(invoice.status);
    }, [invoice.status]);

    const handleClose = async () => {
        try {
            // Only update if status has changed
            if (status !== invoice.status) {
                try {
                    await setInvoiceStatus(invoice.invoiceNumber, status, shopId as string);
                    toast.success(`Invoice #${invoice.displayNumber} saved as ${status}`);
                } catch (error) {
                    console.error("Error updating invoice status:", error);
                    toast.error("Failed to update invoice status");
                }
            }
            onClose();
        } catch (error) {
            console.error("Error updating invoice status:", error);
            toast.error("Failed to update invoice status");
        }
    };

    // // This function creates PDF data for both download and email
    // const generateInvoicePDF = async () => {
    //     try {
    //         // Import easyinvoice dynamically
    //         const easyinvoice = await import('easyinvoice');
            
    //         // Prepare products array - we'll use labor and parts as separate line items
    //         const products = [];
            
    //         // Labor as a product if it exists
    //         if (invoice.labour) {
    //             products.push({
    //                 quantity: "1",
    //                 description: `Labor: ${invoice.labour}`,
    //                 price: invoice.amount, // As we don't have separate amounts, use full amount
    //                 taxRate: "0"
    //             });
    //         }
            
    //         // Parts as a product if it exists
    //         if (invoice.parts) {
    //             products.push({
    //                 quantity: "1",
    //                 description: `Parts: ${invoice.parts}`,
    //                 price: "0", // We already put the full amount in labor
    //                 taxRate: "0"
    //             });
    //         }
            
    //         // Add a default product if nothing was added
    //         if (products.length === 0) {
    //             products.push({
    //                 quantity: "1",
    //                 description: invoice.description || "Service",
    //                 price: invoice.amount,
    //                 taxRate: "0"
    //             });
    //         }
            
    //         // Safety checks for all client/shop information
    //         const vehicleDescription = invoice.vehicleInfo ? 
    //             `${invoice.vehicleInfo.year || ''} ${invoice.vehicleInfo.make || ''} ${invoice.vehicleInfo.model || ''}`.trim() : 
    //             '';
            
    //         const data = {
    //             apiKey: "free",
    //             mode: "development" as "development" | "production",
    //             images: {
    //                 logo: "https://cdn.prod.website-files.com/66fcb2f56c967857d2ff9609/67e0818bed90c1081e521e01_motorminds-logo.png",
    //             },
    //             sender: {
    //                 company: invoice.shopName || "",
    //                 address: invoice.shopAddress || "",
    //                 zip: invoice.shopEmail || "",
    //                 city: invoice.shopPhone || "",
    //             },
    //             client: {
    //                 company: invoice.clientName || "",
    //                 address: invoice.clientAddress || "",
    //                 zip: formatPhoneNumber(invoice.clientPhone),
    //                 city: invoice.clientEmail || "",
    //                 country: vehicleDescription || ""
    //             },
    //             information: {
    //                 number: invoice.displayNumber || "",
    //                 date: formatDate(invoice.issueDate) || "",
    //             },
    //             products: products,
    //             bottom_notice: "Thank you for choosing " + (invoice.shopName || "us") + "!\n Powered by Motorminds Inc.",
    //             settings: {
    //                 currency: "CAD",
    //             }
    //         };

    //         // Generate PDF using EasyInvoice
    //         const result = await easyinvoice.default.createInvoice(data as any);
    //         return result;
    //     } catch (error) {
    //         console.error("Error generating invoice PDF:", error);
    //         throw error;
    //     }
    // };

    // const handleDownload = async () => {
    //     if (!isOpen) {
    //         toast.error("Cannot generate PDF: Invoice not available");
    //         return;
    //     }

    //     setIsDownloading(true);

    //     try {
    //         const result = await generateInvoicePDF();
            
    //         // Create a download link for the PDF
    //         const link = document.createElement('a');
    //         link.href = `data:application/pdf;base64,${result.pdf}`;
    //         link.download = `invoice-${invoice.invoiceNumber}.pdf`;
    //         link.click();
            
    //         toast.success("Invoice downloaded successfully");
    //     } catch (error) {
    //         console.error("Error downloading invoice:", error);
    //         toast.error("Failed to download invoice");
    //     } finally {
    //         setIsDownloading(false);
    //     }
    // };

    const toggleStatus = async () => {
        try {
            const newStatus = status === "PAID" ? "UNPAID" : "PAID";
            setStatus(newStatus);
            // toast.success(`Invoice #${invoice.displayNumber} updated to ${newStatus}`);
        } catch (error) {
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

    // const handleShowInvoice = () => {
    //     window.open(`/invoices/${invoice.invoiceNumber}`, '_blank');
    // };

    // Update the sendInvoice function to include proper validation
    // const sendInvoice = async () => {
    //     if (!invoice.clientEmail) {
    //         toast.error("Client email is required to send the invoice");
    //         return;
    //     }

    //     setIsSending(true);
        
    //     try {
    //         // Generate the PDF on the client side
    //         const result = await generateInvoicePDF();
            
    //         const emailData = {
    //             to: invoice.clientEmail,
    //             subject: `Invoice #${invoice.displayNumber} from ${invoice.shopName || ""}`,
    //             body: `Dear ${invoice.clientName || "Customer"},\n\nPlease find attached the invoice #${invoice.displayNumber} for your recent service.\n\nThank you for choosing ${invoice.shopName || "us"}!`,
    //             shopName: invoice.shopName || "",
    //             attachments: [
    //                 {
    //                     filename: `invoice-${invoice.invoiceNumber}.pdf`,
    //                     content: result.pdf // This is already base64 encoded from easyinvoice
    //                 }
    //             ]
    //         };

    //         await sendInvoiceEmail(
    //             invoice.clientEmail, 
    //             emailData, 
    //             invoice.clientName || "Customer", 
    //             invoice.invoiceNumber
    //         );
    //         toast.success(`Invoice #${invoice.displayNumber} sent to ${invoice.clientEmail}`);
    //     } catch (error) {
    //         console.error("Error sending invoice email:", error);
    //         toast.error("Failed to send invoice email: " + (error as Error).message);
    //     } finally {
    //         setIsSending(false);
    //     }
    // };

    // Format amount to display as currency
    
    const formatAmount = (amount: string) => {
        const numAmount = parseFloat(amount);
        return !isNaN(numAmount) 
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numAmount) 
            : amount;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleDownload = async () => {
        try {
            const result = await generateInvoicePDF(invoice);
            if (result) {
                console.log("Invoice downloaded successfully");
                toast.success("Invoice downloaded successfully");
            } else {
                toast.error("Failed to download invoice");
            }
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("Failed to download invoice");
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
                                Issued on: {formatDate(invoice.issueDate)}
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
                                <p className="text-gray-400 text-sm">{invoice.shopPhone}</p>
                            </div>
                    
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">Client Information</h3>
                                <p className="text-white font-medium">{invoice.clientName}</p>
                                <p className="text-gray-400 text-sm">{invoice.clientAddress}</p>
                                <p className="text-gray-400 text-sm">{invoice.clientEmail}</p>
                                <p className="text-gray-400 text-sm">{invoice.clientPhone}</p>
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
                            <h3 className="text-lg font-semibold text-white">Work Order Details</h3>
                            
                            {invoice.description && (
                                <div className="mb-2">
                                    <p className="text-white font-medium">Description:</p>
                                    <p className="text-gray-400">{invoice.description}</p>
                                </div>
                            )}
                            
                            {invoice.labour && (
                                <div className="mb-2">
                                    <p className="text-white font-medium">Labour:</p>
                                    <p className="text-gray-400 whitespace-pre-line">{invoice.labour}</p>
                                </div>
                            )}
                            
                            {invoice.parts && (
                                <div className="mb-2">
                                    <p className="text-white font-medium">Parts:</p>
                                    <p className="text-gray-400">{invoice.parts}</p>
                                </div>
                            )}
                            
                            {invoice.notes && (
                                <div className="mb-2">
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
                    {/* <Button 
                        className="bg-[#007bff] text-white w-full sm:w-auto hover:bg-[#0056b3] border-none" 
                        onClick={sendInvoice}
                        disabled={isSending}
                    >
                        <MailIcon className="w-4 h-4" />
                        {isSending ? "Sending..." : "Send Invoice"}
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