'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { replaceVariables, getAvailableVariablesList } from '../../lib/variable-replacer'
import type { MessageTemplate } from '../../types/message-template'

interface MessageTemplateEditorProps {
    template?: MessageTemplate | null
    shopId: string
    onSuccess: () => void
    onCancel: () => void
}

const TRIGGER_TYPES = [
    { value: 'work_order_completed', label: 'Work Order Completed', description: 'Sends when a work order is marked as completed' },
    { value: 'appointment_scheduled', label: 'Appointment Scheduled', description: 'Sends when an appointment is created' },
]

// Sample data for preview
const SAMPLE_DATA = {
    customer: {
        customer_name: 'John Doe',
        customer_phone: '+1234567890',
        customer_email: 'john@example.com',
        customer_address: '123 Main St'
    },
    vehicle: {
        year: '2020',
        make: 'Toyota',
        model: 'Camry',
        license_plate: 'ABC-123',
        vin: '1HGBH41JXMN109186',
        mileage: '45000',
        color: 'Blue'
    },
    work_order: {
        work_order_number: 'WO-1234',
        title: 'Oil Change',
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_amount: 89.99
    },
    appointment: {
        appointment_date: 'Monday, January 15, 2024',
        appointment_time: '10:00 AM',
        start_time: '10:00',
        service_type: 'Oil Change',
        confirmation_code: 'ABC123'
    },
    shop: {
        shop_name: 'Auto Shop',
        shop_phone: '+1987654321',
        shop_address: '456 Business Ave',
        shop_email: 'info@autoshop.com'
    },
    service: {
        service_type: 'Oil Change',
        service_date: new Date().toISOString(),
        service_amount: 89.99
    }
}

export function MessageTemplateEditor({ 
    template, 
    shopId, 
    onSuccess, 
    onCancel 
}: MessageTemplateEditorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        template: '',
        trigger_type: 'work_order_completed',
        is_active: true
    })

    const availableVariables = getAvailableVariablesList()

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name || '',
                description: template.description || '',
                template: template.template || '',
                trigger_type: template.trigger_type || 'work_order_completed',
                is_active: template.is_active ?? true
            })
        }
    }, [template])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.name || !formData.template || !formData.trigger_type) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        try {
            const url = template 
                ? `/api/messaging/ai/templates/${template.id}`
                : '/api/messaging/ai/templates'
            
            const method = template ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || undefined,
                    template: formData.template,
                    trigger_type: formData.trigger_type,
                    is_active: formData.is_active
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to save template')
            }

            toast.success(template ? 'Template updated successfully' : 'Template created successfully')
            onSuccess()
        } catch (error) {
            console.error('Error saving template:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to save template')
        } finally {
            setIsSubmitting(false)
        }
    }

    const previewMessage = replaceVariables(formData.template, SAMPLE_DATA, {
        missingVariableBehavior: 'placeholder'
    })

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {template ? 'Edit Template' : 'Create New Template'}
                    </DialogTitle>
                    <DialogDescription>
                        Create a message template that will be sent automatically based on triggers
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Template Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Template Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Work Order Completion Message"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of this template"
                        />
                    </div>

                    {/* Trigger Type */}
                    <div className="space-y-2">
                        <Label htmlFor="trigger_type">Trigger Type *</Label>
                        <Select
                            value={formData.trigger_type}
                            onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select trigger type" />
                            </SelectTrigger>
                            <SelectContent>
                                {TRIGGER_TYPES.map((trigger) => (
                                    <SelectItem key={trigger.value} value={trigger.value}>
                                        <div>
                                            <div className="font-medium">{trigger.label}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {trigger.description}
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Message Template */}
                    <div className="space-y-2">
                        <Label htmlFor="template">Message Template *</Label>
                        <Textarea
                            id="template"
                            value={formData.template}
                            onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                            placeholder="Enter your message template. Use [variable_name] for dynamic content."
                            rows={6}
                            required
                            className="font-mono text-sm"
                        />
                        <div className="text-xs text-muted-foreground flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="mb-2">Available variables (use [variable_name] format):</p>
                                <div className="flex flex-wrap gap-2">
                                    {availableVariables.map((variable) => (
                                        <Badge
                                            key={variable.path}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-accent"
                                            onClick={() => {
                                                const textarea = document.getElementById('template') as HTMLTextAreaElement
                                                if (textarea) {
                                                    const start = textarea.selectionStart
                                                    const end = textarea.selectionEnd
                                                    const text = textarea.value
                                                    const before = text.substring(0, start)
                                                    const after = text.substring(end)
                                                    const newText = `${before}[${variable.path}]${after}`
                                                    setFormData({ ...formData, template: newText })
                                                    setTimeout(() => {
                                                        textarea.focus()
                                                        textarea.setSelectionRange(start + variable.path.length + 2, start + variable.path.length + 2)
                                                    }, 0)
                                                }
                                            }}
                                        >
                                            {variable.path}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label htmlFor="is_active" className="cursor-pointer">
                            Template is active
                        </Label>
                    </div>

                    {/* Preview Section */}
                    {formData.template && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Preview</CardTitle>
                                <CardDescription>
                                    How the message will look with sample data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{previewMessage}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                template ? 'Update Template' : 'Create Template'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

