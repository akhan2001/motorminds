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
    vehicleInfo?: {
        year?: string
        make?: string
        model?: string
        license_plate?: string
    }
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
    vehicleInfo = {},
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
                className="bg-[#131313] rounded-lg p-4 sm:p-6 w-full cursor-pointer hover:bg-[#1a1a1a]"
                whileHover={{ scale: 1.005 }}
                onClick={handleCardClick}
            >
                {/* Top Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    {/* Invoice Number and Status - Top Left */}
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold flex flex-wrap items-center gap-2 text-white">
                            {description || workOrder || "No description available"} Invoice
                            <span className={`${status === 'PAID' ? 'text-green-500' : 'text-red-500'} text-sm px-2 py-0.5 rounded-full border ${status === 'PAID' ? 'border-green-800' : 'border-red-800'}`}>
                                {status}
                            </span>
                        </h3>
                    </div>
                    {/* Description/Title - Top Right */}
                    <div className="text-right text-gray-400">
                        {/* <p className="font-medium text-white">{description || workOrder || "No description available"}</p> */}
                        Invoice #{displayNumber || invoiceNumber}
                    </div>
                </div>
                
                <Separator className="my-4 bg-gray-800" />
                
                {/* Bottom Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Customer Info - Bottom Left */}
                    <div>
                        <p className="text-xs uppercase mb-1 text-gray-400">CUSTOMER</p>
                        <p className="font-medium text-white">{clientName}</p>
                        <p className="text-sm text-gray-400">{clientAddress}</p>
                        <p className="text-sm text-gray-400">{clientEmail}</p>
                    </div>
                    {/* Vehicle Info - Bottom Middle */}
                    <div>
                        <p className="text-xs uppercase mb-1 text-gray-400">VEHICLE</p>
                        <p className="font-medium text-white">{vehicleDisplay}</p>
                        {vehicleInfo.license_plate && vehicleInfo.license_plate !== "NULL" && 
                            <p className="text-sm text-gray-400">Plate: {vehicleInfo.license_plate}</p>
                        }
                    </div>
                    {/* Amount - Bottom Right */}
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase mb-1">
                            {status === "PAID" ? "AMOUNT PAID" : "AMOUNT DUE"}
                        </p>
                        <p className={`text-2xl font-bold ${status === "PAID" ? "text-green-500" : "text-red-500"}`}>
                            {amount}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">Issued on: {issueDate}</p>
                    </div>
                </div>
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

