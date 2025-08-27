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
    'Pending': 'border-yellow-500/50 hover:border-yellow-500',
    'In Progress': 'border-blue-500/50 hover:border-blue-500',
    'Completed': 'border-green-500/50 hover:border-green-500',
    'Waiting on Customer': 'border-orange-500/50 hover:border-orange-500',
    'Cancelled': 'border-gray-500/50 hover:border-gray-500',
};

const ACTIVE_STATUS_COLORS: Record<string, string> = {
    'Pending': 'border-yellow-500 bg-yellow-500/10',
    'In Progress': 'border-blue-500 bg-blue-500/10',
    'Completed': 'border-green-500 bg-green-500/10',
    'Waiting on Customer': 'border-orange-500 bg-orange-500/10',
    'Cancelled': 'border-gray-500 bg-gray-500/10',
};

interface WorkOrderSummaryProps {
    groupedOrders: Record<string, WorkOrder[]>;
    activeFilter: string | null;
    onFilterChange: (status: string | null) => void;
}

export function WorkOrderSummary({ groupedOrders, activeFilter, onFilterChange }: WorkOrderSummaryProps) {
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
                    const isActive = activeFilter === status;
                    const cardClasses = `
                        bg-[#222222] p-4 rounded-lg border 
                        ${isActive ? ACTIVE_STATUS_COLORS[status] : STATUS_COLORS_SUMMARY[status] || 'border-[#333333]'}
                        cursor-pointer transition-all duration-200
                    `;
                    return (
                        <div 
                            key={status} 
                            className={cardClasses}
                            onClick={() => onFilterChange(isActive ? null : status)}
                        >
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