'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { Nav } from '@/app/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Edit, Trash2, Loader2, Zap, Hand, Clock, Plus, ArrowLeft, MessageSquare, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/core/useAuth'
import type { MessageTemplate } from '../types/message-template'
import { formatDelayHours } from '../types/message-template'
import { TemplateEditor } from '../components/TemplateEditor'
import { MessagingHeader } from '../components/MessagingHeader'

export default function AutomatedMessagesPage() {
    const router = useRouter()
    const { shopId, isLoading: authLoading } = useAuth()
    const [templates, setTemplates] = useState<MessageTemplate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
    const [isEditorOpen, setIsEditorOpen] = useState(false)

    useEffect(() => {
        if (!authLoading && !shopId) {
            router.push('/login')
            return
        }
        if (shopId) {
            fetchTemplates()
        }
    }, [shopId, authLoading, router])

    const fetchTemplates = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/messaging/templates')
            if (!response.ok) throw new Error('Failed to fetch templates')
            const data = await response.json()
            setTemplates(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching templates:', error)
            toast.error('Failed to load templates')
        } finally {
            setIsLoading(false)
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

    if (authLoading || isLoading) {
        return (
            <div className="h-screen flex flex-col bg-slate-50 dark:bg-background">
                {/* <Nav /> */}
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-background">
            {/* <Nav /> */}
            
            <MessagingHeader 
                title="Automated Messages"
                description="Create and manage automated message templates that send after work orders are completed"
            />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto p-6 space-y-6">
                    {/* Back Button */}
                    <Button variant="ghost" onClick={() => router.push('/messaging')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Messaging Hub
                    </Button>

                    {/* Header Actions */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground dark:text-white">
                                Message Templates ({templates.length})
                            </h2>
                            <p className="text-sm text-muted-foreground dark:text-gray-400">
                                Create automated messages that send after work orders are completed
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline"
                                onClick={() => router.push('/messaging/automated/queue')}
                                className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                View Queue
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                            <Button onClick={handleCreateTemplate}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Template
                            </Button>
                        </div>
                    </div>

                    {/* Templates Table */}
                    <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                        <CardContent className="p-6">
                            {templates.length === 0 ? (
                                <div className="text-center py-12">
                                    <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground dark:text-gray-400 mb-4">
                                        No automated message templates yet. Create your first one!
                                    </p>
                                    <Button onClick={handleCreateTemplate}>
                                        <Plus className="h-4 w-4 mr-2" />
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
