'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/core/useAuth'
import type { MessageTemplate } from '../types/message-template'
import { TemplateEditor } from '../components/TemplateEditor'

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
        <div className="container mx-auto p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Message Templates</CardTitle>
                            <CardDescription>
                                Create automated follow-up messages sent after work order completion
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
                                    <TableHead>Delay</TableHead>
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
                                                {template.delay_months} {template.delay_months === 1 ? 'month' : 'months'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={template.is_active}
                                                    onCheckedChange={() => handleToggleActive(template)}
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {template.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(template.created_at).toLocaleDateString()}
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

