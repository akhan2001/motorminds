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
    onClick, // accept the onClick prop
  }: InvoiceFilterProps) {
    return (
      <div
        // attach onClick here and add cursor-pointer
        onClick={onClick}
        className={`p-4 rounded-lg min-w-[20%] ${
          active ? "bg-[#131313]" : "border border-[#232323] border-2"
        } cursor-pointer`} // "cursor-pointer" for a clickable look
      >
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <div className="space-y-1 text-gray-400">
          <p>Today: {todayCount}</p>
          <p>This Month: {monthCount}</p>
        </div>
      </div>
    )
  }
  