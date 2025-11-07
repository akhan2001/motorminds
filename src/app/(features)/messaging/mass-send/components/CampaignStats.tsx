'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    RotateCw,
    Loader2,
    AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { MassCampaign, CampaignRecipient } from '../../types/campaign'

interface CampaignStatsProps {
    campaignId: string
    campaign: MassCampaign
    onClose: () => void
}

export function CampaignStats({ campaignId, campaign, onClose }: CampaignStatsProps) {
    const [recipients, setRecipients] = useState<CampaignRecipient[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [campaignData, setCampaignData] = useState<MassCampaign>(campaign)
    const [failedRecipients, setFailedRecipients] = useState<CampaignRecipient[]>([])

    // Fetch recipients
    useEffect(() => {
        fetchRecipients()
        fetchCampaign()
        
        // Auto-refresh if campaign is sending
        let interval: NodeJS.Timeout | null = null
        if (campaignData.status === 'sending') {
            interval = setInterval(() => {
                fetchRecipients()
                fetchCampaign()
            }, 5000) // Refresh every 5 seconds
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [campaignId, campaignData.status])

    const fetchCampaign = async () => {
        try {
            const response = await fetch(`/api/messaging/mass-send/campaigns/${campaignId}`)
            if (response.ok) {
                const data = await response.json()
                setCampaignData(data)
            }
        } catch (error) {
            console.error('Error fetching campaign:', error)
        }
    }

    const fetchRecipients = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/messaging/mass-send/campaigns/${campaignId}/recipients`)
            if (!response.ok) throw new Error('Failed to fetch recipients')
            
            const data = await response.json()
            const items = data.recipients || []
            setRecipients(Array.isArray(items) ? items : [])
            
            // Filter failed recipients
            const failed = items.filter((r: CampaignRecipient) => r.status === 'failed')
            setFailedRecipients(failed)
        } catch (error) {
            console.error('Error fetching recipients:', error)
            toast.error('Failed to load recipients')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRetryFailed = async () => {
        if (failedRecipients.length === 0) return

        try {
            let successCount = 0
            let errorCount = 0

            for (const recipient of failedRecipients) {
                try {
                    // Create a new queue entry for this recipient
                    const response = await fetch('/api/messaging/ai/queue', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            shop_id: campaignData.shop_id,
                            template_id: campaignData.template_id,
                            customer_id: recipient.customer_id,
                            phone_number: recipient.phone_number,
                            message_body: '', // Will be filled by queue processor
                            status: 'pending'
                        })
                    })

                    if (response.ok) {
                        successCount++
                    } else {
                        errorCount++
                    }
                } catch (error) {
                    errorCount++
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount} failed recipients queued for retry`)
                fetchRecipients()
                fetchCampaign()
            }
            if (errorCount > 0) {
                toast.error(`Failed to retry ${errorCount} recipients`)
            }
        } catch (error) {
            console.error('Error retrying failed recipients:', error)
            toast.error('Failed to retry recipients')
        }
    }

    const total = campaignData.total_recipients || 0
    const sent = campaignData.sent_count || 0
    const failed = campaignData.failed_count || 0
    const pending = total - sent - failed
    const progress = total > 0 ? Math.round((sent / total) * 100) : 0

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{campaignData.name}</DialogTitle>
                    <DialogDescription>
                        Campaign status and recipient details
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        <Badge className={
                            campaignData.status === 'completed' ? 'bg-green-500' :
                            campaignData.status === 'sending' ? 'bg-yellow-500' :
                            campaignData.status === 'scheduled' ? 'bg-blue-500' :
                            'bg-gray-500'
                        }>
                            {campaignData.status}
                        </Badge>
                        {campaignData.status === 'sending' && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Sending in progress...
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {(campaignData.status === 'sending' || campaignData.status === 'completed') && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Progress</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium">
                                            Sending... {sent}/{total} sent
                                        </span>
                                        <span className="text-muted-foreground">{progress}%</span>
                                    </div>
                                    <Progress value={progress} max={100} />
                                </div>

                                {/* Status Breakdown */}
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-2xl font-bold text-green-600">{sent}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Sent</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <XCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-2xl font-bold text-red-600">{failed}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Failed</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Clock className="h-4 w-4 text-yellow-500" />
                                            <span className="text-2xl font-bold text-yellow-600">{pending}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Pending</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Failed Recipients */}
                    {failedRecipients.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm">Failed Recipients</CardTitle>
                                        <CardDescription>
                                            {failedRecipients.length} messages failed to send
                                        </CardDescription>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRetryFailed}
                                    >
                                        <RotateCw className="h-4 w-4 mr-2" />
                                        Retry Failed
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-64 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Phone Number</TableHead>
                                                <TableHead>Error Message</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {failedRecipients.map((recipient) => (
                                                <TableRow key={recipient.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {recipient.phone_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-start gap-2">
                                                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm text-red-600 dark:text-red-400">
                                                                {recipient.error_message || 'Unknown error'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* All Recipients Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">All Recipients</CardTitle>
                            <CardDescription>
                                Complete list of campaign recipients
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : recipients.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No recipients found
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Phone Number</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Sent At</TableHead>
                                                <TableHead>Error</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recipients.map((recipient) => (
                                                <TableRow key={recipient.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {recipient.phone_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        {recipient.status === 'sent' ? (
                                                            <Badge className="bg-green-500">Sent</Badge>
                                                        ) : recipient.status === 'failed' ? (
                                                            <Badge variant="destructive">Failed</Badge>
                                                        ) : (
                                                            <Badge variant="outline">Pending</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {recipient.sent_at 
                                                            ? new Date(recipient.sent_at).toLocaleString()
                                                            : '-'
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {recipient.error_message ? (
                                                            <span className="text-xs text-red-600 dark:text-red-400">
                                                                {recipient.error_message}
                                                            </span>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

