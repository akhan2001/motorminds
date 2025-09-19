// Main voice ordering page component

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneCall, ShoppingCart, ArrowRight } from 'lucide-react'

export default function VoiceCallingPage() {
    return (
        <div className="min-h-screen bg-[#0d0d0d] p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Voice Calling Hub
                    </h1>
                    <p className="text-gray-400 text-lg">
                        AI-powered voice automation for automotive services
                    </p>
                </div>

                {/* Voice Services Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Voice Ordering */}
                    <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <ShoppingCart className="h-6 w-6 text-green-400" />
                                </div>
                                Voice Ordering
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-400">
                                Alex, our fast and efficient AI agent, calls suppliers for quick parts ordering. 
                                Collects all essential data in under 3 minutes per part with minimal conversation.
                            </p>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Quick data collection: part#, price, availability
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Under 3 minutes per part ordering
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Direct communication, no filler words
                                </div>
                            </div>

                            <Link href="/voice-calling/voice-ordering" className="block">
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                    Launch Parts Ordering
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Future: Voice Scheduling */}
                    <Card className="bg-[#111111] border-[#2a2a2a] opacity-50">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <PhoneCall className="h-6 w-6 text-blue-400" />
                                </div>
                                Voice Scheduling
                                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                                    Coming Soon
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-400">
                                AI agent for appointment scheduling, customer follow-ups, 
                                and service reminders via automated phone calls.
                            </p>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    Appointment scheduling
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    Service reminders
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    Customer follow-ups
                                </div>
                            </div>

                            <Button disabled className="w-full bg-gray-600 text-gray-400 cursor-not-allowed">
                                Coming Soon
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Stats */}
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-white">System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">Active</div>
                                <div className="text-sm text-gray-400">Voice Provider</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">0</div>
                                <div className="text-sm text-gray-400">Active Calls</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-400">Ready</div>
                                <div className="text-sm text-gray-400">AI Assistant</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}