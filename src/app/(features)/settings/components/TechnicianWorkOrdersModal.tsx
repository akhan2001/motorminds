"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { EmployeeService } from "@/app/(features)/employees/lib/employee-service"

interface WorkOrder {
    id: string
    work_order_number: string
    title: string
    status: string
    priority: string
    created_at: string
    updated_at: string
}

interface TechnicianWorkOrdersModalProps {
    technicianId: string
    technicianName: string
    shopId: string
    isOpen: boolean
    onClose: () => void
}

const statusColors: Record<string, string> = {
    pending: 'bg-gray-500',
    approved: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    waiting_parts: 'bg-orange-500',
    waiting_customer: 'bg-orange-500',
    ready: 'bg-green-500',
    completed: 'bg-green-600',
    invoiced: 'bg-purple-500',
    cancelled: 'bg-red-500',
    on_hold: 'bg-gray-400',
}

const priorityColors: Record<string, string> = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
}

const formatStatus = (status: string): string => {
    return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

const formatPriority = (priority: string): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export function TechnicianWorkOrdersModal({
    technicianId,
    technicianName,
    shopId,
    isOpen,
    onClose,
}: TechnicianWorkOrdersModalProps) {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && technicianId && shopId) {
            loadWorkOrders()
        } else {
            // Reset state when modal closes
            setWorkOrders([])
            setError(null)
        }
    }, [isOpen, technicianId, shopId])

    const loadWorkOrders = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await EmployeeService.getWorkOrdersByTechnician(technicianId, shopId)
            setWorkOrders(data)
        } catch (err: any) {
            console.error("Error loading work orders:", err)
            setError(err.message || "Failed to load work orders")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white dark:bg-card border-border text-foreground max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                    <DialogTitle>
                        Work Orders - {technicianName}
                    </DialogTitle>
                    <DialogDescription>
                        View all work orders assigned to this technician
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500">{error}</p>
                        </div>
                    ) : workOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                No work orders assigned to this technician.
                            </p>
                        </div>
                    ) : (
                        <div className="border border-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Work Order #</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {workOrders.map((workOrder) => (
                                            <TableRow key={workOrder.id}>
                                                <TableCell className="font-medium">
                                                    {workOrder.work_order_number}
                                                </TableCell>
                                                <TableCell>{workOrder.title}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${statusColors[workOrder.status] || 'bg-gray-500'} text-white`}
                                                    >
                                                        {formatStatus(workOrder.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${priorityColors[workOrder.priority] || 'bg-gray-500'} text-white`}
                                                    >
                                                        {formatPriority(workOrder.priority)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(workOrder.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

