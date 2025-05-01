interface WorkOrderDetails {
    id?: string
    description?: string
    labour?: string
    parts?: string
    notes?: string
}

export function WorkorderHoverCard({ 
    workOrder
}: { 
    workOrder: {
        id?: string
        customer_name?: string
        summary?: string
        work_order_id?: string
        work_order_details?: WorkOrderDetails
    }
}) {
    const workOrderDetails = workOrder?.work_order_details || {};
    const workOrderId = workOrder?.work_order_id || '';
    
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-[#333] pb-2">
                <h4 className="text-lg font-semibold">
                    Work Order #{workOrderId ? workOrderId.slice(-6) : 'N/A'}
                </h4>
            </div>
            
            {workOrderDetails?.description && (
                <div>
                    <div className="text-gray-400 text-xs">Title</div>
                    <p className="text-sm font-medium">{workOrderDetails.description}</p>
                </div>
            )}
            
            {(workOrderDetails?.labour || workOrderDetails?.parts) && (
                <div>
                    <div className="text-gray-400 text-xs">Work Performed</div>
                    {workOrderDetails.labour && <p className="text-sm">{workOrderDetails.labour}</p>}
                    {workOrderDetails.parts && <p className="text-sm">{workOrderDetails.parts}</p>}
                </div>
            )}
            
            {workOrder?.summary && (
                <div>
                    <div className="text-gray-400 text-xs">Follow-up</div>
                    <p className="text-sm">{workOrder.summary}</p>
                </div>
            )}
        </div>
    )
}