import { motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'

interface InvoiceCardProps {
    invoiceNumber: string
    status: string
    shopName: string
    shopAddress: string
    shopEmail: string
    amount: string
    issueDate: string
    clientName: string
    clientAddress: string
    clientEmail: string
}

export function InvoiceCard({
    invoiceNumber,
    status,
    shopName,
    shopAddress,
    shopEmail,
    amount,
    issueDate,
    clientName,
    clientAddress,
    clientEmail,
}: InvoiceCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[#131313] rounded-lg p-6 w-full"
            whileHover={{ scale: 1.005 }}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                    Invoice # {invoiceNumber} <span className={`${status === 'PAID' ? 'text-green-500' : 'text-red-500'}`}>({status})</span>
                    </h3>
                    <p className="text-gray-400">{invoiceNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">{shopName}</p>
                    <p className="text-sm text-gray-400">{shopAddress}</p>
                    <p className="text-sm text-gray-400">{shopEmail}</p>
                </div>
            </div>
            <Separator className="my-3 bg-gray-800" />
            <div className="flex justify-between items-start text-gray-400">
                <div>
                    <p className="text-xs uppercase mb-1">BILL TO</p>
                    <p className="font-medium">{clientName}</p>
                    <p className="text-sm">{clientAddress}</p>
                    <p className="text-sm">{clientEmail}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase mb-1">AMOUNT DUE</p>
                    <p className="text-xl font-bold text-red-500">{amount}</p>
                    <p className="text-sm text-gray-400">Issued on: {issueDate}</p>
                </div>
            </div>
        </motion.div>
    )
}

