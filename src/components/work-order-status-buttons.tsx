'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface WorkOrderStatusButtonsProps {
    workOrderId: string
    initialStatus: string
    onStatusChange?: (newStatus: string) => void
}

type StatusType = "not-started" | "in-progress" | "completed"

export function WorkOrderStatusButtons({ workOrderId, initialStatus, onStatusChange }: WorkOrderStatusButtonsProps) {
    const [status, setStatus] = useState<StatusType>(mapDbStatusToLocal(initialStatus))
    const [isUpdating, setIsUpdating] = useState(false)

    function mapDbStatusToLocal(dbStatus: string): StatusType {
        switch (dbStatus) {
            case "In Progress":
                return "in-progress"
            case "Completed":
                return "completed"
            case "Pending":
            default:
                return "not-started"
        }
    }

    function mapLocalStatusToDb(local: StatusType) {
        switch (local) {
            case "in-progress":
                return "In Progress"
            case "completed":
                return "Completed"
            case "not-started":
            default:
                return "Pending"
        }
    }

    async function handleStatusChange(newStatus: StatusType) {
        if (isUpdating) return; // Prevent multiple clicks while updating
        
        try {
            setIsUpdating(true);
            const dbStatus = mapLocalStatusToDb(newStatus);
            
            // Update the database
            const { error } = await supabase
                .from("repair_orders")
                .update({ status: dbStatus })
                .eq("id", workOrderId);

            if (error) throw error;

            // Update local state
            setStatus(newStatus);
            if (onStatusChange) {
                onStatusChange(dbStatus);
            }
            
            toast.success(`Status updated to ${dbStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
            // Revert to previous status on error
            setStatus(status);
        } finally {
            setIsUpdating(false);
        }
    }

    return (
        <div className="flex items-center gap-4 p-4 border-b border-[#222222]">
            <Button
                variant="ghost"
                className={`flex items-center gap-2 transition-all duration-200 ${
                    status === "not-started" ? "text-white" : "text-gray-400"
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:text-white hover:bg-zinc-800'}`}
                onClick={() => handleStatusChange("not-started")}
                disabled={isUpdating}
            >
                <div className="w-3 h-3 rounded-full bg-[#e23232]" />
                Not Started
            </Button>
            <Button
                variant="ghost"
                className={`flex items-center gap-2 transition-all duration-200 ${
                    status === "in-progress" ? "text-white" : "text-gray-400"
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:text-white hover:bg-zinc-800'}`}
                onClick={() => handleStatusChange("in-progress")}
                disabled={isUpdating}
            >
                <div className="w-3 h-3 rounded-full bg-[#d6cd24]" />
                In Progress
            </Button>
            <Button
                variant="ghost"
                className={`flex items-center gap-2 transition-all duration-200 ${
                    status === "completed" ? "text-white" : "text-gray-400"
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:text-white hover:bg-zinc-800'}`}
                onClick={() => handleStatusChange("completed")}
                disabled={isUpdating}
            >
                <div className="w-3 h-3 rounded-full bg-[#1eb386]" />
                Completed
            </Button>
        </div>
    )
} 