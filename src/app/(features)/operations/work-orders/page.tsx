'use client'

import { useState } from "react";
import { Nav } from "@/app/components/nav";
import { WorkOrderKanban, WorkOrderHeader } from "../components/work-orders";
import { WorkOrderDetailsModal } from "../components/work-orders/WorkOrderModal";
import { useWorkOrderStats } from "../hooks/use-work-order-stats";
import type { WorkOrderKanbanColumn, WorkOrderKanbanItem } from "../types/work-order";
import mockWorkOrdersData from "../mock-work-orders.json";

// Type assertion for imported JSON data
const mockKanbanData = mockWorkOrdersData as WorkOrderKanbanColumn[];

export default function WorkOrdersPage() {
    // Calculate stats using custom hook
    const stats = useWorkOrderStats(mockKanbanData)
    
    // Modal state
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderKanbanItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Handle work order card clicks
    const handleCardClick = (item: WorkOrderKanbanItem) => {
        setSelectedWorkOrder(item)
        setIsModalOpen(true)
    }

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedWorkOrder(null)
    }

    // Handle work order save
    const handleWorkOrderSave = (updatedWorkOrder: WorkOrderKanbanItem) => {
        console.log('Work order updated:', updatedWorkOrder)
        // TODO: Update the work order in the data source
        setIsModalOpen(false)
    }

    // Handle work order delete
    const handleWorkOrderDelete = (workOrderId: string) => {
        console.log('Work order deleted:', workOrderId)
        // TODO: Remove the work order from the data source
        setIsModalOpen(false)
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

            {/* Work Order Details Modal */}
            {isModalOpen && selectedWorkOrder && (
                <WorkOrderDetailsModal
                    workOrder={selectedWorkOrder}
                    onClose={handleModalClose}
                    onSave={handleWorkOrderSave}
                    onDelete={handleWorkOrderDelete}
                />
            )}
        </div>
    )
}