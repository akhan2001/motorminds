'use client'

import { type WorkOrder } from '@/hooks/use-work-orders';
import { Badge } from '@/components/ui/badge';
import { Folder, FolderCheck, FolderClock, FolderCog, FolderX } from 'lucide-react';

const STATUS_ICONS: Record<string, React.ElementType> = {
    'Pending': FolderClock,
    'In Progress': FolderCog,
    'Completed': FolderCheck,
    'Waiting on Customer': Folder,
    'Cancelled': FolderX,
};

const STATUS_COLORS_SUMMARY: Record<string, string> = {
    'Pending': 'border-yellow-500/50',
    'In Progress': 'border-blue-500/50',
    'Completed': 'border-green-500/50',
    'Waiting on Customer': 'border-orange-500/50',
    'Cancelled': 'border-gray-500/50',
}

interface WorkOrderSummaryProps {
    groupedOrders: Record<string, WorkOrder[]>;
}

export function WorkOrderSummary({ groupedOrders }: WorkOrderSummaryProps) {
    const totalOrders = Object.values(groupedOrders).reduce((acc, orders) => acc + orders.length, 0);

    const summaryOrder = ['Pending', 'In Progress', 'Waiting on Customer', 'Completed', 'Cancelled'];
    
    // Ensure all statuses are present for consistent ordering
    const finalGroupedOrders = summaryOrder.reduce((acc, status) => {
        acc[status] = groupedOrders[status] || [];
        return acc;
    }, {} as Record<string, WorkOrder[]>);

    return (
        <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(finalGroupedOrders).map(([status, orders]) => {
                    const Icon = STATUS_ICONS[status] || Folder;
                    return (
                        <div key={status} className={`bg-[#222222] p-4 rounded-lg border ${STATUS_COLORS_SUMMARY[status] || 'border-[#333333]'}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-400">{status}</h3>
                                <Icon className="h-5 w-5 text-gray-500" />
                            </div>
                            <p className="text-2xl font-bold text-white mt-2">{orders.length}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 