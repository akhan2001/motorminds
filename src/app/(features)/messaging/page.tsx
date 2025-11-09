'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/app/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Zap, Send, Clock, Loader2, Edit, Trash2, Hand, RefreshCw, XCircle, CheckCircle, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/core/useAuth'
import { MessagingHeader } from './components/MessagingHeader'
import { TemplateEditor } from './components/TemplateEditor'
import { toast } from 'sonner'
import type { MessageTemplate } from './types/message-template'
import type { MessageQueueItem } from './types/message-queue'
import { formatDelayHours } from './types/message-template'

export default function MessagingPage() {
    const router = useRouter()
    const { shopId, isLoading: authLoading } = useAuth()
    const [templates, setTemplates] = useState<MessageTemplate[]>([])
    const [queueItems, setQueueItems] = useState<MessageQueueItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        if (!authLoading && !shopId) {
            router.push('/login')
            return
        }
        if (shopId) {
            fetchData()
        }
    }, [shopId, authLoading, router])

    const fetchData = async () => {
        setIsLoading(true)
        await Promise.all([fetchTemplates(), fetchQueue()])
        setIsLoading(false)
    }

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/messaging/templates')
            if (!response.ok) throw new Error('Failed to fetch templates')
            const data = await response.json()
            setTemplates(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching templates:', error)
        }
    }

    const fetchQueue = async () => {
        try {
            const url = statusFilter === 'all' 
                ? '/api/messaging/queue'
                : `/api/messaging/queue?status=${statusFilter}`
            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch queue')
            const data = await response.json()
            setQueueItems(data.items || [])
        } catch (error) {
            console.error('Error fetching queue:', error)
        }
    }

    const handleCreateTemplate = () => {
        setEditingTemplate(null)
        setIsEditorOpen(true)
    }

    const handleEditTemplate = (template: MessageTemplate) => {
        setEditingTemplate(template)
        setIsEditorOpen(true)
    }

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Delete this template?')) return
        try {
            const response = await fetch(`/api/messaging/templates/${templateId}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete')
            toast.success('Template deleted')
            fetchTemplates()
        } catch (error) {
            toast.error('Failed to delete template')
        }
    }

    const handleToggleActive = async (template: MessageTemplate) => {
        try {
            const response = await fetch(`/api/messaging/templates/${template.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !template.is_active })
            })
            if (!response.ok) throw new Error('Failed to update')
            toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`)
            fetchTemplates()
        } catch (error) {
            toast.error('Failed to update template')
        }
    }

    const handleSendNow = async (id: string) => {
        try {
            const response = await fetch(`/api/messaging/queue/${id}/send-now`, {
                method: 'POST'
            })
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send')
            }
            
            // Check if messages were actually processed
            if (data.details) {
                if (data.details.processed > 0) {
                    toast.success(`✅ Message sent successfully!`)
                } else if (data.details.failed > 0) {
                    const errorMsg = data.details.errors?.[0] || 'Failed to send message'
                    if (errorMsg.includes('phone number')) {
                        toast.error('❌ No Twilio phone number configured. Please add one in Settings.', {
                            duration: 5000
                        })
                    } else {
                        toast.error(`Failed: ${errorMsg}`, { duration: 5000 })
                    }
                } else {
                    toast.success('Message queued for sending')
                }
            } else {
                toast.success(data.message || 'Message scheduled for immediate sending')
            }
            
            fetchQueue()
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message', { duration: 5000 })
        }
    }

    const handleCancel = async (id: string) => {
        if (!confirm('Cancel this message?')) return
        try {
            const response = await fetch(`/api/messaging/queue/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to cancel')
            toast.success('Message cancelled')
            fetchQueue()
        } catch (error) {
            toast.error('Failed to cancel message')
        }
    }

    const handleRetry = async (id: string) => {
        try {
            const response = await fetch(`/api/messaging/queue/${id}/retry`, {
                method: 'POST'
            })
            if (!response.ok) throw new Error('Failed to retry')
            toast.success('Message queued for retry')
            fetchQueue()
        } catch (error) {
            toast.error('Failed to retry message')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>
            case 'sent':
                return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Sent</Badge>
            case 'failed':
                return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const queueStats = {
        total: queueItems.length,
        pending: queueItems.filter(item => item.status === 'pending').length,
        sent: queueItems.filter(item => item.status === 'sent').length,
        failed: queueItems.filter(item => item.status === 'failed').length
    }

    if (authLoading || isLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-background dark:bg-[#0a0a0a]">
            <Nav />
            
            <MessagingHeader 
                title="Automated Follow-Up Messages"
                description="Send automatic messages to customers after service completion"
            />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto p-6">
                    <Tabs defaultValue="templates" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="templates">Message Templates ({templates.length})</TabsTrigger>
                            <TabsTrigger value="queue">Message Queue ({queueStats.pending})</TabsTrigger>
                        </TabsList>

                        {/* Templates Tab */}
                        <TabsContent value="templates" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    Create automated messages that send after work orders are completed
                                </p>
                                <Button onClick={handleCreateTemplate}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Template
                                </Button>
                            </div>

                            <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                                <CardContent className="p-6">
                                    {templates.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground dark:text-gray-400 mb-4">
                                                No templates yet. Create your first one!
                                            </p>
                                            <Button onClick={handleCreateTemplate}>
                                                Create Template
                                            </Button>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-border dark:border-[#2a2a2a]">
                                                    <TableHead className="text-foreground dark:text-gray-300">Name</TableHead>
                                                    <TableHead className="text-foreground dark:text-gray-300">Type</TableHead>
                                                    <TableHead className="text-foreground dark:text-gray-300">Service</TableHead>
                                                    <TableHead className="text-foreground dark:text-gray-300">Send After</TableHead>
                                                    <TableHead className="text-foreground dark:text-gray-300">Status</TableHead>
                                                    <TableHead className="text-right text-foreground dark:text-gray-300">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {templates.map((template) => (
                                                    <TableRow key={template.id} className="border-border dark:border-[#2a2a2a]">
                                                        <TableCell className="font-medium text-foreground dark:text-white">
                                                            {template.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                                {template.trigger_type === 'work_order_complete' ? (
                                                                    <><Zap className="h-3 w-3" /> Auto</>
                                                                ) : (
                                                                    <><Hand className="h-3 w-3" /> Manual</>
                                                                )}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {template.service_type ? (
                                                                <Badge variant="secondary">
                                                                    {template.service_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground dark:text-gray-400">All</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm text-foreground dark:text-gray-300">
                                                                <Clock className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                                                                {formatDelayHours(template.delay_hours)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={template.is_active}
                                                                    onCheckedChange={() => handleToggleActive(template)}
                                                                />
                                                                <span className="text-sm text-muted-foreground dark:text-gray-400">
                                                                    {template.is_active ? 'On' : 'Off'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEditTemplate(template)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Queue Tab */}
                        <TabsContent value="queue" className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: 'Total', value: queueStats.total, icon: Clock, color: 'text-muted-foreground' },
                                    { label: 'Pending', value: queueStats.pending, icon: Clock, color: 'text-yellow-600' },
                                    { label: 'Sent', value: queueStats.sent, icon: CheckCircle, color: 'text-green-600' },
                                    { label: 'Failed', value: queueStats.failed, icon: XCircle, color: 'text-red-600' }
                                ].map((stat, i) => (
                                    <Card key={i} className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-muted-foreground dark:text-gray-400">{stat.label}</p>
                                                    <p className="text-2xl font-bold text-foreground dark:text-white">{stat.value}</p>
                                                </div>
                                                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="status-filter" className="text-foreground dark:text-gray-300">Show:</Label>
                                            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); fetchQueue(); }}>
                                                <SelectTrigger id="status-filter" className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="sent">Sent</SelectItem>
                                                    <SelectItem value="failed">Failed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={fetchQueue}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Refresh
                                        </Button>
                                    </div>

                                    {queueItems.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground dark:text-gray-400">No messages in queue</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-border dark:border-[#2a2a2a]">
                                                    <TableHead className="text-foreground dark:text-gray-300">Phone</TableHead>
                                                    <TableHead className="text-foreground dark:text-gray-300">Message</TableHead>
                                                    <TableHead className="text-foreground dark:text-gray-300">Scheduled</TableHead>
                                                    <TableHead className="text-foreground dark:text-gray-300">Status</TableHead>
                                                    <TableHead className="text-right text-foreground dark:text-gray-300">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {queueItems.map((item) => (
                                                    <TableRow key={item.id} className="border-border dark:border-[#2a2a2a]">
                                                        <TableCell className="font-medium text-foreground dark:text-white">
                                                            {item.phone_number}
                                                        </TableCell>
                                                        <TableCell className="max-w-md truncate text-foreground dark:text-gray-300">
                                                            {item.message_body}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-foreground dark:text-gray-300">
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
                                                                            title="Send Now"
                                                                        >
                                                                            <Send className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleCancel(item.id)}
                                                                            className="text-red-600"
                                                                            title="Cancel"
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
                                                                        title="Retry"
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
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {isEditorOpen && shopId && (
                <TemplateEditor
                    template={editingTemplate}
                    shopId={shopId}
                    onSuccess={() => {
                        fetchTemplates()
                        setIsEditorOpen(false)
                    }}
                    onCancel={() => setIsEditorOpen(false)}
                />
            )}
        </div>
    )
}
