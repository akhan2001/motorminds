'use client'

import { useState, useMemo } from 'react'
import { type WorkOrder } from '@/hooks/use-work-orders'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import { WorkOrderSummary } from './WorkOrderSummary'
import { WorkOrderStatusColumn } from './WorkOrderStatusColumn'

// Constants for color mappings. This is good practice for reusability and consistency.
const STATUS_COLORS: Record<string, string> = {
    'Pending': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'In Progress': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'Completed': 'bg-green-500/20 text-green-400 border border-green-500/30',
    'Waiting on Customer': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'Cancelled': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
}

const PRIORITY_COLORS: Record<string, string> = {
    'High': 'bg-red-500/20 text-red-400 border border-red-500/30',
    'Medium': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Low': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
}

interface WorkOrderListProps {
    shopId: string;
    workOrders: WorkOrder[] | undefined;
    isLoading: boolean;
    error: any;
    onWorkOrderClick: (order: WorkOrder) => void;
}

export function WorkOrderList({ shopId, workOrders, isLoading, error, onWorkOrderClick }: WorkOrderListProps) {
    const [view, setView] = useState<'card' | 'list'>('card');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const filteredWorkOrders = useMemo(() => {
        if (!workOrders) return [];
        if (!statusFilter) return workOrders;
        return workOrders.filter(order => order.status === statusFilter);
    }, [workOrders, statusFilter]);

    const groupedOrders = useMemo(() => {
        if (!filteredWorkOrders) return {};
        return filteredWorkOrders.reduce((acc, order) => {
            const status = order.status || 'Pending';
            if (!acc[status]) {
                acc[status] = [];
            }
            acc[status].push(order);
            return acc;
        }, {} as Record<string, WorkOrder[]>);
    }, [filteredWorkOrders]);
    
    const allGroupedOrdersForSummary = useMemo(() => {
        if (!workOrders) return {};
        return workOrders.reduce((acc, order) => {
            const status = order.status || 'Pending';
            if (!acc[status]) {
                acc[status] = [];
            }
            acc[status].push(order);
            return acc;
        }, {} as Record<string, WorkOrder[]>);
    }, [workOrders]);

    const statusOrder = ['Pending', 'In Progress', 'Waiting on Customer', 'Completed', 'Cancelled'];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b22222]"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center py-10">Error fetching work orders. Please try again later.</div>;
    }

    if (!workOrders || workOrders.length === 0) {
        return <div className="text-center text-gray-400 py-10">No work orders found.</div>;
    }

    return (
        <div>
            <WorkOrderSummary 
                groupedOrders={allGroupedOrdersForSummary} 
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
            />

            <div className="flex justify-end items-center mb-6">
                <div className="flex items-center gap-2 p-1 rounded-lg bg-[#222222] border border-[#333333]">
                    <Button
                        variant={view === 'card' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setView('card')}
                        className={`data-[state=active]:bg-[#333]`}
                        data-state={view === 'card' ? 'active' : 'inactive'}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </Button>
                    <Button
                        variant={view === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setView('list')}
                        className={`data-[state=active]:bg-[#333]`}
                        data-state={view === 'list' ? 'active' : 'inactive'}
                    >
                        <List className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="space-y-12">
                {statusOrder.map(status => {
                    if (groupedOrders[status] && groupedOrders[status].length > 0) {
                        return (
                            <WorkOrderStatusColumn
                                key={status}
                                title={status}
                                orders={groupedOrders[status]}
                                view={view}
                                statusColors={STATUS_COLORS}
                                priorityColors={PRIORITY_COLORS}
                                onWorkOrderClick={onWorkOrderClick}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
} 