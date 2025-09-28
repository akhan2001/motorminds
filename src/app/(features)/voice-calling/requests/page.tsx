'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Phone, RefreshCw } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import { toast } from 'sonner'
import type { VoiceCall, VoiceCallStatus } from '../types/voice-call'
import VoiceCallTable from '../components/VoiceCallTable'
import CallForm from '../components/CallForm'

export default function VoiceCallRequestsPage() {
    const [voiceCalls, setVoiceCalls] = useState<VoiceCall[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | VoiceCallStatus>('all')

    useEffect(() => {
        fetchVoiceCalls()
    }, [])

    const fetchVoiceCalls = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/voice-calling/requests')
            const data = await response.json()
            if (response.ok) {
                setVoiceCalls(data.voiceCalls || [])
            } else {
                toast.error(data.error || 'Failed to fetch voice calls')
            }
        } catch (error) {
            console.error('Error fetching voice calls:', error)
            toast.error('Failed to fetch voice calls')
        } finally {
            setLoading(false)
        }
    }

    const handleRefreshCall = async (callId: string) => {
        try {
            const response = await fetch(`/api/voice-calling/refresh-analysis?call_id=${callId}`, {
                method: 'GET'
            })
            
            if (response.ok) {
                const data = await response.json()
                toast.success('Call analysis refreshed successfully!')
                
                // Update the specific call in the state
                setVoiceCalls(prevCalls => 
                    prevCalls.map(call => 
                        call.vapi_call_id === callId 
                            ? { ...call, ...data, updated_at: new Date().toISOString() }
                            : call
                    )
                )
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to refresh call analysis')
            }
        } catch (error) {
            console.error('Error refreshing call:', error)
            toast.error('Failed to refresh call analysis')
        }
    }


    const filteredCalls = voiceCalls.filter(call => {
        if (filter === 'all') return true
        return call.status === filter
    })

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-6xl mx-auto w-full">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb className="mb-6">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/dashboard" className="text-gray-400 hover:text-gray-300">
                                            Home
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="h-4 w-4" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/voice-calling" className="text-gray-400 hover:text-gray-300">
                                            Voice Calling
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="h-4 w-4" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">
                                        Call Requests
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Voice Call Requests
                                </h1>
                                <p className="text-gray-400">
                                    Review voice calls made for parts requests
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={fetchVoiceCalls}
                                    variant="outline"
                                    className="border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                                <CallForm
                                    trigger={
                                        <Button
                                            variant="outline"
                                            className="border-[#2a2a2a] bg-green-600 hover:bg-green-700 text-gray-300 hover:text-white"
                                        >
                                            <Phone className="h-4 w-4 mr-2" />
                                            Start New Call
                                        </Button>
                                    }
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2 mb-6">
                            {(['all', 'pending', 'connecting', 'in_progress', 'completed', 'failed', 'cancelled', 'ready_to_order'] as const).map((status) => (
                                <Button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    variant={filter === status ? 'default' : 'outline'}
                                    className={
                                        filter === status
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]'
                                    }
                                    size="sm"
                                >
                                    {status === 'ready_to_order' ? 'Ready to Order' :
                                     status.charAt(0).toUpperCase() + status.slice(1)}
                                </Button>
                            ))}
                        </div>

                        {/* Voice Calls Table */}
                        <VoiceCallTable
                            calls={filteredCalls}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
