'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/app/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Megaphone, Plus, Send, Eye, Trash2, Loader2, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/core/useAuth'
import { useCampaigns, useCampaignStats, useCampaignDelete, useCampaignSend } from '../hooks'
import type { MassCampaign } from '../types/mass-campaign'
import { MessagingHeader } from '../components/MessagingHeader'
import { CampaignCreateModal } from '../components/CampaignCreateModal'
import { CampaignDetailSheet } from '../components/CampaignDetailSheet'

export default function CampaignsPage() {
    const router = useRouter()
    const { shopId, isLoading: authLoading } = useAuth()
    const [statusFilter, setStatusFilter] = useState('all')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)

    const { data: campaigns, isLoading, refetch } = useCampaigns(shopId || '', { status: statusFilter })
    const { data: stats } = useCampaignStats(shopId || '')
    const { mutate: deleteCampaign } = useCampaignDelete()
    const { mutate: sendCampaign } = useCampaignSend()

    useEffect(() => {
        if (!authLoading && !shopId) {
            router.push('/login')
        }
    }, [shopId, authLoading, router])

    const handleDelete = (campaign: MassCampaign) => {
        if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) return
        deleteCampaign({ id: campaign.id, shopId: campaign.shop_id })
    }

    const handleSend = (campaign: MassCampaign) => {
        if (!confirm(`Schedule "${campaign.name}" to ${campaign.total_recipients || 'all matching'} customers?`)) return
        sendCampaign(campaign.id)
        // Refetch after a short delay to see updated status
        setTimeout(() => refetch(), 1000)
    }

    const handleProcessNow = async (campaign: MassCampaign) => {
        try {
            const response = await fetch('/api/messaging/campaigns-process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            const result = await response.json()
            
            if (response.ok) {
                toast.success(`Processed ${result.total_sent || 0} messages, ${result.total_failed || 0} failed`)
            } else {
                toast.error(result.error || 'Failed to process campaign')
            }
            refetch()
        } catch (error: any) {
            toast.error(`Failed to process: ${error.message}`)
        }
    }

    const handleViewCampaign = (campaignId: string) => {
        setSelectedCampaignId(campaignId)
        setIsDetailSheetOpen(true)
    }

    const getStatusBadge = (status: string) => {
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
            <Badge variant="outline" className={`${variant.color} flex items-center gap-1 w-fit`}>
                <Icon className="h-3 w-3" />
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        )
    }

    if (authLoading || isLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-background">
            <Nav />
            
            <MessagingHeader 
                title="Mass Campaigns"
                description="Send bulk messages to customer segments"
            />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto p-6 space-y-6">
                    {/* Back Button */}
                    <Button variant="ghost" onClick={() => router.push('/messaging')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Messaging Hub
                    </Button>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">Total</p>
                                        <p className="text-2xl font-bold text-foreground dark:text-white">{stats?.total || 0}</p>
                                    </div>
                                    <Megaphone className="h-8 w-8 text-muted-foreground dark:text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">Scheduled</p>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.scheduled || 0}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">In Progress</p>
                                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.in_progress || 0}</p>
                                    </div>
                                    <Send className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">Completed</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.completed || 0}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setIsCreateModalOpen(true)} 
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Campaign
                        </Button>
                    </div>

                    {/* Campaigns Table */}
                    <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {/* Filter */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="status-filter" className="text-foreground dark:text-gray-300">Filter:</Label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger id="status-filter" className="w-[180px] bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Campaigns</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="failed">Failed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Table */}
                                {!campaigns || campaigns.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground dark:text-gray-400">No campaigns yet</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border dark:border-[#2a2a2a]">
                                                <TableHead className="text-foreground dark:text-gray-300">Name</TableHead>
                                                <TableHead className="text-foreground dark:text-gray-300">Recipients</TableHead>
                                                <TableHead className="text-foreground dark:text-gray-300">Sent/Failed</TableHead>
                                                <TableHead className="text-foreground dark:text-gray-300">Status</TableHead>
                                                <TableHead className="text-foreground dark:text-gray-300">Created</TableHead>
                                                <TableHead className="text-right text-foreground dark:text-gray-300">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {campaigns.map((campaign) => (
                                                <TableRow key={campaign.id} className="border-border dark:border-[#2a2a2a]">
                                                    <TableCell className="font-medium text-foreground dark:text-white">
                                                        {campaign.name}
                                                    </TableCell>
                                                    <TableCell className="text-foreground dark:text-gray-300">
                                                        {campaign.total_recipients || 0}
                                                    </TableCell>
                                                    <TableCell className="text-foreground dark:text-gray-300">
                                                        <span className="text-green-600 dark:text-green-400">{campaign.sent_count}</span>
                                                        {' / '}
                                                        <span className="text-red-600 dark:text-red-400">{campaign.failed_count}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(campaign.status)}
                                                    </TableCell>
                                                    <TableCell className="text-foreground dark:text-gray-300">
                                                        {new Date(campaign.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleViewCampaign(campaign.id)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {campaign.status === 'draft' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleSend(campaign)}
                                                                    title="Schedule Now"
                                                                >
                                                                    <Send className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {campaign.status === 'in_progress' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleProcessNow(campaign)}
                                                                    title="Process Now"
                                                                >
                                                                    <Clock className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {['draft', 'failed'].includes(campaign.status) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(campaign)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Campaign Create Modal */}
            {shopId && (
                <CampaignCreateModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                    shopId={shopId}
                />
            )}

            {/* Campaign Detail Sheet */}
            <CampaignDetailSheet
                open={isDetailSheetOpen}
                onOpenChange={setIsDetailSheetOpen}
                campaignId={selectedCampaignId}
            />
        </div>
    )
}

