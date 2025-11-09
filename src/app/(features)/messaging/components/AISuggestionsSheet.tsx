'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Users, TrendingUp, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import type { CustomerSegment } from '../types/mass-campaign'

interface CampaignSuggestion {
    title: string
    message: string
    customer_segment: CustomerSegment
    reasoning: string
    estimated_recipients: number
    suggested_schedule: string
    priority: 'high' | 'medium' | 'low'
}

interface AISuggestionsSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectSuggestion: (suggestion: CampaignSuggestion) => void
}

export function AISuggestionsSheet({ open, onOpenChange, onSelectSuggestion }: AISuggestionsSheetProps) {
    const [dateRange, setDateRange] = useState('60')
    const [suggestions, setSuggestions] = useState<CampaignSuggestion[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasGenerated, setHasGenerated] = useState(false)

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

    const handleUseSuggestion = (suggestion: CampaignSuggestion) => {
        onSelectSuggestion(suggestion)
        onOpenChange(false)
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full p-0 bg-white dark:bg-[#0a0a0a]">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border dark:border-[#2a2a2a]">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center p-1">
                            <Image 
                                src="/motorminds-logo-white.png" 
                                alt="Mia AI" 
                                width={16} 
                                height={16}
                                className="object-contain"
                            />
                        </div>
                        Mia AI Campaign Suggestions
                    </SheetTitle>
                    <SheetDescription>
                        Get Mia AI-powered campaign ideas based on your work order data
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-120px)] px-6 py-4">
                    <div className="space-y-6">
                        {/* Generation Card */}
                        {!hasGenerated && (
                            <Card className="border-border dark:border-[#2a2a2a] bg-card dark:bg-[#0f0f0f]">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="text-center space-y-2">
                                            <div className="flex justify-center">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center p-2">
                                                    <Image 
                                                        src="/motorminds-logo-white.png" 
                                                        alt="Mia AI" 
                                                        width={32} 
                                                        height={32}
                                                        className="object-contain"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground dark:text-gray-400">
                                                Mia AI will analyze your work order history and suggest targeted campaigns
                                            </p>
                                        </div>

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
                                </CardContent>
                            </Card>
                        )}

                        {/* Suggestions List */}
                        {hasGenerated && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground dark:text-white">
                                            Campaign Suggestions
                                        </h3>
                                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                                            {suggestions.length} ideas based on the last {dateRange} days
                                        </p>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
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
                                        <CardContent className="p-8 text-center">
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
                                                    <div className="space-y-2 flex-1">
                                                        <CardTitle className="text-base text-foreground dark:text-white">
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
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => handleUseSuggestion(suggestion)}
                                                    >
                                                        <Send className="h-4 w-4 mr-2" />
                                                        Use
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {/* Message Preview */}
                                                <div>
                                                    <Label className="text-xs text-foreground dark:text-gray-300">MESSAGE</Label>
                                                    <div className="mt-1 p-3 rounded-lg bg-muted/50 dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a]">
                                                        <p className="text-xs text-foreground dark:text-gray-300 font-mono">
                                                            {suggestion.message}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* AI Reasoning */}
                                                <div>
                                                    <Label className="text-xs text-foreground dark:text-gray-300 flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3" />
                                                        WHY THIS CAMPAIGN
                                                    </Label>
                                                    <p className="mt-1 text-xs text-muted-foreground dark:text-gray-400">
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
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

