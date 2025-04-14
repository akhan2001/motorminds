import { getCustomers } from "@/app/customers/api/customer-utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { useEffect } from "react"
import { CustomerCard } from "./customer-card-component"
import { Customer } from "@/app/customers/components/customer-interface"

export function CustomersComponent({ shopId }: { shopId: string }) {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Skip fetching if shopId is empty or invalid
        if (!shopId || shopId === "") {
            setIsLoading(false)
            return
        }
        
        setIsLoading(true)
        getCustomers(shopId)
            .then(setCustomers)
            .finally(() => setIsLoading(false))
    }, [shopId])

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-2">Customers</h2>
            <div className="bg-[#131313] rounded-md p-3 flex-1 w-full min-h-0 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-250px)] md:h-[550px]">
                    {isLoading || customers.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            {!shopId || shopId === "" 
                                ? "Please select a shop to view customers" 
                                : "Loading customers..."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 pr-4">
                            {customers.map((customer) => (
                                <CustomerCard key={customer.id} customer={customer} />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    )
}
