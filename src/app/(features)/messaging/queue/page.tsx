'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Clock, Send, XCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/core/useAuth'
import type { MessageQueueItem } from '../types/message-queue'

export default function QueuePage() {
    const router = useRouter()
    const { shopId, isLoading: authLoading } = useAuth()
    const [queueItems, setQueueItems] = useState<MessageQueueItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        if (!authLoading && !shopId) {
            router.push('/login')
            return
        }
        if (shopId) {
            fetchQueue()
        }
    }, [shopId, authLoading, router, statusFilter])

    const fetchQueue = async () => {
        try {
            setIsLoading(true)
            const url = statusFilter === 'all' 
                ? '/api/messaging/queue'
                : `/api/messaging/queue?status=${statusFilter}`
            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch queue')
            const data = await response.json()
            setQueueItems(data.items || [])
        } catch (error) {
            console.error('Error fetching queue:', error)
            toast.error('Failed to load queue')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendNow = async (id: string) => {
        try {
            const response = await fetch(`/api/messaging/queue/${id}/send-now`, {
                method: 'POST'
            })
            if (!response.ok) throw new Error('Failed to send message')
            toast.success('Message scheduled for immediate sending')
            fetchQueue()
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to send message')
        }
    }

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this message?')) return

        try {
            const response = await fetch(`/api/messaging/queue/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to cancel message')
            toast.success('Message cancelled')
            fetchQueue()
        } catch (error) {
            console.error('Error cancelling message:', error)
            toast.error('Failed to cancel message')
        }
    }

    const handleRetry = async (id: string) => {
        try {
            const response = await fetch(`/api/messaging/queue/${id}/retry`, {
                method: 'POST'
            })
            if (!response.ok) throw new Error('Failed to retry message')
            toast.success('Message queued for retry')
            fetchQueue()
        } catch (error) {
            console.error('Error retrying message:', error)
            toast.error('Failed to retry message')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>
            case 'sent':
                return <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Sent</Badge>
            case 'failed':
                return <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Failed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const stats = {
        total: queueItems.length,
        pending: queueItems.filter(item => item.status === 'pending').length,
        sent: queueItems.filter(item => item.status === 'sent').length,
        failed: queueItems.filter(item => item.status === 'failed').length
    }

    if (authLoading || isLoading) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Sent</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.sent}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Failed</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Queue Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Message Queue</CardTitle>
                            <CardDescription>
                                Automated follow-up messages scheduled to send. Messages are processed every 5 minutes.
                            </CardDescription>
                        </div>
                        <Button onClick={fetchQueue} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Filter */}
                        <div className="flex items-center gap-2">
                            <Label htmlFor="status-filter">Filter:</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger id="status-filter" className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Messages</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        {queueItems.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No messages in queue</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Scheduled</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {queueItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.phone_number}
                                            </TableCell>
                                            <TableCell className="max-w-md truncate">
                                                {item.message_body}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(item.scheduled_send_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    {item.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleSendNow(item.id)}
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleCancel(item.id)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {item.status === 'failed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRetry(item.id)}
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

