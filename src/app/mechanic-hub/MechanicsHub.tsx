'use client'

import { useWorkOrders } from '@/hooks/use-work-orders'
import { WorkOrderList } from './components/WorkOrderList'
import { WorkOrderFormDialog } from "./components/work-order/WorkOrderFormDialog"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

interface MechanicsHubProps {
    shopId: string
}

export default function MechanicsHub({ shopId }: MechanicsHubProps) {
    const { data: workOrders, isLoading, error, mutate } = useWorkOrders(shopId)

    return (
        <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 bg-gray-50/50 dark:bg-gray-900/50">
            <header className="flex items-center justify-between pb-4 border-b">
                <h1 className="text-2xl font-bold">Work Orders</h1>
                <div className="flex items-center gap-4">
                    <WorkOrderFormDialog onSuccess={mutate} />
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                </div>
            </header>
            <div className="mt-4">
                <WorkOrderList 
                    shopId={shopId} 
                    workOrders={workOrders}
                    isLoading={isLoading}
                    error={error}
                    onWorkOrderClick={() => {}}
                />
            </div>
        </div>
    )
} 