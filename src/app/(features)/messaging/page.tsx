'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/app/components/nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, Send, Users, MessageSquare, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/core/useAuth'
import { MessagingHeader } from './components/MessagingHeader'

export default function MessagingDashboard() {
    const router = useRouter()
    const { shopId, isLoading: authLoading } = useAuth()
    const [stats, setStats] = useState({
        activeTemplates: 0,
        messagesSent: 0,
        campaignReach: 0,
        pendingMessages: 0,
        activeCampaigns: 0
    })
    const [isLoadingStats, setIsLoadingStats] = useState(true)

    useEffect(() => {
        if (!authLoading && !shopId) {
            router.push('/login')
        }
        if (shopId) {
            fetchStats()
        }
    }, [shopId, authLoading, router])

    const fetchStats = async () => {
        try {
            setIsLoadingStats(true)
            
            // Fetch templates
            const templatesResponse = await fetch('/api/messaging/templates')
            const templates = templatesResponse.ok ? await templatesResponse.json() : []
            const activeTemplates = Array.isArray(templates) ? templates.filter(t => t.is_active).length : 0

            // Fetch queue stats
            const queueResponse = await fetch('/api/messaging/queue')
            const queueData = queueResponse.ok ? await queueResponse.json() : { items: [] }
            const pendingMessages = queueData.items?.filter((item: any) => item.status === 'pending').length || 0
            const messagesSent = queueData.items?.filter((item: any) => item.status === 'sent').length || 0

            // Fetch campaigns
            const campaignsResponse = await fetch('/api/messaging/campaigns')
            const campaigns = campaignsResponse.ok ? await campaignsResponse.json() : []
            const activeCampaigns = Array.isArray(campaigns) ? campaigns.filter((c: any) => c.status === 'in_progress').length : 0
            const campaignReach = Array.isArray(campaigns) ? campaigns.reduce((sum: number, c: any) => sum + (c.sent_count || 0), 0) : 0

            setStats({
                activeTemplates,
                messagesSent,
                campaignReach,
                pendingMessages,
                activeCampaigns
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setIsLoadingStats(false)
        }
    }

    if (authLoading) {
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
        <div className="h-screen flex flex-col bg-background dark:bg-[#0a0a0a]">
            <Nav />
            
            <MessagingHeader 
                title="Customer Messaging Hub"
                description="Manage automated messages and mass campaigns to keep customers engaged"
            />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto p-6 space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">Active Templates</p>
                                        {isLoadingStats ? (
                                            <Skeleton className="h-8 w-16 mt-2" />
                                        ) : (
                                            <p className="text-2xl font-bold text-foreground dark:text-white">
                                                {stats.activeTemplates}
                                            </p>
                                        )}
                                    </div>
                                    <Zap className="h-8 w-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">Messages Sent</p>
                                        {isLoadingStats ? (
                                            <Skeleton className="h-8 w-20 mt-2" />
                                        ) : (
                                            <p className="text-2xl font-bold text-foreground dark:text-white">
                                                {stats.messagesSent}
                                            </p>
                                        )}
                                    </div>
                                    <Send className="h-8 w-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">Campaign Reach</p>
                                        {isLoadingStats ? (
                                            <Skeleton className="h-8 w-20 mt-2" />
                                        ) : (
                                            <p className="text-2xl font-bold text-foreground dark:text-white">
                                                {stats.campaignReach}
                                            </p>
                                        )}
                                    </div>
                                    <Users className="h-8 w-8 text-purple-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Features */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Automated Messages */}
                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                                    <Zap className="h-5 w-5 text-blue-600" />
                                    Automated Messages
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    Send automatic follow-up messages after work orders are completed. 
                                    Perfect for reminders, thank you notes, and maintenance alerts.
                                </p>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground dark:text-gray-400">Active Templates</span>
                                        {isLoadingStats ? (
                                            <Skeleton className="h-5 w-16" />
                                        ) : (
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                {stats.activeTemplates} Active
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground dark:text-gray-400">Messages in Queue</span>
                                        {isLoadingStats ? (
                                            <Skeleton className="h-5 w-20" />
                                        ) : (
                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                                {stats.pendingMessages} Pending
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {isLoadingStats ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : (
                                    <Button 
                                        onClick={() => router.push('/messaging/automated')}
                                        className="w-full"
                                    >
                                        Manage Automated Messages
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Mass Campaigns */}
                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                                    <Users className="h-5 w-5 text-purple-600" />
                                    Mass Campaigns
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    Send targeted promotional messages to specific customer segments. 
                                    Use Mia AI to suggest campaigns based on your work order history.
                                </p>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground dark:text-gray-400">Active Campaigns</span>
                                        {isLoadingStats ? (
                                            <Skeleton className="h-5 w-20" />
                                        ) : (
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                                {stats.activeCampaigns} Running
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground dark:text-gray-400">Total Reach</span>
                                        {isLoadingStats ? (
                                            <Skeleton className="h-5 w-24" />
                                        ) : (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                                {stats.campaignReach} Customers
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {isLoadingStats ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : (
                                    <Button 
                                        onClick={() => router.push('/messaging/campaigns')}
                                        className="w-full"
                                    >
                                        Manage Campaigns
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                                <MessageSquare className="h-5 w-5" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isLoadingStats ? (
                                    <>
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                    </>
                                ) : (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => router.push('/messaging/automated')}
                                            className="h-auto p-4 flex flex-col items-center gap-2"
                                        >
                                            <Zap className="h-6 w-6 text-blue-600" />
                                            <div className="text-center">
                                                <p className="font-medium">Create Template</p>
                                                <p className="text-xs text-muted-foreground">New automated message</p>
                                            </div>
                                        </Button>

                                        <Button 
                                            variant="outline" 
                                            onClick={() => router.push('/messaging/campaigns')}
                                            className="h-auto p-4 flex flex-col items-center gap-2"
                                        >
                                            <Users className="h-6 w-6 text-purple-600" />
                                            <div className="text-center">
                                                <p className="font-medium">New Campaign</p>
                                                <p className="text-xs text-muted-foreground">Target customer segments</p>
                                            </div>
                                        </Button>

                                        <Button 
                                            variant="outline" 
                                            onClick={() => router.push('/messaging/queue')}
                                            className="h-auto p-4 flex flex-col items-center gap-2"
                                        >
                                            <MessageSquare className="h-6 w-6 text-green-600" />
                                            <div className="text-center">
                                                <p className="font-medium">View Queue</p>
                                                <p className="text-xs text-muted-foreground">Check message status</p>
                                            </div>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}