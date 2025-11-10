'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2, Send, CheckCircle, XCircle, Clock, AlertCircle, Users, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useCampaign, useCampaignSend } from '../hooks'
import type { MassCampaign } from '../types/mass-campaign'

interface CampaignDetailSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    campaignId: string | null
}

export function CampaignDetailSheet({ open, onOpenChange, campaignId }: CampaignDetailSheetProps) {
    const [statusFilter, setStatusFilter] = useState('all')
    const [recipients, setRecipients] = useState<any[]>([])
    const [isLoadingRecipients, setIsLoadingRecipients] = useState(true)

    const { data: campaign, isLoading, refetch } = useCampaign(campaignId || '')
    const { mutate: sendCampaign } = useCampaignSend()

    useEffect(() => {
        if (campaignId && open) {
            fetchRecipients()
        }
    }, [campaignId, statusFilter, open])

    const fetchRecipients = async () => {
        if (!campaignId) return
        try {
            setIsLoadingRecipients(true)
            const url = `/api/messaging/campaigns/${campaignId}/recipients?status=${statusFilter}`
            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch recipients')
            const data = await response.json()
            setRecipients(data.recipients || [])
        } catch (error) {
            console.error('Error fetching recipients:', error)
            toast.error('Failed to load recipients')
        } finally {
            setIsLoadingRecipients(false)
        }
    }

    const handleSend = () => {
        if (!campaign) return
        if (!confirm(`Send "${campaign.name}" now?`)) return
        sendCampaign(campaign.id, {
            onSuccess: () => {
                refetch()
                fetchRecipients()
            }
        })
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; icon: any }> = {
            pending: { color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', icon: Clock },
            sent: { color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: CheckCircle },
            failed: { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: XCircle }
        }

        const variant = variants[status] || variants.pending
        const Icon = variant.icon

        return (
            <Badge variant="outline" className={`${variant.color} flex items-center gap-1 w-fit`}>
                <Icon className="h-3 w-3" />
                {status.toUpperCase()}
            </Badge>
        )
    }

    const getCampaignStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; icon: any }> = {
            draft: { color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', icon: AlertCircle },
            scheduled: { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: Clock },
            in_progress: { color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', icon: Send },
            completed: { color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: CheckCircle },
            failed: { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: XCircle },
            cancelled: { color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', icon: XCircle }
        }

        const variant = variants[status] || variants.draft
        const Icon = variant.icon

        return (
            <Badge variant="outline" className={`${variant.color} flex items-center gap-1`}>
                <Icon className="h-3 w-3" />
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        )
    }

    if (!campaignId) return null

    const progress = campaign && campaign.total_recipients > 0 
        ? ((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100 
        : 0

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-3xl w-full p-0 bg-white dark:bg-[#0a0a0a]">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border dark:border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <SheetTitle className="text-xl">
                                {isLoading ? 'Loading Campaign...' : campaign ? campaign.name : 'Campaign Not Found'}
                            </SheetTitle>
                            <SheetDescription className="mt-1">
                                {isLoading ? 'Please wait...' : campaign ? 'Campaign details and recipient status' : 'The requested campaign could not be found'}
                            </SheetDescription>
                        </div>
                        {campaign && getCampaignStatusBadge(campaign.status)}
                    </div>
                </SheetHeader>
                
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !campaign ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Campaign not found</p>
                    </div>
                ) : (
                    <>

                        <ScrollArea className="h-[calc(100vh-120px)] px-6 py-4">
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    <Card className="border-border dark:border-[#2a2a2a]">
                                        <CardContent className="pt-4">
                                            <div className="flex flex-col">
                                                <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Total</p>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-2xl font-bold text-foreground dark:text-white">
                                                        {campaign.total_recipients}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border dark:border-[#2a2a2a]">
                                        <CardContent className="pt-4">
                                            <div className="flex flex-col">
                                                <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Sent</p>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        {campaign.sent_count}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border dark:border-[#2a2a2a]">
                                        <CardContent className="pt-4">
                                            <div className="flex flex-col">
                                                <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Failed</p>
                                                <div className="flex items-center gap-2">
                                                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                        {campaign.failed_count}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Progress Bar */}
                                {campaign.status === 'in_progress' && (
                                    <Card className="border-border dark:border-[#2a2a2a]">
                                        <CardContent className="pt-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-foreground dark:text-white">Sending Progress</p>
                                                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                                                        {Math.round(progress)}%
                                                    </p>
                                                </div>
                                                <Progress value={progress} className="h-2" />
                                                <p className="text-xs text-muted-foreground dark:text-gray-500">
                                                    {campaign.sent_count + campaign.failed_count} of {campaign.total_recipients} processed
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Message Preview */}
                                <Card className="border-border dark:border-[#2a2a2a]">
                                    <CardContent className="pt-4">
                                        <p className="text-sm font-medium text-foreground dark:text-white mb-3">Message</p>
                                        <div className="p-4 rounded-lg bg-muted/50 dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a]">
                                            <p className="text-sm text-foreground dark:text-gray-300 font-mono whitespace-pre-wrap">
                                                {campaign.message}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Campaign Info */}
                                <Card className="border-border dark:border-[#2a2a2a]">
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground dark:text-gray-400">Created</p>
                                                <p className="text-foreground dark:text-white font-medium">
                                                    {new Date(campaign.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            {campaign.scheduled_send_at && (
                                                <div>
                                                    <p className="text-muted-foreground dark:text-gray-400">Scheduled For</p>
                                                    <p className="text-foreground dark:text-white font-medium">
                                                        {new Date(campaign.scheduled_send_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                            {campaign.completed_at && (
                                                <div>
                                                    <p className="text-muted-foreground dark:text-gray-400">Completed</p>
                                                    <p className="text-foreground dark:text-white font-medium">
                                                        {new Date(campaign.completed_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {campaign.status === 'draft' && (
                                            <Button onClick={handleSend} className="w-full mt-4">
                                                <Send className="h-4 w-4 mr-2" />
                                                Send Campaign Now
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>

                                <Separator />

                                {/* Recipients Table */}
                                <Card className="border-border dark:border-[#2a2a2a]">
                                    <CardContent className="pt-4">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-foreground dark:text-white">Recipients</p>
                                                <div className="flex items-center gap-2">
                                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                        <SelectTrigger className="w-[130px] h-9 bg-background dark:bg-[#0a0a0a]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All</SelectItem>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="sent">Sent</SelectItem>
                                                            <SelectItem value="failed">Failed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button variant="outline" size="sm" onClick={fetchRecipients}>
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {isLoadingRecipients ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : recipients.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <p className="text-sm text-muted-foreground dark:text-gray-400">No recipients found</p>
                                                </div>
                                            ) : (
                                                <div className="border border-border dark:border-[#2a2a2a] rounded-lg overflow-hidden">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-border dark:border-[#2a2a2a] bg-muted/50">
                                                                <TableHead className="text-foreground dark:text-gray-300">Customer</TableHead>
                                                                <TableHead className="text-foreground dark:text-gray-300">Phone</TableHead>
                                                                <TableHead className="text-foreground dark:text-gray-300">Status</TableHead>
                                                                <TableHead className="text-foreground dark:text-gray-300">Sent At</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {recipients.map((recipient) => (
                                                                <TableRow key={recipient.id} className="border-border dark:border-[#2a2a2a]">
                                                                    <TableCell className="font-medium text-foreground dark:text-white">
                                                                        {recipient.customer?.customer_name || 'Unknown'}
                                                                    </TableCell>
                                                                    <TableCell className="text-foreground dark:text-gray-300">
                                                                        {recipient.customer_phone}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {getStatusBadge(recipient.status)}
                                                                    </TableCell>
                                                                    <TableCell className="text-foreground dark:text-gray-300">
                                                                        {recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : '-'}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </ScrollArea>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

