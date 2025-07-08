'use client'

import { useState } from 'react';
import { type WorkOrder } from '@/hooks/use-work-orders';
import { WorkOrderCardView } from './WorkOrderCardView';
import { WorkOrderThinView } from './WorkOrderThinView';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface WorkOrderStatusColumnProps {
    title: string;
    orders: WorkOrder[];
    view: 'card' | 'list';
    statusColors: Record<string, string>;
    priorityColors: Record<string, string>;
    onWorkOrderClick: (order: WorkOrder) => void;
}

const STATUS_BORDER_COLORS: Record<string, string> = {
    'Pending': 'border-yellow-500',
    'In Progress': 'border-blue-500',
    'Completed': 'border-green-500',
    'Waiting on Customer': 'border-orange-500',
    'Cancelled': 'border-gray-500',
};

export function WorkOrderStatusColumn({
    title,
    orders,
    view,
    statusColors,
    priorityColors,
    onWorkOrderClick,
}: WorkOrderStatusColumnProps) {
    const [isOpen, setIsOpen] = useState(true);

    if (orders.length === 0) {
        return null;
    }

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className={`w-full bg-[#181818] rounded-lg mb-6 shadow-sm border border-[#2a2a2a] pl-4 pt-4 pb-6 ${STATUS_BORDER_COLORS[title] || 'border-[#444]'} border-l-4`}
        >
            <CollapsibleTrigger className="w-full flex items-center justify-between pr-4 group focus:outline-none">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white tracking-wide">{title}</h2>
                    <span className="text-xs font-medium bg-[#2d2d2d] text-gray-300 px-2 py-0.5 rounded-full">{orders.length}</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 group-hover:text-white ${isOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4 px-0 md:px-1">
                <div className={view === 'card' ? 'space-y-6' : 'space-y-4'}>
                    {orders.map(order =>
                        view === 'card' ? (
                            <WorkOrderCardView
                                key={order.id}
                                order={order}
                                statusColors={statusColors}
                                priorityColors={priorityColors}
                                onClick={() => onWorkOrderClick(order)}
                            />
                        ) : (
                            <WorkOrderThinView
                                key={order.id}
                                order={order}
                                statusColors={statusColors}
                                priorityColors={priorityColors}
                                onClick={() => onWorkOrderClick(order)}
                            />
                        )
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
} 