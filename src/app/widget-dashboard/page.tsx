"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Conversation {
    id: string;
    created_at: string;
    status: string;
    messages: { role: string; content: string }[];
}

export default function WidgetDashboardPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/dashboard/widget/conversations")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch conversations");
                return res.json();
            })
            .then(setConversations)
            .catch((e) => setError((e as Error).message))
            .finally(() => setLoading(false));
    }, []);

    const renderContent = () => {
        if (loading) return <TableRow><TableCell colSpan={4} className="text-center py-12">Loading conversations...</TableCell></TableRow>;
        if (error) return <TableRow><TableCell colSpan={4} className="text-center py-12 text-red-500">Error: {error}</TableCell></TableRow>;
        if (conversations.length === 0) return <TableRow><TableCell colSpan={4} className="text-center py-12">No conversations found.</TableCell></TableRow>;
        
        return conversations.map((convo) => (
            <TableRow key={convo.id} className="bg-gray-900 border-gray-800">
                <TableCell>{new Date(convo.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant={convo.status === 'open' ? 'default' : 'secondary'}>{convo.status}</Badge></TableCell>
                <TableCell className="text-gray-400">{convo.messages[convo.messages.length - 1].content.substring(0, 50)}...</TableCell>
                <TableCell><Button variant="outline" size="sm" className="border-gray-700">View</Button></TableCell>
            </TableRow>
        ));
    };

    return (
        <Card className="bg-[#131313] border-gray-800 text-white">
            <CardHeader>
                <CardTitle>Recent Conversations</CardTitle>
                <CardDescription className="text-gray-400">
                    A list of the 10 most recent conversations from your widget.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-gray-800 hover:bg-gray-800">
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-white">Last Message</TableHead>
                            <TableHead className="text-white">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderContent()}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
