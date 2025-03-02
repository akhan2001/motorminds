interface InvoiceCardProps {
    invoiceNumber: string
    status: string
    shopName: string
    shopAddress: string
    shopEmail: string
    amount: number
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
    <div className="bg-gray-900 rounded-lg p-6 w-full">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                Invoice #{invoiceNumber} <span>({status})</span>
                </h3>
                <p className="text-gray-400">{invoiceNumber}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-400">{shopName}</p>
                <p className="text-sm text-gray-400">{shopAddress}</p>
                <p className="text-sm text-gray-400">{shopEmail}</p>
            </div>
        </div>

        <div className="flex justify-between items-start">
            <div>
                <p className="text-xs text-gray-400 uppercase mb-1">BILL TO</p>
                <p className="font-medium">{clientName}</p>
                <p className="text-sm text-gray-400">{clientAddress}</p>
                <p className="text-sm text-gray-400">{clientEmail}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-400 uppercase mb-1">AMOUNT DUE</p>
                <p className="text-xl font-bold text-red-500">${amount}</p>
                <p className="text-sm text-gray-400">Issued on: {issueDate}</p>
            </div>
        </div>
    </div>
    )
}

