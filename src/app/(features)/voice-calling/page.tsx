// Main voice ordering page component
'use client'

import { Nav } from '@/app/components/nav'
import VoiceOrderingCard from './components/VoiceOrderingCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function VoiceCallingPage() {
    const router = useRouter()

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Content container */}
                <div className="p-6 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Voice Calling Hub
                        </h1>
                        <p className="text-gray-400 text-lg">
                            AI-powered voice automation for automotive services
                        </p>
                    </div>

                    {/* Voice Services Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <VoiceOrderingCard />
                        
                        {/* Call History Card */}
                        <Card className="bg-[#111111] border-[#2a2a2a] hover:border-blue-500 transition-colors cursor-pointer"
                              onClick={() => router.push('/voice-calling/history')}>
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <History className="h-6 w-6 text-blue-400" />
                                    Call History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-400 mb-4">
                                    View all completed calls, transcripts, and analysis data
                                </p>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                        Call logs and metadata
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                        Full transcripts
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                        Analysis & insights
                                    </div>
                                </div>
                                <Button 
                                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push('/voice-calling/history')
                                    }}
                                >
                                    View History
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Analytics Card */}
                        {/* <Card className="bg-[#111111] border-[#2a2a2a] hover:border-purple-500 transition-colors cursor-pointer">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <BarChart3 className="h-6 w-6 text-purple-400" />
                                    Analytics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-400 mb-4">
                                    Performance metrics and call analytics dashboard
                                </p>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                        Success rates
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        Call duration trends
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                        Cost analysis
                                    </div>
                                </div>
                                <Button 
                                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                                    disabled
                                >
                                    Coming Soon
                                </Button>
                            </CardContent>
                        </Card> */}
                    </div>
                </div>
            </div>
        </div>
    )
}