'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/app/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Edit, Trash2, Loader2, Zap, Hand, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/core/useAuth'
import type { MessageTemplate } from '../types/message-template'
import { formatDelayHours } from '../types/message-template'
import { TemplateEditor } from '../components/TemplateEditor'
import { MessagingHeader } from '../components/MessagingHeader'

export default function TemplatesPage() {
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
        if (!confirm('Are you sure you want to delete this template?')) return

        try {
            const response = await fetch(`/api/messaging/templates/${templateId}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete template')
            toast.success('Template deleted successfully')
            fetchTemplates()
        } catch (error) {
            console.error('Error deleting template:', error)
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
            if (!response.ok) throw new Error('Failed to update template')
            toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`)
            fetchTemplates()
        } catch (error) {
            console.error('Error toggling template:', error)
            toast.error('Failed to update template')
        }
    }

    const handleEditorClose = () => {
        setIsEditorOpen(false)
        setEditingTemplate(null)
    }

    const handleEditorSuccess = () => {
        fetchTemplates()
        handleEditorClose()
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
                title="Message Templates"
                description="Create automated or manual messages with customizable triggers and service-specific targeting"
                onAction={handleCreateTemplate}
                actionLabel="Create Template"
            />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto p-6">
                    <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                        <CardContent className="p-6">
                            {templates.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground dark:text-gray-400 mb-4">
                                        No templates found. Create your first template to get started.
                                    </p>
                                    <Button onClick={handleCreateTemplate}>
                                        Create Your First Template
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border dark:border-[#2a2a2a]">
                                            <TableHead className="text-foreground dark:text-gray-300">Name</TableHead>
                                            <TableHead className="text-foreground dark:text-gray-300">Trigger</TableHead>
                                            <TableHead className="text-foreground dark:text-gray-300">Service</TableHead>
                                            <TableHead className="text-foreground dark:text-gray-300">Delay</TableHead>
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
                                                            <><Zap className="h-3 w-3" /> Automated</>
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
                                                        <span className="text-xs text-muted-foreground dark:text-gray-400">All Services</span>
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
                                                            {template.is_active ? 'Active' : 'Inactive'}
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
                    onSuccess={handleEditorSuccess}
                    onCancel={handleEditorClose}
                />
            )}
        </div>
    )
}

