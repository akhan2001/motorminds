'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Phone, MessageSquare } from 'lucide-react'

interface CallLogProps {
    className?: string
}

interface CallLogEntry {
    id: string
    call_id: string
    duration?: number
    status: string
    transcript?: string
    end_reason?: string
    cost?: number
    metadata?: any
    created_at: string
    updated_at: string
}

export default function CallLog({ 
    className = ''
}: CallLogProps) {
    const [callLogs, setCallLogs] = useState<CallLogEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch recent 5 call logs from Vapi
    useEffect(() => {
        const fetchCallLogs = async () => {
            setLoading(true)
            setError(null)
            try {
                console.log('📞 Fetching recent 5 call logs...')
                
                const response = await fetch('/api/vapi/call-logs?limit=5')
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                    throw new Error(`HTTP ${response.status}: ${errorData.error || 'Failed to fetch'}`)
                }
                const data = await response.json()
                setCallLogs(Array.isArray(data) ? data : [])
                
                console.log('✅ Recent call logs fetched:', data.length, 'calls')
            } catch (error: any) {
                console.error('❌ Failed to fetch call logs:', error)
                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        fetchCallLogs()
    }, [])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }

    if (loading) {
        return (
            <Card className={`bg-[#111111] border-[#2a2a2a] ${className}`}>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-gray-400">Loading recent calls...</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`bg-[#111111] border-[#2a2a2a] ${className}`}>
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                    Recent Call Messages (Last 5)
                </CardTitle>
            </CardHeader>
            
            <CardContent>
                {error ? (
                    <div className="text-red-400 text-center py-4">
                        Error loading call logs: {error}
                    </div>
                ) : callLogs.length === 0 ? (
                    <div className="text-center py-8">
                        <Phone className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No recent calls found</p>
                        <p className="text-gray-500 text-sm mt-1">
                            Recent call messages will appear here
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-96 w-full">
                        <div className="space-y-4">
                            {callLogs.map((log, index) => (
                                <div
                                    key={log.id}
                                    className="border border-gray-700 rounded-lg p-4 bg-gray-900/50"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-400 font-mono text-sm">#{index + 1}</span>
                                            <span className="text-gray-400 text-sm">
                                                {formatDate(log.created_at)}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">
                                                {log.status}
                                            </span>
                                        </div>
                                        <span className="text-gray-500 text-xs">
                                            ID: {log.call_id.slice(-8)}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-gray-800 rounded p-3">
                                        {log.transcript ? (
                                            <div>
                                                <p className="text-gray-400 text-xs mb-2">Message/Transcript:</p>
                                                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {log.transcript.length > 500 
                                                        ? log.transcript.substring(0, 500) + "..." 
                                                        : log.transcript
                                                    }
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">
                                                No transcript available
                                            </p>
                                        )}
                                    </div>
                                    
                                    {log.metadata?.phone_number && (
                                        <div className="mt-2 text-xs text-gray-400">
                                            📞 {log.metadata.phone_number}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}
