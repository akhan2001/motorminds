import { Card, CardDescription } from "@/components/ui/card";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Wrench, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatDate } from "@/app/invoices/utils/invoice-utils";
import { useState } from "react";
import { TaskDetailsModal } from "@/components/task-details-modal";
import { supabase } from "@/lib/supabase";

interface CustomerHistoryCardProps {
    workOrders: any[];
    shopId: string;
}

export function CustomerHistoryCard({ workOrders, shopId }: CustomerHistoryCardProps) {
    const router = useRouter();
    const [selectedTask, setSelectedTask] = useState<any>(null);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'in_progress':
            case 'in progress':
                return 'bg-yellow-500';
            case 'completed':
                return 'bg-green-500';
            case 'pending':
                return 'bg-red-500';
            case 'cancelled':
                return 'bg-gray-500';
            default:
                return 'bg-blue-500';
        }
    }

    async function handleViewDetails(orderId: string) {
        try {
            // Fetch the full work order details
            const { data, error } = await supabase
                .from("work_orders")
                .select(`
                    *,
                    customers(
                        *,
                        customer_vehicles(*)
                    ),
                    customer_vehicles(*),
                    employees(first_name, last_name)
                `)
                .eq("id", orderId)
                .single();

            if (error) {
                console.error("Error fetching work order details:", error);
                return;
            }
            
            if (data) {
                setSelectedTask(data);
            }
        } catch (err) {
            console.error("Error handling view details:", err);
        }
    }

    async function handleSaveTask(updated: any) {
        try {
            // Update work order
            const { error: mainErr } = await supabase
                .from("work_orders")
                .update({ 
                    status: updated.status,
                    title: updated.title,
                    description: updated.description,
                    notes: updated.notes,
                    priority: updated.priority,
                    updated_at: new Date().toISOString()
                })
                .eq("id", updated.id);
            
            if (mainErr) throw mainErr;

            // Close the modal
            setSelectedTask(null);
        } catch (err) {
            console.error("Error saving work order:", err);
        }
    }

    function handleCloseModal() {
        setSelectedTask(null);
    }

    return (
        <div className="space-y-4">
            {workOrders.length > 0 ? (
                workOrders.map((order) => (
                    <Card key={order.id} className="bg-[#1A1A1A] border-[#333] text-white overflow-hidden hover:border-[#444] transition-colors">
                        <div className={`h-1 ${getStatusColor(order.status)}`}></div>
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center mb-2">
                                        <Wrench className="h-5 w-5 mr-2 text-blue-400" />
                                        {order.title || 'Work Order'}
                                    </CardTitle>
                                    <CardDescription className="text-gray-300 mb-2">
                                        {order.customer_vehicles?.year} {order.customer_vehicles?.make} {order.customer_vehicles?.model}
                                    </CardDescription>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-500">Created:</span>
                                            <span>{formatDate(order.created_at)}</span>
                                        </div>
                                        {order.completed_at && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Completed:</span>
                                                <span>{formatDate(order.completed_at)}</span>
                                            </div>
                                        )}
                                        {order.work_order_number && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Order #:</span>
                                                <span>{order.work_order_number}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge className={`${getStatusColor(order.status).replace('bg-', 'bg-opacity-20 text-').replace('500', '400')} border-0 px-3 py-1`}>
                                        {order.status}
                                    </Badge>
                                    {order.priority && (
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">Priority</div>
                                            <div className="text-sm font-semibold text-orange-400 capitalize">
                                                {order.priority}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="py-0">
                            {order.description && (
                                <div className="bg-[#0f0f0f] rounded-md p-3 mb-3">
                                    <div className="text-xs text-gray-500 mb-1">Description:</div>
                                    <div className="text-sm text-gray-300 line-clamp-2">
                                        {order.description}
                                    </div>
                                </div>
                            )}
                            {order.notes && (
                                <div className="bg-[#0f0f0f] rounded-md p-3 mb-3">
                                    <div className="text-xs text-gray-500 mb-1">Notes:</div>
                                    <div className="text-sm text-gray-300 line-clamp-2">
                                        {order.notes}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {order.assigned_technician_id && order.employees && (
                                    <div>
                                        <div className="text-gray-500 text-xs">Technician</div>
                                        <div className="text-gray-300">
                                            {order.employees.first_name} {order.employees.last_name}
                                        </div>
                                    </div>
                                )}
                                {order.started_at && (
                                    <div>
                                        <div className="text-gray-500 text-xs">Started</div>
                                        <div className="text-gray-300">{formatDate(order.started_at)}</div>
                                    </div>
                                )}
                                {order.tags && order.tags.length > 0 && (
                                    <div>
                                        <div className="text-gray-500 text-xs">Tags</div>
                                        <div className="text-gray-300">
                                            {order.tags.map((tag: string, index: number) => (
                                                <span key={index} className="inline-block bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs mr-1 mb-1">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {order.attachments && order.attachments.length > 0 && (
                                    <div>
                                        <div className="text-gray-500 text-xs">Attachments</div>
                                        <div className="text-gray-300">{order.attachments.length} file(s)</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-[#333] pt-4">
                            <Button 
                                variant="outline" 
                                className="border border-[#444] text-gray-300 hover:bg-[#333] hover:text-white w-full"
                                onClick={() => handleViewDetails(order.id)}
                            >
                                View Details
                            </Button>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-[#1A1A1A] rounded-lg border border-[#333]">
                    <History className="h-12 w-12 text-gray-500 mb-3" />
                    <h3 className="text-xl font-semibold mb-2">No Work History</h3>
                    <p className="text-gray-400 text-center mb-4">This customer doesn't have any work orders yet.</p>
                    <Button className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Work Order
                    </Button>
                </div>
            )}

            {/* Task Details Modal */}
            {selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    onClose={handleCloseModal}
                    onSave={handleSaveTask}
                    shopId={shopId}
                />
            )}
        </div>
    )
}