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
            className={`p-4 rounded-lg w-full min-w-[200px] transition-all duration-200 hover:shadow-md ${
                active 
                    ? "bg-slate-50 dark:bg-card border border-red-600 dark:border-red-500" 
                    : "bg-white dark:bg-card border border-border hover:border-red-600 dark:hover:border-red-500"
            } cursor-pointer`}
        >
            <h3 className="text-xl font-bold mb-3 text-foreground flex items-center">
                {title}
            </h3>
            <div className="space-y-2 text-muted-foreground">
                <p className="flex justify-between">
                    <span>Today:</span> 
                    <span className={`font-medium ${todayCount > 0 ? "text-foreground" : ""}`}>{todayCount}</span>
                </p>
                <p className="flex justify-between">
                    <span>This Month:</span> 
                    <span className={`font-medium ${monthCount > 0 ? "text-foreground" : ""}`}>{monthCount}</span>
                </p>
            </div>
        </div>
    )
}
  