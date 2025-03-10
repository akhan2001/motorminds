import { motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react';
import { InvoiceDialog } from './InvoiceDialog';

interface InvoiceCardProps {
    invoiceNumber: string
    status: string
    shopName: string
    shopAddress: string
    shopEmail: string
    amount: string
    labour: string
    parts: string
    notes: string
    mileage: string
    description: string
    assignedTo: string
    issueDate: string
    clientName: string
    clientAddress: string
    clientEmail: string
    workOrder: string
}

export function InvoiceCard(props: InvoiceCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleCardClick = () => {
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#131313] rounded-lg p-6 w-full cursor-pointer"
                whileHover={{ scale: 1.005 }}
                onClick={handleCardClick}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            Invoice # {props.invoiceNumber} <span className={`${props.status === 'PAID' ? 'text-green-500' : 'text-red-500'}`}>({props.status})</span>
                        </h3>
                        <p className="text-gray-400">{props.workOrder ? props.workOrder : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">{props.shopName}</p>
                        <p className="text-sm text-gray-400">{props.shopAddress}</p>
                        <p className="text-sm text-gray-400">{props.shopEmail}</p>
                    </div>
                </div>
                
                <Separator className="my-3 bg-gray-800" />
                <div className="flex justify-between items-start text-gray-400">
                    <div>
                        <p className="text-xs uppercase mb-1">BILL TO</p>
                        <p className="font-medium">{props.clientName}</p>
                        <p className="text-sm">{props.clientAddress}</p>
                        <p className="text-sm">{props.clientEmail}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase mb-1">AMOUNT DUE</p>
                        <p className="text-xl font-bold text-red-500">{props.amount}</p>
                        <p className="text-sm text-gray-400">Issued on: {props.issueDate}</p>
                    </div>
                </div>
            </motion.div>

            <InvoiceDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                invoice={props}
            />
        </>
    )
}

