import { Card, CardDescription } from "@/components/ui/card";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Wrench, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatDate } from "@/app/invoices/utils/invoice-utils";
import { openRepairOrder } from "@/app/mechanic-hub/util/mechanics-hub-utils";
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
        switch (status) {
            case 'In Progress':
                return 'bg-yellow-500';
            case 'Completed':
                return 'bg-green-500';
            case 'Pending':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    }

    async function handleViewDetails(orderId: string) {
        try {
            // First update the status to "open" (keeping the existing functionality)
            await openRepairOrder(orderId);
            
            // Then fetch the full task details
            const { data, error } = await supabase
                .from("repair_orders")
                .select(`
                    *,
                    repair_order_details(*),
                    customers(
                        *,
                        customer_vehicles(*)
                    )
                `)
                .eq("id", orderId)
                .single();

            if (error) {
                console.error("Error fetching task details:", error);
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
            // 1) update status in "repair_orders"
            const { error: mainErr } = await supabase
                .from("repair_orders")
                .update({ status: updated.status })
                .eq("id", updated.id);
            
            if (mainErr) throw mainErr;

            // 2) update first detail
            const detail = updated.repair_order_details?.[0];
            if (detail?.id) {
                const { error: detailErr } = await supabase
                    .from("repair_order_details")
                    .update({
                        labour: detail.labour,
                        parts: detail.parts,
                        notes: detail.notes,
                        cost: detail.cost,
                        mileage: detail.mileage,
                        description: detail.description,
                        task_priority: detail.task_priority,
                    })
                    .eq("id", detail.id);
                
                if (detailErr) throw detailErr;
            }

            // Close the modal
            setSelectedTask(null);
        } catch (err) {
            console.error("Error saving task:", err);
        }
    }

    function handleCloseModal() {
        setSelectedTask(null);
    }

    return (
        <div className="space-y-4">
            {workOrders.length > 0 ? (
                workOrders.map((order) => (
                    <Card key={order.id} className="bg-[#1A1A1A] border-[#333] text-white overflow-hidden">
                        <div className={`h-1 ${getStatusColor(order.status)}`}></div>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center">
                                        <Wrench className="h-4 w-4 mr-2" />
                                        {order.repair_order_details?.[0]?.description || 'Work Order'}
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-gray-400">
                                        {order.customer_vehicles?.[0]?.year} {order.customer_vehicles?.[0]?.make} {order.customer_vehicles?.[0]?.model}
                                    </CardDescription>
                                </div>
                                <Badge className={getStatusColor(order.status).replace('bg-', 'bg-opacity-20 text-').replace('500', '400')}>
                                    {order.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="py-0">
                            <div className="text-sm text-gray-400">
                                <div className="flex justify-between mb-1">
                                    <span>Created:</span>
                                    <span>{formatDate(order.created_at)}</span>
                                </div>
                                {order.completed_at && (
                                    <div className="flex justify-between">
                                        <span>Completed:</span>
                                        <span>{formatDate(order.completed_at)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-[#333] mt-3 pt-3">
                            <Button 
                                variant="ghost" 
                                className="text-gray-300 hover:text-white hover:bg-[#292929] w-full"
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