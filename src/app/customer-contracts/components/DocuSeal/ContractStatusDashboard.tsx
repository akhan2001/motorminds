'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Send, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatusCounts {
    total: number;
    pending: number;
    sent: number;
    viewed: number;
    completed: number;
    declined: number;
}

export function ContractStatusDashboard({ shopId }: { shopId: string }) {
    const [statusCounts, setStatusCounts] = useState<StatusCounts>({
        total: 0,
        pending: 0,
        sent: 0,
        viewed: 0,
        completed: 0,
        declined: 0
    });

    useEffect(() => {
        async function fetchStatusCounts() {
            try {
                const { data, error } = await supabase
                    .from('service_contracts')
                    .select('signature_status')
                    .eq('shop_id', shopId);

                if (error) throw error;

                const counts = {
                    total: data.length,
                    pending: 0,
                    sent: 0,
                    viewed: 0,
                    completed: 0,
                    declined: 0
                };

                data.forEach(contract => {
                    const status = contract.signature_status || 'pending';
                    if (status in counts) {
                        counts[status as keyof StatusCounts]++;
                    }
                });

                setStatusCounts(counts);
            } catch (error) {
                console.error('Error fetching status counts:', error);
            }
        }

        if (shopId) {
            fetchStatusCounts();
        }
    }, [shopId]);

    const stats = [
        {
            title: "Total Contracts",
            value: statusCounts.total,
            icon: FileText,
            color: "text-blue-400"
        },
        {
            title: "Pending",
            value: statusCounts.pending,
            icon: Clock,
            color: "text-gray-400"
        },
        {
            title: "Sent",
            value: statusCounts.sent + statusCounts.viewed,
            icon: Send,
            color: "text-yellow-400"
        },
        {
            title: "Signed",
            value: statusCounts.completed,
            icon: CheckCircle,
            color: "text-green-400"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title} className="bg-[#1A1A1A] border-[#222222]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">
                                {stat.title}
                            </CardTitle>
                            <Icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stat.color}`}>
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
} 