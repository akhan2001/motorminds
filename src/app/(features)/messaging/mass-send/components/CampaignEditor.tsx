'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Info, Send, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { replaceVariables, getAvailableVariablesList } from '../../lib/variable-replacer'
import { CustomerSegmentBuilder } from './CustomerSegmentBuilder'
import type { MassCampaign, CampaignCreateData } from '../../types/campaign'
import type { SegmentCriteria } from '../../types/segment'
import type { MessageTemplate } from '../../types/message-template'

interface CampaignEditorProps {
    campaign?: MassCampaign | null
    shopId: string
    onSuccess: () => void
    onCancel: () => void
}

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
        license_plate: 'ABC-123'
    },
    shop: {
        shop_name: 'Auto Shop',
        shop_phone: '+1987654321',
        shop_address: '456 Business Ave',
        shop_email: 'info@autoshop.com'
    }
}

export function CampaignEditor({ 
    campaign, 
    shopId, 
    onSuccess, 
    onCancel 
}: CampaignEditorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [templates, setTemplates] = useState<MessageTemplate[]>([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        template_id: '',
        scheduled_send_at: '',
        segment_criteria: {} as SegmentCriteria
    })
    const [previewCount, setPreviewCount] = useState<number | null>(null)

    // Fetch templates
    useEffect(() => {
        fetchTemplates()
    }, [shopId])

    // Load campaign data if editing
    useEffect(() => {
        if (campaign) {
            setFormData({
                name: campaign.name || '',
                description: campaign.description || '',
                template_id: campaign.template_id || '',
                scheduled_send_at: campaign.scheduled_send_at || '',
                segment_criteria: (campaign.segment_criteria || {}) as SegmentCriteria
            })
        }
    }, [campaign])

    // Fetch preview count when segment criteria changes
    useEffect(() => {
        if (Object.keys(formData.segment_criteria).length > 0) {
            fetchPreviewCount()
        }
    }, [formData.segment_criteria, shopId])

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/messaging/ai/templates?is_active=true')
            if (!response.ok) throw new Error('Failed to fetch templates')
            const data = await response.json()
            setTemplates(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching templates:', error)
        }
    }

    const fetchPreviewCount = async () => {
        try {
            const response = await fetch('/api/messaging/mass-send/campaigns/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_segment: formData.segment_criteria
                })
            })

            if (response.ok) {
                const data = await response.json()
                setPreviewCount(data.count || 0)
            } else {
                setPreviewCount(0)
            }
        } catch (error) {
            console.error('Error fetching preview count:', error)
            setPreviewCount(0)
        }
    }

    const handleSubmit = async (sendNow: boolean = false) => {
        if (!formData.name || !formData.template_id || Object.keys(formData.segment_criteria).length === 0) {
            toast.error('Please fill in all required fields and define customer segment')
            return
        }

        setIsSubmitting(true)

        try {
            let campaignId: string

            if (campaign) {
                // Update existing campaign
                const response = await fetch(`/api/messaging/mass-send/campaigns/${campaign.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        description: formData.description || undefined,
                        template_id: formData.template_id,
                        scheduled_send_at: formData.scheduled_send_at || undefined,
                        segment_criteria: formData.segment_criteria
                    })
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Failed to update campaign')
                }

                const updated = await response.json()
                campaignId = updated.id
            } else {
                // Create new campaign
                const response = await fetch('/api/messaging/mass-send/campaigns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        description: formData.description || undefined,
                        template_id: formData.template_id,
                        scheduled_send_at: formData.scheduled_send_at || undefined,
                        segment_criteria: formData.segment_criteria,
                        status: formData.scheduled_send_at ? 'scheduled' : 'draft'
                    })
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Failed to create campaign')
                }

                const created = await response.json()
                campaignId = created.id
            }

            // If send now, trigger the send endpoint
            if (sendNow) {
                const sendResponse = await fetch(`/api/messaging/mass-send/campaigns/${campaignId}/send`, {
                    method: 'POST'
                })

                if (!sendResponse.ok) {
                    throw new Error('Campaign created but failed to start sending')
                }

                toast.success('Campaign created and started successfully')
            } else {
                toast.success(campaign ? 'Campaign updated successfully' : 'Campaign created successfully')
            }

            onSuccess()
        } catch (error) {
            console.error('Error saving campaign:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to save campaign')
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedTemplate = templates.find(t => t.id === formData.template_id)
    const previewMessage = selectedTemplate 
        ? replaceVariables(selectedTemplate.template, SAMPLE_DATA, {
            missingVariableBehavior: 'placeholder'
        })
        : ''

    const availableVariables = getAvailableVariablesList()

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {campaign ? 'Edit Campaign' : 'Create New Campaign'}
                    </DialogTitle>
                    <DialogDescription>
                        Create a mass send campaign to send messages to multiple customers
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Campaign Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Campaign Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Summer Promotion 2024"
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
                            placeholder="Brief description of this campaign"
                        />
                    </div>

                    {/* Template Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="template_id">Message Template *</Label>
                        <Select
                            value={formData.template_id}
                            onValueChange={(value) => setFormData({ ...formData, template_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(template => (
                                    <SelectItem key={template.id} value={template.id}>
                                        {template.name} ({template.trigger_type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {templates.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No active templates found. Create a template first.
                            </p>
                        )}
                    </div>

                    {/* Message Preview */}
                    {selectedTemplate && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Message Preview</CardTitle>
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

                    {/* Customer Segment Builder */}
                    <CustomerSegmentBuilder
                        shopId={shopId}
                        criteria={formData.segment_criteria}
                        onChange={(criteria) => setFormData({ ...formData, segment_criteria: criteria })}
                    />

                    {/* Preview Recipient Count */}
                    {previewCount !== null && (
                        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <div className="font-medium text-blue-900 dark:text-blue-100">
                                            This will send to {previewCount} customers
                                        </div>
                                        <div className="text-sm text-blue-700 dark:text-blue-300">
                                            Based on the selected criteria
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Schedule (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="scheduled_send_at">
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Schedule Send (Optional)
                        </Label>
                        <Input
                            id="scheduled_send_at"
                            type="datetime-local"
                            value={formData.scheduled_send_at ? new Date(formData.scheduled_send_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                                const value = e.target.value
                                setFormData({ 
                                    ...formData, 
                                    scheduled_send_at: value ? new Date(value).toISOString() : '' 
                                })
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty to save as draft. You can send it later.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    {!campaign && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save as Draft'
                            )}
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={() => handleSubmit(true)}
                        disabled={isSubmitting || !formData.template_id || previewCount === 0}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {campaign ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                {campaign ? 'Update & Send Now' : 'Create & Send Now'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

