'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/app/components/nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Send, Users, TrendingUp, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useAuth } from '@/hooks/core/useAuth'
import { MessagingHeader } from '../../components/MessagingHeader'
import { CampaignCreateModal } from '../../components/CampaignCreateModal'
import type { CustomerSegment } from '../../types/mass-campaign'

interface CampaignSuggestion {
    title: string
    message: string
    customer_segment: any
    reasoning: string
    estimated_recipients: number
    suggested_schedule: string
    priority: 'high' | 'medium' | 'low'
}

export default function SuggestCampaignsPage() {
    const router = useRouter()
    const { shopId, isLoading: authLoading } = useAuth()
    const [dateRange, setDateRange] = useState('60')
    const [suggestions, setSuggestions] = useState<CampaignSuggestion[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasGenerated, setHasGenerated] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedSuggestion, setSelectedSuggestion] = useState<CampaignSuggestion | null>(null)

    useEffect(() => {
        if (!authLoading && !shopId) {
            router.push('/login')
        }
    }, [shopId, authLoading, router])

    const generateSuggestions = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/messaging/campaigns/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_range: parseInt(dateRange) })
            })

            if (!response.ok) throw new Error('Failed to generate suggestions')

            const data = await response.json()
            setSuggestions(data.suggestions || [])
            setHasGenerated(true)

            if (!data.suggestions || data.suggestions.length === 0) {
                toast.info('No campaign suggestions available at this time')
            } else {
                toast.success(`Generated ${data.suggestions.length} campaign ideas`)
            }
        } catch (error) {
            console.error('Error generating suggestions:', error)
            toast.error('Failed to generate campaign suggestions')
        } finally {
            setIsLoading(false)
        }
    }

    const useSuggestion = (suggestion: CampaignSuggestion) => {
        setSelectedSuggestion(suggestion)
        setIsCreateModalOpen(true)
    }

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, string> = {
            high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
            medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
            low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
        }

        return (
            <Badge variant="outline" className={variants[priority] || variants.medium}>
                {priority.toUpperCase()} PRIORITY
            </Badge>
        )
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
                title="Mia AI Campaign Suggestions"
                description="Get Mia AI-powered campaign ideas based on your work order data"
            />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto p-6 space-y-6">
                    {/* Back Button */}
                    <Button variant="ghost" onClick={() => router.push('/messaging/campaigns')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Campaigns
                    </Button>

                    {/* Generation Card */}
                    {!hasGenerated && (
                        <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                            <CardContent className="p-8">
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="text-center space-y-4">
                                        <div className="flex justify-center">
                                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center p-3">
                                                <Image 
                                                    src="/red-motorminds-logo-svg.svg" 
                                                    alt="Mia AI" 
                                                    width={40} 
                                                    height={40}
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-semibold text-foreground dark:text-white mb-2">
                                                Mia AI-Powered Campaign Ideas
                                            </h3>
                                            <p className="text-muted-foreground dark:text-gray-400">
                                                Mia AI will analyze your work order history and suggest targeted campaigns 
                                                to re-engage customers, boost repeat business, and increase revenue.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="date-range" className="text-foreground dark:text-gray-300">
                                                Analyze work orders from the last:
                                            </Label>
                                            <Select value={dateRange} onValueChange={setDateRange}>
                                                <SelectTrigger id="date-range" className="w-full bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] mt-2">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="30">30 days</SelectItem>
                                                    <SelectItem value="60">60 days</SelectItem>
                                                    <SelectItem value="90">90 days</SelectItem>
                                                    <SelectItem value="180">6 months</SelectItem>
                                                    <SelectItem value="365">1 year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button 
                                            onClick={generateSuggestions} 
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                            size="lg"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Analyzing Your Data...
                                                </>
                                            ) : (
                                                <>
                                                    Generate Campaign Ideas
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Suggestions List */}
                    {hasGenerated && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-white">
                                        Campaign Suggestions
                                    </h2>
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                        {suggestions.length} ideas generated based on the last {dateRange} days
                                    </p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={generateSuggestions}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : null}
                                    Regenerate
                                </Button>
                            </div>

                            {suggestions.length === 0 ? (
                                <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                                    <CardContent className="p-12 text-center">
                                        <p className="text-muted-foreground dark:text-gray-400">
                                            No campaign suggestions available. Try a different date range.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                suggestions.map((suggestion, index) => (
                                    <Card key={index} className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1 flex-1">
                                                    <CardTitle className="text-foreground dark:text-white">
                                                        {suggestion.title}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {getPriorityBadge(suggestion.priority)}
                                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                                                            <Users className="h-3 w-3 mr-1" />
                                                            ~{suggestion.estimated_recipients} recipients
                                                        </Badge>
                                                            <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                {suggestion.suggested_schedule}
                                                            </Badge>
                                                    </div>
                                                </div>
                                                <Button onClick={() => useSuggestion(suggestion)}>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Use This
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Message Preview */}
                                            <div>
                                                <Label className="text-foreground dark:text-gray-300 text-xs">MESSAGE</Label>
                                                <div className="mt-2 p-4 rounded-lg bg-muted/50 dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a]">
                                                    <p className="text-sm text-foreground dark:text-gray-300 font-mono">
                                                        {suggestion.message}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* AI Reasoning */}
                                            <div>
                                                <Label className="text-foreground dark:text-gray-300 text-xs flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3" />
                                                    WHY THIS CAMPAIGN
                                                </Label>
                                                <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400">
                                                    {suggestion.reasoning}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Campaign Create Modal */}
            {shopId && (
                <CampaignCreateModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                    shopId={shopId}
                    prefillData={selectedSuggestion ? {
                        name: selectedSuggestion.title,
                        message: selectedSuggestion.message,
                        segment: selectedSuggestion.customer_segment as CustomerSegment
                    } : undefined}
                />
            )}
        </div>
    )
}

