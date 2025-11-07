'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/app/components/nav'
import { useAuth } from '../../operations/hooks/use-auth'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    MessageSquare, 
    Send, 
    Users, 
    Clock, 
    CheckCircle, 
    XCircle,
    Plus,
    ArrowRight,
    Loader2
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
    activeTemplates: number
    pendingQueue: number
    totalCampaigns: number
    activeCampaigns: number
    sentToday: number
    failedToday: number
}

export default function AIMessagingPage() {
    const router = useRouter()
    const { user, shopId, isLoading: authLoading } = useAuth()
    const [activeTab, setActiveTab] = useState('automated')
    const [stats, setStats] = useState<DashboardStats>({
        activeTemplates: 0,
        pendingQueue: 0,
        totalCampaigns: 0,
        activeCampaigns: 0,
        sentToday: 0,
        failedToday: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    // Fetch dashboard stats
    useEffect(() => {
        if (!shopId) return

        const fetchStats = async () => {
            try {
                setIsLoading(true)

                // Fetch all stats in parallel
                // Note: API routes handle shopId via getShopIdForUser() internally
                const [templatesRes, queueRes, campaignsRes, queueStatsRes] = await Promise.all([
                    fetch(`/api/messaging/ai/templates?is_active=true`),
                    fetch(`/api/messaging/ai/queue?status=pending`),
                    fetch(`/api/messaging/mass-send/campaigns`),
                    fetch(`/api/messaging/ai/queue`)
                ])

                const templates = await templatesRes.json()
                const queueData = await queueRes.json()
                const campaigns = await campaignsRes.json()
                const queueStatsData = await queueStatsRes.json()

                // Parse queue responses (they return { items: [...], count: ... })
                const queueItems = queueData.items || queueData || []
                const queueStatsItems = queueStatsData.items || queueStatsData || []

                // Calculate today's stats
                const today = new Date().toISOString().split('T')[0]
                const sentToday = queueStatsItems.filter((item: any) => 
                    item.status === 'sent' && 
                    item.sent_at?.startsWith(today)
                ).length
                const failedToday = queueStatsItems.filter((item: any) => 
                    item.status === 'failed' && 
                    item.updated_at?.startsWith(today)
                ).length

                setStats({
                    activeTemplates: Array.isArray(templates) ? templates.length : 0,
                    pendingQueue: Array.isArray(queueItems) ? queueItems.length : 0,
                    totalCampaigns: Array.isArray(campaigns) ? campaigns.length : 0,
                    activeCampaigns: Array.isArray(campaigns) 
                        ? campaigns.filter((c: any) => c.status === 'sending' || c.status === 'scheduled').length 
                        : 0,
                    sentToday,
                    failedToday
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [shopId])

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

    if (!shopId) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-muted-foreground">Please log in to access AI Messaging</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">AI Messaging</h1>
                                <p className="text-muted-foreground mt-1">
                                    Automated messages and mass send campaigns
                                </p>
                            </div>
                        </div>

                        {/* Dashboard Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Active Templates */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.activeTemplates}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Message templates ready to use
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Pending Queue */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Queue</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.pendingQueue}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Messages waiting to be sent
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Total Campaigns */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                                    <Send className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stats.activeCampaigns} currently active
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Sent Today */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{stats.sentToday}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Messages successfully sent
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Failed Today */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Failed Today</CardTitle>
                                    <XCircle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">{stats.failedToday}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Messages that failed to send
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Link href="/messaging/ai-messaging/templates/new">
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Template
                                        </Button>
                                    </Link>
                                    <Link href="/messaging/ai-messaging/campaigns/new">
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Campaign
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="automated">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Automated Messages
                                </TabsTrigger>
                                <TabsTrigger value="campaigns">
                                    <Send className="h-4 w-4 mr-2" />
                                    Mass Send Campaigns
                                </TabsTrigger>
                            </TabsList>

                            {/* Automated Messages Tab */}
                            <TabsContent value="automated" className="space-y-4 mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Automated Messages</CardTitle>
                                        <CardDescription>
                                            Templates that automatically send messages based on triggers
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Link href="/messaging/ai-messaging/templates">
                                                <Card className="hover:bg-accent transition-colors cursor-pointer">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex items-center justify-between">
                                                            Message Templates
                                                            <ArrowRight className="h-4 w-4" />
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Create and manage message templates for automated triggers
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">{stats.activeTemplates}</div>
                                                        <p className="text-sm text-muted-foreground">Active templates</p>
                                                    </CardContent>
                                                </Card>
                                            </Link>

                                            <Link href="/messaging/ai-messaging/queue">
                                                <Card className="hover:bg-accent transition-colors cursor-pointer">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex items-center justify-between">
                                                            Message Queue
                                                            <ArrowRight className="h-4 w-4" />
                                                        </CardTitle>
                                                        <CardDescription>
                                                            View and manage pending, sent, and failed messages
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">{stats.pendingQueue}</div>
                                                        <p className="text-sm text-muted-foreground">Pending messages</p>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h3 className="text-sm font-medium mb-3">Available Triggers</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                                                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">Work Order Completed</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Send when work order is marked complete
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                                                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                                                        <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">Appointment Scheduled</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Send when appointment is created
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Mass Send Campaigns Tab */}
                            <TabsContent value="campaigns" className="space-y-4 mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Mass Send Campaigns</CardTitle>
                                        <CardDescription>
                                            Create and manage campaigns to send messages to multiple customers
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Link href="/messaging/ai-messaging/campaigns">
                                                <Card className="hover:bg-accent transition-colors cursor-pointer">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex items-center justify-between">
                                                            All Campaigns
                                                            <ArrowRight className="h-4 w-4" />
                                                        </CardTitle>
                                                        <CardDescription>
                                                            View and manage all your mass send campaigns
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
                                                        <p className="text-sm text-muted-foreground">Total campaigns</p>
                                                    </CardContent>
                                                </Card>
                                            </Link>

                                            <Link href="/messaging/ai-messaging/campaigns/new">
                                                <Card className="hover:bg-accent transition-colors cursor-pointer border-dashed">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex items-center justify-between">
                                                            Create Campaign
                                                            <Plus className="h-4 w-4" />
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Start a new mass send campaign
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <Button className="w-full">
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            New Campaign
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h3 className="text-sm font-medium mb-3">Campaign Features</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Customer Segmentation</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Target specific customer groups
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Scheduled Sending</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Send at specific times
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Template Support</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Use message templates with variables
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Progress Tracking</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Monitor send status and results
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}

