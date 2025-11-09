'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import type { MessageTemplate, TriggerType, ServiceType } from '../types/message-template'
import { TIME_PERIODS } from '../types/message-template'
import { replaceVariables } from '../lib/variable-replacer'
import { TriggerTypeSelector } from './TriggerTypeSelector'
import { ServiceTypeSelector } from './ServiceTypeSelector'
import { DelaySelector } from './DelaySelector'
import { VariablePicker } from './VariablePicker'
import { SAMPLE_DATA } from './sample_data'

interface TemplateEditorProps {
    template?: MessageTemplate | null
    shopId: string
    onSuccess: () => void
    onCancel: () => void
}

export function TemplateEditor({ template, shopId, onSuccess, onCancel }: TemplateEditorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [formData, setFormData] = useState<{
        name: string
        trigger_type: TriggerType
        service_type: ServiceType
        message_template: string
        delay_hours: number
        is_active: boolean
    }>({
        name: '',
        trigger_type: 'work_order_complete',
        service_type: null,
        message_template: '',
        delay_hours: TIME_PERIODS.ONE_MONTH,
        is_active: true
    })

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name || '',
                trigger_type: template.trigger_type || 'work_order_complete',
                service_type: template.service_type ?? null,
                message_template: template.message_template || '',
                delay_hours: template.delay_hours ?? TIME_PERIODS.ONE_MONTH,
                is_active: template.is_active ?? true
            })
        }
    }, [template])

    const handleAIHelp = async () => {
        setIsGenerating(true)
        try {
            const response = await fetch('/api/messaging/ai-helper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: formData.message_template || 'Generate a professional follow-up message for an auto repair shop',
                    context: {
                        trigger_type: formData.trigger_type,
                        service_type: formData.service_type,
                        delay_hours: formData.delay_hours
                    }
                })
            })

            if (!response.ok) throw new Error('Failed to generate message')

            const data = await response.json()
            setFormData({ ...formData, message_template: data.message })
            toast.success('AI suggestion generated!')
        } catch (error) {
            console.error('Error generating AI suggestion:', error)
            toast.error('Failed to generate AI suggestion')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleVariableInsert = (variable: string) => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = formData.message_template
        const before = text.substring(0, start)
        const after = text.substring(end)
        
        const newText = before + variable + after
        setFormData({ ...formData, message_template: newText })

        // Reset cursor position after the inserted variable
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + variable.length, start + variable.length)
        }, 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.name || !formData.message_template || !formData.trigger_type) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        try {
            const url = template 
                ? `/api/messaging/templates/${template.id}`
                : '/api/messaging/templates'
            
            const method = template ? 'PUT' : 'POST'

            const payload = {
                name: formData.name,
                trigger_type: formData.trigger_type,
                service_type: formData.service_type,
                message_template: formData.message_template,
                delay_hours: formData.delay_hours,
                is_active: formData.is_active
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to save template')
            }

            toast.success(template ? 'Template updated successfully' : 'Template created successfully')
            onSuccess()
        } catch (error: any) {
            console.error('Error saving template:', error)
            toast.error(error.message || 'Failed to save template')
        } finally {
            setIsSubmitting(false)
        }
    }

    const previewMessage = replaceVariables(formData.message_template, SAMPLE_DATA, {
        missingVariableBehavior: 'placeholder'
    })

    return (
        <Dialog open onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]">
                <DialogHeader>
                    <DialogTitle className="text-foreground dark:text-white">
                        {template ? 'Edit Template' : 'Create New Template'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-gray-400">
                        Create automated messages sent after work order completion
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Template Details</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6 mt-6">
                            {/* Template Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Template Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., 1-Month Follow-Up"
                                    required
                                />
                            </div>

                            {/* Trigger Type */}
                            <TriggerTypeSelector
                                value={formData.trigger_type}
                                onChange={(value) => setFormData({ ...formData, trigger_type: value })}
                            />

                            {/* Service Type - Only show for automated triggers */}
                            {formData.trigger_type === 'work_order_complete' && (
                                <ServiceTypeSelector
                                    value={formData.service_type}
                                    onChange={(value) => setFormData({ ...formData, service_type: value })}
                                />
                            )}

                            {/* Delay */}
                            <DelaySelector
                                value={formData.delay_hours}
                                onChange={(value) => setFormData({ ...formData, delay_hours: value })}
                            />

                            {/* Message Template */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="message_template">
                                        Message Template <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <VariablePicker onInsert={handleVariableInsert} />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAIHelp}
                                            disabled={isGenerating}
                                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                                        >
                                            {isGenerating ? (
                                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating...</>
                                            ) : (
                                                <><Wand2 className="h-3 w-3 mr-1" /> AI Help</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <Textarea
                                    ref={textareaRef}
                                    id="message_template"
                                    value={formData.message_template}
                                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                                    placeholder="Hi {{customer_name}}, it's been {{delay_time}} since your {{work_order_title}} at {{shop_name}}..."
                                    rows={8}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use the Variable Picker button to insert dynamic values like customer name, vehicle info, etc.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-6">
                            <Card className="bg-blue-500/10 border border-blue-500/20">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium">
                                        Message Preview
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        How the message will look with sample data
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-background p-4 rounded-lg border">
                                        <p className="text-sm whitespace-pre-wrap">
                                            {previewMessage || 'Enter a message template to see preview...'}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-xs text-muted-foreground mb-2">Sample Data:</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div><strong>Customer:</strong> {SAMPLE_DATA.customer_name}</div>
                                            <div><strong>Shop:</strong> {SAMPLE_DATA.shop_name}</div>
                                            <div><strong>Vehicle:</strong> {SAMPLE_DATA.vehicle_info}</div>
                                            <div><strong>Service:</strong> {SAMPLE_DATA.service_type}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
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

