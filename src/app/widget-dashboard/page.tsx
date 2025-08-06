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
        if (loading) return <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>;
        if (error) return <TableRow><TableCell colSpan={4} className="text-center text-red-500">Error: {error}</TableCell></TableRow>;
        if (conversations.length === 0) return <TableRow><TableCell colSpan={4} className="text-center">No conversations found.</TableCell></TableRow>;
        
        return conversations.map((convo) => (
            <TableRow key={convo.id}>
                <TableCell>{new Date(convo.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge>{convo.status}</Badge></TableCell>
                <TableCell>{convo.messages[convo.messages.length - 1].content.substring(0, 50)}...</TableCell>
                <TableCell><Button variant="secondary" size="sm">View</Button></TableCell>
            </TableRow>
        ));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Conversations</CardTitle>
                <CardDescription>
                    A list of the 10 most recent conversations from your widget.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Message</TableHead>
                            <TableHead>Actions</TableHead>
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
