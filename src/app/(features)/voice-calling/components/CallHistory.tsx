'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History, MessageSquare, BarChart3, ArrowLeft } from 'lucide-react'
import CallLog from './CallLog'
import CallTranscript from './CallTranscript'
import VapiAnalysis from './VapiAnalysis'

interface CallHistoryProps {
    className?: string
    showAfterCall?: boolean
    lastCallId?: string
    lastCallTranscript?: string[]
}

export default function CallHistory({ 
    className = '',
    showAfterCall = false,
    lastCallId,
    lastCallTranscript = []
}: CallHistoryProps) {
    const [selectedCallId, setSelectedCallId] = useState<string | undefined>(lastCallId)
    const [activeTab, setActiveTab] = useState<string>(showAfterCall ? 'transcript' : 'logs')

    const handleViewTranscript = (callId: string) => {
        setSelectedCallId(callId)
        setActiveTab('transcript')
    }

    const handleViewAnalysis = (callId: string) => {
        setSelectedCallId(callId)
        setActiveTab('analysis')
    }

    const handleBackToLogs = () => {
        setSelectedCallId(undefined)
        setActiveTab('logs')
    }

    if (showAfterCall && lastCallId) {
        // Show specific call details after a call completes
        return (
            <div className={`space-y-6 ${className}`}>
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                                <History className="h-5 w-5 text-green-400" />
                                Call Completed
                            </CardTitle>
                            <Button
                                onClick={handleBackToLogs}
                                variant="outline"
                                size="sm"
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                View All Calls
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 bg-gray-900">
                        <TabsTrigger value="logs" className="data-[state=active]:bg-gray-700">
                            <History className="h-4 w-4 mr-2" />
                            Call Log
                        </TabsTrigger>
                        <TabsTrigger value="transcript" className="data-[state=active]:bg-gray-700">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Transcript
                        </TabsTrigger>
                        <TabsTrigger value="analysis" className="data-[state=active]:bg-gray-700">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analysis
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="logs" className="mt-6">
                        <CallLog />
                    </TabsContent>

                    <TabsContent value="transcript" className="mt-6">
                        <CallTranscript 
                            callId={lastCallId}
                            realTimeTranscript={lastCallTranscript}
                        />
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-6">
                        <VapiAnalysis callId={lastCallId} />
                    </TabsContent>
                </Tabs>
            </div>
        )
    }

    // Regular call history view
    return (
        <div className={className}>
            {selectedCallId ? (
                // Viewing specific call details
                <div className="space-y-6">
                    <Card className="bg-[#111111] border-[#2a2a2a]">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white flex items-center gap-2">
                                    <History className="h-5 w-5 text-blue-400" />
                                    Call Details: {selectedCallId.slice(-8)}
                                </CardTitle>
                                <Button
                                    onClick={handleBackToLogs}
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back to All Calls
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3 bg-gray-900">
                            <TabsTrigger value="logs" className="data-[state=active]:bg-gray-700">
                                <History className="h-4 w-4 mr-2" />
                                Call Log
                            </TabsTrigger>
                            <TabsTrigger value="transcript" className="data-[state=active]:bg-gray-700">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Transcript
                            </TabsTrigger>
                            <TabsTrigger value="analysis" className="data-[state=active]:bg-gray-700">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Analysis
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="logs" className="mt-6">
                            <CallLog 
                                callId={selectedCallId}
                                onViewTranscript={handleViewTranscript}
                                onViewAnalysis={handleViewAnalysis}
                            />
                        </TabsContent>

                        <TabsContent value="transcript" className="mt-6">
                            <CallTranscript callId={selectedCallId} />
                        </TabsContent>

                        <TabsContent value="analysis" className="mt-6">
                            <VapiAnalysis callId={selectedCallId} />
                        </TabsContent>
                    </Tabs>
                </div>
            ) : (
                <div className="space-y-6">
                    <CallLog 
                        onViewTranscript={handleViewTranscript}
                        onViewAnalysis={handleViewAnalysis}
                    />
                </div>
            )}
        </div>
    )
}
