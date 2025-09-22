'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react'

// Vapi Web SDK types
interface VapiWebClient {
    start: (assistantId: string, options?: any) => Promise<void>
    stop: () => void
    on: (event: string, callback: (data: any) => void) => void
    off: (event: string, callback: (data: any) => void) => void
    send: (message: any) => void
}

declare global {
    interface Window {
        vapi?: VapiWebClient
    }
}

interface VapiWebClientProps {
    assistantId?: string
    onQuoteReceived?: (quote: any) => void
    onCallEnd?: () => void
}

export default function VapiWebClient({
    assistantId = '8f1236c2-aba3-4741-8a12-3227c72de173',
    onQuoteReceived,
    onCallEnd
}: VapiWebClientProps) {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    const [isLoaded, setIsLoaded] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isCallActive, setIsCallActive] = useState(false)
    const [transcript, setTranscript] = useState<string[]>([])
    const vapiRef = useRef<VapiWebClient | null>(null)

    useEffect(() => {
        // Load Vapi Web SDK
        const loadVapiSDK = () => {
            if (window.vapi) {
                vapiRef.current = window.vapi
                setIsLoaded(true)
                setupEventListeners()
                return
            }

            const script = document.createElement('script')
            script.src = 'https://cdn.vapi.ai/vapi.js'
            script.async = true
            script.onload = () => {
                if (window.vapi) {
                    vapiRef.current = window.vapi
                    setIsLoaded(true)
                    setupEventListeners()
                }
            }
            script.onerror = () => {
                console.error('Failed to load Vapi SDK')
            }
            document.head.appendChild(script)
        }

        loadVapiSDK()

        return () => {
            if (vapiRef.current) {
                removeEventListeners()
            }
        }
    }, [])

    const setupEventListeners = () => {
        if (!vapiRef.current) return

        // Call start event
        vapiRef.current.on('call-start', (data: any) => {
            console.log('📞 Call started:', data)
            setIsCallActive(true)
            setIsConnected(true)
        })

        // Call end event
        vapiRef.current.on('call-end', (data: any) => {
            console.log('📞 Call ended:', data)
            setIsCallActive(false)
            setIsConnected(false)
            onCallEnd?.(data)
        })

        // Function call event (when AI calls functions)
        vapiRef.current.on('function-call', (data: any) => {
            console.log('🔧 Function called:', data)
            
            if (data.functionCall?.name === 'savePartsInfo' || data.functionCall?.name === 'save_parts_quote') {
                console.log('💾 Quote data received:', data.functionCall.parameters)
                onQuoteReceived?.(data.functionCall.parameters)
            }
        })

        // Transcript updates
        vapiRef.current.on('message', (data: any) => {
            if (data.type === 'transcript') {
                console.log('📝 Transcript:', data.transcript)
                setTranscript(prev => [...prev, data.transcript])
            }
        })

        // Error handling
        vapiRef.current.on('error', (error: any) => {
            console.error('❌ Vapi error:', error)
        })
    }

    const removeEventListeners = () => {
        if (!vapiRef.current) return
        // Remove event listeners to prevent memory leaks
        vapiRef.current.off('call-start', () => {})
        vapiRef.current.off('call-end', () => {})
        vapiRef.current.off('function-call', () => {})
        vapiRef.current.off('message', () => {})
        vapiRef.current.off('error', () => {})
    }

    const startCall = async () => {
        if (!vapiRef.current || !isLoaded) {
            console.error('Vapi not loaded')
            return
        }

        if (!publicKey) {
            console.error('Vapi public key not configured')
            return
        }

        try {
            console.log('🚀 Starting call with assistant:', assistantId)
            
            await vapiRef.current.start(assistantId, {
                // You can pass additional context here
                metadata: {
                    source: 'web_client',
                    timestamp: new Date().toISOString()
                }
            })
        } catch (error) {
            console.error('❌ Failed to start call:', error)
        }
    }

    const endCall = () => {
        if (vapiRef.current && isCallActive) {
            vapiRef.current.stop()
        }
    }

    if (!isLoaded) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-4">
                    <div className="text-center text-gray-400">
                        Loading Vapi SDK...
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!publicKey) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-4">
                    <div className="text-center text-red-400">
                        Vapi public key not configured
                        <br />
                        <small>Add NEXT_PUBLIC_VAPI_PUBLIC_KEY to your .env</small>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    {isCallActive ? (
                        <>
                            <Mic className="h-5 w-5 text-green-400" />
                            Call Active with Mia AI
                        </>
                    ) : (
                        <>
                            <Phone className="h-5 w-5 text-blue-400" />
                            Test Mia AI Assistant
                        </>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    {!isCallActive ? (
                        <Button
                            onClick={startCall}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Phone className="h-4 w-4 mr-2" />
                            Start Voice Call
                        </Button>
                    ) : (
                        <Button
                            onClick={endCall}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <PhoneOff className="h-4 w-4 mr-2" />
                            End Call
                        </Button>
                    )}
                </div>

                {/* Call Status */}
                <div className="text-sm">
                    <div className="text-gray-400">Status:</div>
                    <div className={isCallActive ? 'text-green-400' : 'text-gray-400'}>
                        {isCallActive ? 'Call in progress...' : 'Ready to call'}
                    </div>
                </div>

                {/* Live Transcript */}
                {transcript.length > 0 && (
                    <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <div className="text-sm text-gray-400 mb-2">Live Transcript:</div>
                        {transcript.map((message, index) => (
                            <div key={index} className="text-sm text-gray-300 mb-1">
                                {message}
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-xs text-gray-500">
                    Assistant ID: {assistantId}
                </div>
            </CardContent>
        </Card>
    )
}
