'use client'

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Send, AlertCircle, XCircle, FileText } from 'lucide-react';

interface SignatureStatusBadgeProps {
    status: string;
    className?: string;
}

export function SignatureStatusBadge({ status, className }: SignatureStatusBadgeProps) {
    const statusConfig = {
        pending: { 
            icon: Clock, 
            color: 'bg-gray-500 hover:bg-gray-600', 
            label: 'Pending' 
        },
        sent: { 
            icon: Send, 
            color: 'bg-blue-500 hover:bg-blue-600', 
            label: 'Sent' 
        },
        viewed: { 
            icon: AlertCircle, 
            color: 'bg-yellow-500 hover:bg-yellow-600', 
            label: 'Viewed' 
        },
        completed: { 
            icon: CheckCircle, 
            color: 'bg-green-500 hover:bg-green-600', 
            label: 'Signed' 
        },
        declined: { 
            icon: XCircle, 
            color: 'bg-red-500 hover:bg-red-600', 
            label: 'Declined' 
        },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <Badge className={`${config.color} text-white border-0 inline-flex items-center gap-1 w-fit text-xs px-2 py-1 ${className || ''}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </Badge>
    );
} 