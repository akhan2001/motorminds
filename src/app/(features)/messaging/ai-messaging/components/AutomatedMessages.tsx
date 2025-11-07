'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { 
    Plus, 
    Edit, 
    Trash2, 
    MoreHorizontal,
    MessageSquare,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import type { MessageTemplate } from '../../types/message-template'
import { MessageTemplateEditor } from './MessageTemplateEditor'

interface AutomatedMessagesProps {
    shopId: string
}

const TRIGGER_TYPES = [
    { value: 'work_order_completed', label: 'Work Order Completed' },
    { value: 'appointment_scheduled', label: 'Appointment Scheduled' },
]

export function AutomatedMessages({ shopId }: AutomatedMessagesProps) {
    const [templates, setTemplates] = useState<MessageTemplate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
    const [isEditorOpen, setIsEditorOpen] = useState(false)

    // Fetch templates
    useEffect(() => {
        fetchTemplates()
    }, [shopId])

    const fetchTemplates = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/messaging/ai/templates')
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
            const response = await fetch(`/api/messaging/ai/templates/${templateId}`, {
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
            const response = await fetch(`/api/messaging/ai/templates/${template.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_active: !template.is_active
                })
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

    const getTriggerLabel = (triggerType: string) => {
        return TRIGGER_TYPES.find(t => t.value === triggerType)?.label || triggerType
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
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Message Templates</CardTitle>
                            <CardDescription>
                                Templates that automatically send messages based on triggers
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreateTemplate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {templates.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">No templates found</p>
                            <Button onClick={handleCreateTemplate}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Template
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Trigger Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">
                                            {template.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {getTriggerLabel(template.trigger_type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={template.is_active}
                                                    onCheckedChange={() => handleToggleActive(template)}
                                                />
                                                {template.is_active ? (
                                                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <XCircle className="h-3 w-3" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(template.created_at).toLocaleDateString()}
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
                                                    <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteTemplate(template.id)}
                                                        className="text-red-600 dark:text-red-400"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
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

            {isEditorOpen && (
                <MessageTemplateEditor
                    template={editingTemplate}
                    shopId={shopId}
                    onSuccess={handleEditorSuccess}
                    onCancel={handleEditorClose}
                />
            )}
        </>
    )
}

