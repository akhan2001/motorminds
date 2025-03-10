interface InvoiceFilterProps {
    title: string
    todayCount: number
    monthCount: number
    active?: boolean
    onClick?: () => void
}
  
export function InvoiceFilter({
    title,
    todayCount,
    monthCount,
    active = false,
    onClick,
}: InvoiceFilterProps) {
    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-lg min-w-[20%] transition-all duration-200 hover:shadow-md ${
                active 
                    ? "bg-[#131313] border border-[#222]" 
                    : "border border-[#222] hover:border-gray-500"
            } cursor-pointer`}
        >
            <h3 className="text-xl font-bold mb-3 text-white flex items-center">
                {title}
            </h3>
            <div className="space-y-2 text-gray-400">
                <p className="flex justify-between">
                    <span>Today:</span> 
                    <span className={`font-medium ${todayCount > 0 ? "text-white" : ""}`}>{todayCount}</span>
                </p>
                <p className="flex justify-between">
                    <span>This Month:</span> 
                    <span className={`font-medium ${monthCount > 0 ? "text-white" : ""}`}>{monthCount}</span>
                </p>
            </div>
        </div>
    )
}
  