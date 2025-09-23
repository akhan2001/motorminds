'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, MessageSquare, TrendingUp, Clock } from 'lucide-react'

interface VapiAnalysisProps {
    callId?: string
    realTimeAnalysis?: any
    realTimeSummary?: string
    className?: string
}

export default function VapiAnalysis({ 
    callId, 
    realTimeAnalysis, 
    realTimeSummary,
    className = '' 
}: VapiAnalysisProps) {
    const [analysis, setAnalysis] = useState<any>(null)
    const [summary, setSummary] = useState<string>('')
    const [transcripts, setTranscripts] = useState<any[]>([])
    const [functionCalls, setFunctionCalls] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Use real-time data if available
    useEffect(() => {
        if (realTimeAnalysis) {
            setAnalysis(realTimeAnalysis)
        }
        if (realTimeSummary) {
            setSummary(realTimeSummary)
        }
    }, [realTimeAnalysis, realTimeSummary])

    // Fetch historical analysis data for completed calls
    useEffect(() => {
        if (!callId) return

        const fetchAnalysis = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(`/api/vapi/webhook?callId=${callId}`)
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }
                const data = await response.json()
                
                setAnalysis(data.analysis)
                setSummary(data.summary?.summary || '')
                setTranscripts(data.transcripts || [])
                setFunctionCalls(data.functionCalls || [])
            } catch (error: any) {
                console.error('Failed to fetch analysis:', error)
                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        fetchAnalysis()
    }, [callId])

    const getSentimentColor = (sentiment: string) => {
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

    const getSuccessMetrics = () => {
        if (!analysis?.success_metrics) return null
        
        const metrics = analysis.success_metrics
        return [
            { label: 'Quote Received', value: metrics.quoteReceived, icon: '💰' },
            { label: 'Contact Made', value: metrics.contactMade, icon: '📞' },
            { label: 'Information Gathered', value: metrics.infoGathered, icon: '📋' },
            { label: 'Follow-up Needed', value: metrics.followUpNeeded, icon: '🔄' }
        ].filter(metric => metric.value !== undefined)
    }

    if (loading) {
        return (
            <Card className={`bg-[#111111] border-[#2a2a2a] ${className}`}>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                    <span className="ml-2 text-gray-300">Loading analysis...</span>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className={`bg-[#111111] border-[#2a2a2a] ${className}`}>
                <CardContent className="py-4">
                    <p className="text-red-400">Error loading analysis: {error}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Real-time Analysis Status */}
            {(realTimeAnalysis || realTimeSummary) && (
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-400" />
                            Live Call Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {realTimeAnalysis && (
                                <div>
                                    <p className="text-sm text-gray-400 mb-2">Current Sentiment:</p>
                                    <Badge className={`${getSentimentColor(realTimeAnalysis.sentiment)} text-white`}>
                                        {realTimeAnalysis.sentiment || 'Analyzing...'}
                                    </Badge>
                                </div>
                            )}
                            {realTimeSummary && (
                                <div>
                                    <p className="text-sm text-gray-400 mb-2">Live Summary:</p>
                                    <p className="text-gray-300 text-sm">{realTimeSummary}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Call Summary */}
            {summary && (
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-blue-400" />
                            Call Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-300">{summary}</p>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Analysis */}
            {analysis && (
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-400" />
                            Analysis Results
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Sentiment Analysis */}
                            {analysis.sentiment && (
                                <div>
                                    <h4 className="text-white font-medium mb-2">Sentiment Analysis</h4>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`${getSentimentColor(analysis.sentiment)} text-white`}>
                                            {analysis.sentiment}
                                        </Badge>
                                        {analysis.sentiment_score && (
                                            <span className="text-gray-400 text-sm">
                                                Score: {(analysis.sentiment_score * 100).toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Key Topics */}
                            {analysis.topics && analysis.topics.length > 0 && (
                                <div>
                                    <h4 className="text-white font-medium mb-2">Key Topics</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.topics.map((topic: string, i: number) => (
                                            <Badge key={i} variant="outline" className="border-blue-500 text-blue-400">
                                                {topic}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Keywords */}
                            {analysis.keywords && analysis.keywords.length > 0 && (
                                <div>
                                    <h4 className="text-white font-medium mb-2">Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.keywords.map((keyword: string, i: number) => (
                                            <Badge key={i} variant="outline" className="border-yellow-500 text-yellow-400">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Success Metrics */}
                            {getSuccessMetrics() && (
                                <div>
                                    <h4 className="text-white font-medium mb-2">Success Metrics</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {getSuccessMetrics()!.map((metric, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm">
                                                <span>{metric.icon}</span>
                                                <span className="text-gray-300">{metric.label}:</span>
                                                <span className={metric.value ? 'text-green-400' : 'text-red-400'}>
                                                    {metric.value ? '✅' : '❌'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Confidence Score */}
                            {analysis.confidence_score && (
                                <div>
                                    <h4 className="text-white font-medium mb-2">Analysis Confidence</h4>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${analysis.confidence_score * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {(analysis.confidence_score * 100).toFixed(1)}% confident
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Function Calls */}
            {functionCalls.length > 0 && (
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-400" />
                            Function Calls
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {functionCalls.map((call, i) => (
                                <div key={i} className="border border-gray-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium">{call.function_name}</span>
                                        <Badge className={call.success ? 'bg-green-600' : 'bg-red-600'}>
                                            {call.success ? 'Success' : 'Failed'}
                                        </Badge>
                                    </div>
                                    {call.parameters && (
                                        <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded overflow-auto">
                                            {JSON.stringify(call.parameters, null, 2)}
                                        </pre>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(call.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No Data State */}
            {!loading && !analysis && !summary && !realTimeAnalysis && !realTimeSummary && (
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="text-center py-8">
                        <Brain className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No analysis data available</p>
                        <p className="text-gray-500 text-sm mt-1">
                            Analysis will appear here during and after calls
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
