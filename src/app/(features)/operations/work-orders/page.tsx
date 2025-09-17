'use client'

import { Nav } from "@/app/components/nav";
import { WorkOrderKanban, WorkOrderHeader } from "../components/work-orders";
import { useWorkOrderStats } from "../hooks/use-work-order-stats";
import type { WorkOrderKanbanColumn, WorkOrderKanbanItem } from "../types/work-order";
import mockWorkOrdersData from "../mock-work-orders.json";

// Type assertion for imported JSON data
const mockKanbanData = mockWorkOrdersData as WorkOrderKanbanColumn[];

export default function WorkOrdersPage() {
    // Calculate stats using custom hook
    const stats = useWorkOrderStats(mockKanbanData)

    // Handle work order card clicks
    const handleCardClick = (item: WorkOrderKanbanItem) => {
        console.log('Work order clicked:', item)
        // TODO: Navigate to work order details page or open modal
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <WorkOrderHeader 
                    totalCount={stats.totalCount}
                    pendingCount={stats.pendingCount}
                    inProgressCount={stats.inProgressCount}
                    completedCount={stats.completedCount}
                />
                <div className="flex-1 overflow-hidden">
                    <WorkOrderKanban 
                        columns={mockKanbanData}
                        onCardClick={handleCardClick}
                    />
                </div>
            </div>
        </div>
    )
}