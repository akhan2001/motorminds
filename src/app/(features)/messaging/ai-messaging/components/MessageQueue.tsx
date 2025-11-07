'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
    Eye, 
    X, 
    RotateCw,
    MoreHorizontal,
    Loader2,
    Calendar,
    Filter
} from 'lucide-react'
import { toast } from 'sonner'
import type { MessageQueueItem } from '../../types/message-queue'

interface MessageQueueProps {
    shopId: string
}

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'sent', label: 'Sent' },
    { value: 'failed', label: 'Failed' },
]

export function MessageQueue({ shopId }: MessageQueueProps) {
    const [queueItems, setQueueItems] = useState<MessageQueueItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState({
        status: 'all',
        startDate: '',
        endDate: ''
    })
    const [templateNames, setTemplateNames] = useState<Record<string, string>>({})
    const [customerNames, setCustomerNames] = useState<Record<string, string>>({})

    // Fetch queue items
    useEffect(() => {
        fetchQueueItems()
    }, [shopId, filters])

    // Fetch template and customer names
    useEffect(() => {
        if (queueItems.length > 0) {
            fetchTemplateNames()
            fetchCustomerNames()
        }
    }, [queueItems])

    const fetchQueueItems = async () => {
        try {
            setIsLoading(true)
            let url = '/api/messaging/ai/queue?'
            
            if (filters.status !== 'all') {
                url += `status=${filters.status}&`
            }
            if (filters.startDate) {
                url += `start_date=${filters.startDate}&`
            }
            if (filters.endDate) {
                url += `end_date=${filters.endDate}&`
            }

            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch queue items')
            
            const data = await response.json()
            const items = data.items || data || []
            setQueueItems(Array.isArray(items) ? items : [])
        } catch (error) {
            console.error('Error fetching queue items:', error)
            toast.error('Failed to load queue items')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchTemplateNames = async () => {
        const templateIds = queueItems
            .map(item => item.template_id)
            .filter((id): id is string => !!id)
        
        if (templateIds.length === 0) return

        try {
            const names: Record<string, string> = {}
            await Promise.all(
                templateIds.map(async (id) => {
                    try {
                        const response = await fetch(`/api/messaging/ai/templates/${id}`)
                        if (response.ok) {
                            const template = await response.json()
                            names[id] = template.name || 'Unknown'
                        }
                    } catch (error) {
                        console.error(`Error fetching template ${id}:`, error)
                    }
                })
            )
            setTemplateNames(names)
        } catch (error) {
            console.error('Error fetching template names:', error)
        }
    }

    const fetchCustomerNames = async () => {
        const customerIds = queueItems
            .map(item => item.customer_id)
            .filter((id): id is string => !!id)
        
        if (customerIds.length === 0) return

        try {
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()
            
            const { data } = await supabase
                .from('customers')
                .select('id, customer_name')
                .in('id', customerIds)

            if (data) {
                const names: Record<string, string> = {}
                data.forEach(customer => {
                    names[customer.id] = customer.customer_name || 'Unknown'
                })
                setCustomerNames(names)
            }
        } catch (error) {
            console.error('Error fetching customer names:', error)
        }
    }

    const handleCancel = async (itemId: string) => {
        if (!confirm('Are you sure you want to cancel this message?')) return

        try {
            const response = await fetch(`/api/messaging/ai/queue/${itemId}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to cancel message')

            toast.success('Message cancelled')
            fetchQueueItems()
        } catch (error) {
            console.error('Error cancelling message:', error)
            toast.error('Failed to cancel message')
        }
    }

    const handleRetry = async (itemId: string) => {
        try {
            const response = await fetch(`/api/messaging/ai/queue/${itemId}/retry`, {
                method: 'POST'
            })

            if (!response.ok) throw new Error('Failed to retry message')

            toast.success('Message queued for retry')
            fetchQueueItems()
        } catch (error) {
            console.error('Error retrying message:', error)
            toast.error('Failed to retry message')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return <Badge className="bg-green-500">Sent</Badge>
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>
            case 'pending':
                return <Badge variant="outline">Pending</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Message Queue</CardTitle>
                <CardDescription>
                    View and manage pending, sent, and failed messages
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-end pb-4 border-b">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-[180px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-[180px]"
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setFilters({ status: 'all', startDate: '', endDate: '' })}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Clear Filters
                    </Button>
                </div>

                {/* Queue Items Table */}
                {queueItems.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No queue items found</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Template</TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>Scheduled Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {queueItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.customer_id 
                                            ? (customerNames[item.customer_id] || 'Loading...')
                                            : 'N/A'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {item.template_id 
                                            ? (templateNames[item.template_id] || 'Loading...')
                                            : 'Direct Message'
                                        }
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {item.phone_number}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            {formatDate(item.scheduled_send_at)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(item.status)}
                                        {item.status === 'failed' && item.error_message && (
                                            <div className="text-xs text-red-500 mt-1 max-w-xs truncate">
                                                {item.error_message}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    // View message details
                                                    alert(`Message: ${item.message_body}\n\nStatus: ${item.status}\nScheduled: ${formatDate(item.scheduled_send_at)}${item.sent_at ? `\nSent: ${formatDate(item.sent_at)}` : ''}${item.error_message ? `\nError: ${item.error_message}` : ''}`)
                                                }}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                {item.status === 'pending' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleCancel(item.id)}
                                                        className="text-orange-600 dark:text-orange-400"
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Cancel
                                                    </DropdownMenuItem>
                                                )}
                                                {item.status === 'failed' && item.retry_count < 3 && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleRetry(item.id)}
                                                        className="text-blue-600 dark:text-blue-400"
                                                    >
                                                        <RotateCw className="h-4 w-4 mr-2" />
                                                        Retry
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}

