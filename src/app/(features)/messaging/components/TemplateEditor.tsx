'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import type { MessageTemplate } from '../types/message-template'
import { replaceVariables, AVAILABLE_VARIABLES } from '../lib/variable-replacer'

interface TemplateEditorProps {
    template?: MessageTemplate | null
    shopId: string
    onSuccess: () => void
    onCancel: () => void
}

const SAMPLE_DATA = {
    customer_name: 'John Smith',
    vehicle: {
        year: 2020,
        make: 'Toyota',
        model: 'Camry'
    },
    work_order: {
        title: 'Oil Change & Inspection',
        total_amount: 89.99
    },
    shop_name: 'Your Auto Shop',
    shop_phone: '(555) 123-4567'
}

export function TemplateEditor({ template, shopId, onSuccess, onCancel }: TemplateEditorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        message_template: '',
        delay_months: 1
    })

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name || '',
                message_template: template.message_template || '',
                delay_months: template.delay_months ?? 1
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
                        delay_months: formData.delay_months
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.name || !formData.message_template) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        try {
            const url = template 
                ? `/api/messaging/templates/${template.id}`
                : '/api/messaging/templates'
            
            const method = template ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]">
                <DialogHeader>
                    <DialogTitle className="text-foreground dark:text-white">
                        {template ? 'Edit Template' : 'Create New Template'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-gray-400">
                        Create automated messages sent after work order completion
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Template Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-foreground dark:text-gray-300">
                            Template Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., 1-Month Follow-Up"
                            required
                            className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                        />
                    </div>

                    {/* Delay */}
                    <div className="space-y-2">
                        <Label htmlFor="delay_months" className="text-sm font-medium text-foreground dark:text-gray-300">
                            Send After <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="delay_months"
                                type="number"
                                min="1"
                                max="12"
                                value={formData.delay_months}
                                onChange={(e) => setFormData({ ...formData, delay_months: parseInt(e.target.value) || 1 })}
                                className="w-24 bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                            />
                            <span className="text-sm text-muted-foreground dark:text-gray-400">
                                {formData.delay_months === 1 ? 'month' : 'months'} after work order completion
                            </span>
                        </div>
                    </div>

                    {/* Message Template */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="message_template" className="text-sm font-medium text-foreground dark:text-gray-300">
                                Message Template <span className="text-destructive">*</span>
                            </Label>
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
                        <Textarea
                            id="message_template"
                            value={formData.message_template}
                            onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                            placeholder="Hi [customer_name], it's been [delay_months] months since your [work_order.title] at [shop_name]..."
                            rows={6}
                            required
                            className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                        />
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Use variables like [customer_name], [vehicle.make], [vehicle.model], [shop_name], [shop_phone], [work_order.title]
                        </p>
                    </div>

                    {/* Preview */}
                    <Card className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-foreground dark:text-white">
                                Preview
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground dark:text-gray-400">
                                How the message will look with sample data
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-background dark:bg-[#0a0a0a] p-4 rounded-lg border border-border dark:border-[#2a2a2a]">
                                <p className="text-sm text-foreground dark:text-white whitespace-pre-wrap">
                                    {previewMessage || 'Enter a message template to see preview...'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

