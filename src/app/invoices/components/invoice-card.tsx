import { motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react';
import { InvoiceDialog } from './InvoiceDialog';

// Simplified props interface with only the properties needed for display
interface InvoiceCardProps {
    // Display information
    invoiceNumber: string
    displayNumber?: string
    status: string
    amount: string
    issueDate: string
    shopName: string
    shopAddress: string
    clientName: string
    clientAddress?: string
    clientEmail?: string
    workOrder?: string
    description?: string
    poNumber?: string
    vehicleInfo?: {
        year?: string
        make?: string
        model?: string
        license_plate?: string
    }
    source?: "customer_generated" | "shop_generated"
    estimatedAmount?: number
    customerNotes?: string
    taxRate?: number
    onClick?: () => void
    onStatusChange?: () => void
}

export function InvoiceCard({
    invoiceNumber,
    displayNumber,
    status,
    amount,
    issueDate,
    shopName,
    shopAddress,
    clientName,
    clientAddress,
    clientEmail,
    workOrder,
    description,
    poNumber,
    vehicleInfo = {},
    source,
    estimatedAmount,
    customerNotes,
    taxRate,
    onClick,
    onStatusChange,
}: InvoiceCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCardClick = () => {
        if (onClick) {
            // Use parent-provided click handler if available
            onClick();
        } else {
            // Otherwise, use local dialog state
            setIsDialogOpen(true);
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        // Notify parent when dialog closes (for refresh)
        if (onStatusChange) {
            onStatusChange();
        }
    };

    // Format vehicle info for display
    const vehicleDisplay = vehicleInfo && 
        [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model]
            .filter(Boolean)
            .join(' ');

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-card rounded-lg p-4 sm:p-6 w-full cursor-pointer hover:bg-slate-50 dark:hover:bg-muted border border-border"
                whileHover={{ scale: 1.005 }}
                onClick={handleCardClick}
            >
                {/* Top Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    {/* Invoice Number and Status - Top Left */}
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold flex flex-wrap items-center gap-2 text-foreground">
                            {description || workOrder || "No description available"} Invoice
                            <span className={`${status === 'PAID' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-sm px-2 py-0.5 rounded-full border ${status === 'PAID' ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
                                {status}
                            </span>
                            {source === 'customer_generated' && (
                                <span className="text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                                    Customer Request
                                </span>
                            )}
                        </h3>
                    </div>
                    {/* Description/Title - Top Right */}
                    <div className="text-right text-muted-foreground">
                        {/* <p className="font-medium text-foreground">{description || workOrder || "No description available"}</p> */}
                        Invoice #{displayNumber || invoiceNumber}
                        {poNumber && (
                            <p className="text-xs text-muted-foreground mt-1">PO: {poNumber}</p>
                        )}
                        {source === 'customer_generated' && estimatedAmount && estimatedAmount > 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Est. Budget: ${estimatedAmount.toFixed(2)}</p>
                        )}
                    </div>
                </div>
                
                <Separator className="my-4 bg-border" />
                
                {/* Bottom Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Customer Info - Bottom Left */}
                    <div>
                        <p className="text-xs uppercase mb-1 text-muted-foreground">CUSTOMER</p>
                        <p className="font-medium text-foreground">{clientName}</p>
                        <p className="text-sm text-muted-foreground">{clientAddress}</p>
                        <p className="text-sm text-muted-foreground">{clientEmail}</p>
                    </div>
                    {/* Vehicle Info - Bottom Middle */}
                    <div>
                        <p className="text-xs uppercase mb-1 text-muted-foreground">VEHICLE</p>
                        <p className="font-medium text-foreground">{vehicleDisplay}</p>
                        {vehicleInfo.license_plate && vehicleInfo.license_plate !== "NULL" && 
                            <p className="text-sm text-muted-foreground">Plate: {vehicleInfo.license_plate}</p>
                        }
                    </div>
                    {/* Amount - Bottom Right */}
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase mb-1">
                            {status === "PAID" ? "AMOUNT PAID" : "AMOUNT DUE"}
                        </p>
                        <p className={`text-2xl font-bold ${status === "PAID" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {(() => {
                                // Extract numeric value from amount string (remove $ and commas)
                                const numericAmount = parseFloat(amount.replace(/[$,]/g, ''))
                                // Add 13% tax
                                const amountWithTax = numericAmount * 1.13
                                return `$${amountWithTax.toFixed(2)}`
                            })()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Issued on: {issueDate}</p>
                    </div>
                </div>
                
                {/* Customer Notes - Only show for customer-generated invoices */}
                {source === 'customer_generated' && customerNotes && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded-md">
                        <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mb-1">Customer Request:</p>
                        <p className="text-sm text-blue-700 dark:text-blue-100">{customerNotes}</p>
                    </div>
                )}
            </motion.div>

            {/* Only render dialog if using local state approach
            {!onClick && (
                <InvoiceDialog
                    isOpen={isDialogOpen}
                    onClose={handleCloseDialog}
                    shopId={shopId}
                    invoice={fullInvoice}
                />
            )} */}
        </>
    )
}

