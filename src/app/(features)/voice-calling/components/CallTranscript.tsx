'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
    MessageSquare, 
    User, 
    Bot, 
    Clock, 
    Download, 
    Search,
    Volume2,
    FileText
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface CallTranscriptProps {
    callId?: string
    realTimeTranscript?: string[]
    className?: string
}

interface TranscriptSegment {
    id: string
    speaker: string
    text: string
    timestamp: string
    confidence?: number
    sentiment?: string
    analysis?: any
}

export default function CallTranscript({ 
    callId, 
    realTimeTranscript = [],
    className = '' 
}: CallTranscriptProps) {
    const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Fetch transcript segments for completed calls
    useEffect(() => {
        if (!callId) return

        const fetchTranscript = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/vapi/webhook?callId=${callId}`)
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }
                const data = await response.json()
                setTranscriptSegments(data.transcripts || [])
            } catch (error: any) {
                console.error('Failed to fetch transcript:', error)
                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        fetchTranscript()
    }, [callId])

    // Convert real-time transcript to display format
    const getRealTimeSegments = (): TranscriptSegment[] => {
        return realTimeTranscript.map((text, index) => ({
            id: `rt-${index}`,
            speaker: index % 2 === 0 ? 'assistant' : 'user',
            text,
            timestamp: new Date().toISOString(),
            confidence: 0.95
        }))
    }

    const allSegments = callId ? transcriptSegments : getRealTimeSegments()

    // Filter segments based on search
    const filteredSegments = allSegments.filter(segment =>
        segment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        segment.speaker.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getSpeakerIcon = (speaker: string) => {
        switch (speaker.toLowerCase()) {
            case 'assistant':
            case 'ai':
            case 'bot':
                return <Bot className="h-4 w-4 text-blue-400" />
            case 'user':
            case 'customer':
            case 'human':
                return <User className="h-4 w-4 text-green-400" />
            default:
                return <Volume2 className="h-4 w-4 text-gray-400" />
        }
    }

    const getSpeakerColor = (speaker: string) => {
        switch (speaker.toLowerCase()) {
            case 'assistant':
            case 'ai':
            case 'bot':
                return 'border-l-blue-500 bg-blue-900/10'
            case 'user':
            case 'customer':
            case 'human':
                return 'border-l-green-500 bg-green-900/10'
            default:
                return 'border-l-gray-500 bg-gray-900/10'
        }
    }

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive':
                return 'bg-green-600'
            case 'negative':
                return 'bg-red-600'
            case 'neutral':
                return 'bg-gray-600'
            default:
                return 'bg-blue-600'
        }
    }

    const exportTranscript = () => {
        const transcriptText = filteredSegments
            .map(segment => {
                const timestamp = new Date(segment.timestamp).toLocaleString()
                const speaker = segment.speaker.toUpperCase()
                return `[${timestamp}] ${speaker}: ${segment.text}`
            })
            .join('\n\n')

        const blob = new Blob([transcriptText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `call-transcript-${callId || 'live'}-${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        })
    }

    if (loading) {
        return (
            <Card className={`bg-[#111111] border-[#2a2a2a] ${className}`}>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-gray-400">Loading transcript...</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`bg-[#111111] border-[#2a2a2a] ${className}`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                        Call Transcript
                        {callId ? (
                            <Badge variant="outline" className="border-purple-500 text-purple-400">
                                Call ID: {callId.slice(-8)}
                            </Badge>
                        ) : (
                            <Badge className="bg-green-600">Live</Badge>
                        )}
                    </CardTitle>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={exportTranscript}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            disabled={allSegments.length === 0}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                        </Button>
                    </div>
                </div>
                
                {/* Search */}
                <div className="flex items-center gap-2 mt-4">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search transcript..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                    />
                </div>
            </CardHeader>
            
            <CardContent>
                {error ? (
                    <div className="text-red-400 text-center py-4">
                        Error loading transcript: {error}
                    </div>
                ) : allSegments.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No transcript available</p>
                        <p className="text-gray-500 text-sm mt-1">
                            {callId ? 'No transcript found for this call' : 'Transcript will appear here during the call'}
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-96 w-full">
                        <div className="space-y-3">
                            {filteredSegments.map((segment, index) => (
                                <div
                                    key={segment.id || index}
                                    className={`border-l-4 pl-4 py-3 rounded-r-lg ${getSpeakerColor(segment.speaker)}`}
                                >
                                    {/* Speaker Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getSpeakerIcon(segment.speaker)}
                                            <span className="text-white font-medium capitalize">
                                                {segment.speaker}
                                            </span>
                                            {segment.sentiment && (
                                                <Badge className={`${getSentimentColor(segment.sentiment)} text-white text-xs`}>
                                                    {segment.sentiment}
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Clock className="h-3 w-3" />
                                            {formatTimestamp(segment.timestamp)}
                                            {segment.confidence && (
                                                <span className="text-gray-500">
                                                    ({Math.round(segment.confidence * 100)}%)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Message Text */}
                                    <p className="text-gray-300 leading-relaxed">
                                        {searchTerm ? (
                                            segment.text.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) =>
                                                part.toLowerCase() === searchTerm.toLowerCase() ? (
                                                    <mark key={i} className="bg-yellow-500 text-black px-1 rounded">
                                                        {part}
                                                    </mark>
                                                ) : part
                                            )
                                        ) : (
                                            segment.text
                                        )}
                                    </p>
                                    
                                    {/* Analysis Data */}
                                    {segment.analysis && Object.keys(segment.analysis).length > 0 && (
                                        <div className="mt-2 p-2 bg-gray-900 rounded text-xs">
                                            <span className="text-gray-400">Analysis: </span>
                                            <span className="text-gray-300">
                                                {JSON.stringify(segment.analysis)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {searchTerm && filteredSegments.length === 0 && (
                            <div className="text-center py-8">
                                <Search className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-400">No matches found for "{searchTerm}"</p>
                            </div>
                        )}
                    </ScrollArea>
                )}
                
                {/* Transcript Stats */}
                {allSegments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Total segments: {allSegments.length}</span>
                            {filteredSegments.length !== allSegments.length && (
                                <span>Showing: {filteredSegments.length}</span>
                            )}
                            <span>
                                Duration: {callId ? 'Completed' : 'Live'}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
