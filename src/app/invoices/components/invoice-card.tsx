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
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                        <h3 className="text-lg sm:text-xl font-bold flex flex-wrap items-center gap-2 text-white">
                            Invoice # {displayNumber || invoiceNumber} 
                            <span className={`${status === 'PAID' ? 'text-green-500' : 'text-red-500'}`}>
                                ({status})
                            </span>
                        </h3>
                        {shopName && <p className="text-gray-400 text-sm">{shopName}</p>}
                        {shopAddress && <p className="text-gray-400 text-sm">{shopAddress}</p>}
                    </div>
                    <div className="text-left sm:text-right text-gray-400 w-full sm:w-auto">
                        <p className="text-xs uppercase mb-1">BILL TO</p>
                        <p className="font-medium">{clientName}</p>
                        <p className="text-sm">{clientAddress}</p>
                        <p className="text-sm">{clientEmail}</p>
                    </div>
                </div>
                
                <Separator className="my-3 bg-gray-800" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 text-gray-400">
                    <div>
                        <p className="text-xs uppercase mb-1">VEHICLE</p>
                        <p className="font-medium">{vehicleDisplay}</p>
                        {vehicleInfo.license_plate && vehicleInfo.license_plate !== "NULL" && <p className="text-sm">{vehicleInfo.license_plate}</p>}
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0 w-full sm:w-auto">
                        <p className="text-xs text-gray-400 uppercase mb-1">
                            {status === "PAID" ? "AMOUNT PAID" : "AMOUNT DUE"}
                        </p>
                        {status === "PAID" ? 
                            <p className="text-xl font-bold text-green-500">{amount}</p> : 
                            <p className="text-xl font-bold text-red-500">{amount}</p>
                        }
                        <p className="text-sm text-gray-400">Issued on: {issueDate}</p>
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

