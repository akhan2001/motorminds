'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2, Send, Clock, Save } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useCampaignCreate } from '../hooks'
import { CustomerSegmentBuilder } from './CustomerSegmentBuilder'
import { VariablePicker } from './VariablePicker'
import { AISuggestionsSheet } from './AISuggestionsSheet'
import type { CustomerSegment } from '../types/mass-campaign'

interface CampaignCreateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shopId: string
    prefillData?: {
        name?: string
        message?: string
        segment?: CustomerSegment
    }
}

export function CampaignCreateModal({ open, onOpenChange, shopId, prefillData }: CampaignCreateModalProps) {
    const [campaignName, setCampaignName] = useState('')
    const [message, setMessage] = useState('')
    const [customerSegment, setCustomerSegment] = useState<CustomerSegment>({})
    const [scheduledFor, setScheduledFor] = useState<Date | undefined>(undefined)
    const [recipientCount, setRecipientCount] = useState<number | null>(null)
    const [isAISheetOpen, setIsAISheetOpen] = useState(false)

    const { mutate: createCampaign, isPending } = useCampaignCreate()

    // Update form when prefill data changes
    useEffect(() => {
        if (prefillData) {
            setCampaignName(prefillData.name || '')
            setMessage(prefillData.message || '')
            setCustomerSegment(prefillData.segment || {})
        }
    }, [prefillData])

    const handleVariableInsert = (variable: string) => {
        setMessage(prev => prev + `[${variable}]`)
    }

    const handleAISuggestionSelect = (suggestion: any) => {
        setCampaignName(suggestion.title)
        setMessage(suggestion.message)
        setCustomerSegment(suggestion.customer_segment || {})
        toast.success('Mia AI suggestion applied to your campaign')
    }

    const handleSubmit = (isDraft: boolean = false) => {
        if (!campaignName.trim()) {
            toast.error('Please enter a campaign name')
            return
        }

        if (!message.trim()) {
            toast.error('Please enter a message')
            return
        }

        createCampaign({
            shop_id: shopId,
            name: campaignName,
            message,
            customer_segment: customerSegment,
            status: isDraft ? 'draft' : 'scheduled',
            scheduled_send_at: scheduledFor?.toISOString() || null
        }, {
            onSuccess: () => {
                toast.success(isDraft ? 'Campaign saved as draft' : 'Campaign created and scheduled')
                onOpenChange(false)
                // Reset form
                setCampaignName('')
                setMessage('')
                setCustomerSegment({})
                setScheduledFor(undefined)
                setRecipientCount(null)
            },
            onError: (error) => {
                toast.error(`Failed to create campaign: ${error.message}`)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-[#FAFAF9] dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle>Create Campaign</DialogTitle>
                    <DialogDescription>
                        Build a targeted message campaign for your customers
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
                    <div className="space-y-6 pb-6">
                        {/* Mia AI Suggestions Card */}
                        <Card className="border-red-500/20 bg-gradient-to-r from-red-500/10 to-red-600/10 dark:from-red-500/5 dark:to-red-600/5">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center p-2">
                                            <Image 
                                                src="/red-motorminds-logo-svg.svg" 
                                                alt="Mia AI" 
                                                width={24} 
                                                height={24}
                                                className="object-contain"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground dark:text-white">
                                                Mia AI Campaign Suggestions
                                            </p>
                                            <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                Let Mia AI analyze your work orders and suggest targeted campaigns
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline"
                                        onClick={() => setIsAISheetOpen(true)}
                                        className="bg-background dark:bg-[#0a0a0a] border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    >
                                        Get Suggestions
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Campaign Details */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="campaign-name" className="text-foreground dark:text-gray-300">
                                        Campaign Name *
                                    </Label>
                                    <Input
                                        id="campaign-name"
                                        placeholder="e.g., Spring Oil Change Special"
                                        value={campaignName}
                                        onChange={(e) => setCampaignName(e.target.value)}
                                        className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-foreground dark:text-gray-300">
                                        Message *
                                    </Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Your message here..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={6}
                                        className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] font-mono text-sm"
                                    />
                                    <div className="flex items-center justify-between">
                                        <VariablePicker onInsert={handleVariableInsert} />
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">
                                            {message.length}/160 characters
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="schedule-date" className="text-foreground dark:text-gray-300">
                                        Schedule (optional)
                                    </Label>
                                    <Input
                                        id="schedule-date"
                                        type="date"
                                        value={scheduledFor ? format(scheduledFor, 'yyyy-MM-dd') : ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const selectedDate = new Date(e.target.value)
                                                // Set to start of day
                                                selectedDate.setHours(0, 0, 0, 0)
                                                setScheduledFor(selectedDate)
                                            } else {
                                                setScheduledFor(undefined)
                                            }
                                        }}
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]"
                                    />
                                    {scheduledFor && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setScheduledFor(undefined)}
                                            className="w-full"
                                        >
                                            Clear schedule
                                        </Button>
                                    )}
                                </div>

                                {/* Message Preview */}
                                <div className="space-y-2">
                                    <Label className="text-foreground dark:text-gray-300">Preview</Label>
                                    <div className="p-4 rounded-lg bg-muted/50 dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a]">
                                        <p className="text-sm text-foreground dark:text-gray-300 font-mono whitespace-pre-wrap">
                                            {message || 'Your message will appear here...'}
                                        </p>
                                    </div>
                                    {recipientCount !== null && recipientCount > 0 && (
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">
                                            Will be sent to {recipientCount} customer{recipientCount !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Customer Segment */}
                            <div>
                                <CustomerSegmentBuilder
                                    value={customerSegment}
                                    onChange={setCustomerSegment}
                                    onPreview={setRecipientCount}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-foreground dark:text-white">
                                    Ready to {scheduledFor ? 'schedule' : 'send'} your campaign?
                                </p>
                                {recipientCount !== null && (
                                    <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                                        {recipientCount} recipients • Est. {Math.ceil(recipientCount / 100)} min to send
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleSubmit(true)}
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save Draft
                                </Button>
                                <Button
                                    onClick={() => handleSubmit(false)}
                                    disabled={isPending || recipientCount === 0}
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                                >
                                    {isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : scheduledFor ? (
                                        <Clock className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    {scheduledFor ? 'Schedule' : 'Send Now'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>

            {/* AI Suggestions Sheet */}
            <AISuggestionsSheet
                open={isAISheetOpen}
                onOpenChange={setIsAISheetOpen}
                onSelectSuggestion={handleAISuggestionSelect}
            />
        </Dialog>
    )
}

