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
import { 
    Plus, 
    Edit, 
    Trash2, 
    MoreHorizontal,
    Eye,
    X,
    Send,
    Loader2,
    Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import type { MassCampaign } from '../../types/campaign'
import { CampaignEditor } from './CampaignEditor'
import { CampaignStats } from './CampaignStats'

interface CampaignListProps {
    shopId: string
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-500',
    scheduled: 'bg-blue-500',
    sending: 'bg-yellow-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500'
}

export function CampaignList({ shopId }: CampaignListProps) {
    const [campaigns, setCampaigns] = useState<MassCampaign[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingCampaign, setEditingCampaign] = useState<MassCampaign | null>(null)
    const [viewingCampaign, setViewingCampaign] = useState<MassCampaign | null>(null)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [isStatsOpen, setIsStatsOpen] = useState(false)

    // Fetch campaigns
    useEffect(() => {
        fetchCampaigns()
    }, [shopId])

    const fetchCampaigns = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/messaging/mass-send/campaigns')
            if (!response.ok) throw new Error('Failed to fetch campaigns')
            const data = await response.json()
            setCampaigns(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching campaigns:', error)
            toast.error('Failed to load campaigns')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateCampaign = () => {
        setEditingCampaign(null)
        setIsEditorOpen(true)
    }

    const handleEditCampaign = (campaign: MassCampaign) => {
        // Only allow editing draft campaigns
        if (campaign.status !== 'draft') {
            toast.error('Only draft campaigns can be edited')
            return
        }
        setEditingCampaign(campaign)
        setIsEditorOpen(true)
    }

    const handleViewCampaign = (campaign: MassCampaign) => {
        setViewingCampaign(campaign)
        setIsStatsOpen(true)
    }

    const handleDeleteCampaign = async (campaignId: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return

        try {
            const response = await fetch(`/api/messaging/mass-send/campaigns/${campaignId}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete campaign')

            toast.success('Campaign deleted successfully')
            fetchCampaigns()
        } catch (error) {
            console.error('Error deleting campaign:', error)
            toast.error('Failed to delete campaign')
        }
    }

    const handleCancelCampaign = async (campaignId: string) => {
        if (!confirm('Are you sure you want to cancel this campaign?')) return

        try {
            const response = await fetch(`/api/messaging/mass-send/campaigns/${campaignId}/cancel`, {
                method: 'POST'
            })

            if (!response.ok) throw new Error('Failed to cancel campaign')

            toast.success('Campaign cancelled successfully')
            fetchCampaigns()
        } catch (error) {
            console.error('Error cancelling campaign:', error)
            toast.error('Failed to cancel campaign')
        }
    }

    const handleSendCampaign = async (campaignId: string) => {
        try {
            const response = await fetch(`/api/messaging/mass-send/campaigns/${campaignId}/send`, {
                method: 'POST'
            })

            if (!response.ok) throw new Error('Failed to start campaign')

            toast.success('Campaign started successfully')
            fetchCampaigns()
        } catch (error) {
            console.error('Error sending campaign:', error)
            toast.error('Failed to start campaign')
        }
    }

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Not scheduled'
        return new Date(dateString).toLocaleString()
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
                            <CardTitle>Mass Send Campaigns</CardTitle>
                            <CardDescription>
                                Create and manage campaigns to send messages to multiple customers
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreateCampaign}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Campaign
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {campaigns.length === 0 ? (
                        <div className="text-center py-12">
                            <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">No campaigns found</p>
                            <Button onClick={handleCreateCampaign}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Campaign
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Recipients</TableHead>
                                    <TableHead>Send Date</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => {
                                    const total = campaign.total_recipients || 0
                                    const sent = campaign.sent_count || 0
                                    const failed = campaign.failed_count || 0
                                    const pending = total - sent - failed
                                    const progress = total > 0 ? Math.round((sent / total) * 100) : 0

                                    return (
                                        <TableRow key={campaign.id}>
                                            <TableCell className="font-medium">
                                                {campaign.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={STATUS_COLORS[campaign.status] || 'bg-gray-500'}>
                                                    {campaign.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>Total: {total}</div>
                                                    {campaign.status === 'sending' || campaign.status === 'completed' ? (
                                                        <div className="text-muted-foreground">
                                                            Sent: {sent} | Failed: {failed} | Pending: {pending}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {formatDate(campaign.scheduled_send_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {campaign.status === 'sending' || campaign.status === 'completed' ? (
                                                    <div className="w-32">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span>{sent}/{total}</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
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
                                                        <DropdownMenuItem onClick={() => handleViewCampaign(campaign)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {campaign.status === 'draft' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)}>
                                                                    <Send className="h-4 w-4 mr-2" />
                                                                    Send Now
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {(campaign.status === 'sending' || campaign.status === 'scheduled') && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleCancelCampaign(campaign.id)}
                                                                className="text-orange-600 dark:text-orange-400"
                                                            >
                                                                <X className="h-4 w-4 mr-2" />
                                                                Cancel
                                                            </DropdownMenuItem>
                                                        )}
                                                        {campaign.status !== 'sending' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteCampaign(campaign.id)}
                                                                className="text-red-600 dark:text-red-400"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {isEditorOpen && (
                <CampaignEditor
                    campaign={editingCampaign}
                    shopId={shopId}
                    onSuccess={() => {
                        fetchCampaigns()
                        setIsEditorOpen(false)
                        setEditingCampaign(null)
                    }}
                    onCancel={() => {
                        setIsEditorOpen(false)
                        setEditingCampaign(null)
                    }}
                />
            )}

            {isStatsOpen && viewingCampaign && (
                <CampaignStats
                    campaignId={viewingCampaign.id}
                    campaign={viewingCampaign}
                    onClose={() => {
                        setIsStatsOpen(false)
                        setViewingCampaign(null)
                    }}
                />
            )}
        </>
    )
}

