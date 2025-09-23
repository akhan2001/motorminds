'use client'

import { useEffect, useRef, useState } from 'react'

// Vapi Web SDK types
interface VapiWebSDK {
    start: (assistantId: string, options?: any) => Promise<void>
    stop: () => void
    on: (event: string, callback: (data: any) => void) => void
    off: (event: string, callback: (data: any) => void) => void
    send: (message: any) => void
}

declare global {
    interface Window {
        vapi?: VapiWebSDK
    }
}

interface UseVapiEventsOptions {
    assistantId: string
    customerNumber: string
    onQuoteSaved?: (quoteData: any) => void
    onCallEnd?: (data: any) => void
    onError?: (error: any) => void
    onAnalysis?: (analysis: any) => void
    onSummary?: (summary: any) => void
    onTranscriptUpdate?: (transcript: any) => void
}

export function useVapiEvents({
    assistantId,
    customerNumber,
    onQuoteSaved,
    onCallEnd,
    onError,
    onAnalysis,
    onSummary,
    onTranscriptUpdate
}: UseVapiEventsOptions) {
    const [isConnected, setIsConnected] = useState(false)
    const [isCallActive, setIsCallActive] = useState(false)
    const [callTranscript, setCallTranscript] = useState<string[]>([])
    const [callAnalysis, setCallAnalysis] = useState<any>(null)
    const [callSummary, setCallSummary] = useState<string>('')
    const vapiRef = useRef<VapiWebSDK | null>(null)

    useEffect(() => {
        // Load Vapi Web SDK if not already loaded
        if (!window.vapi) {
            const script = document.createElement('script')
            script.src = 'https://cdn.vapi.ai/vapi.js'
            script.async = true
            script.onload = () => {
                if (window.vapi) {
                    vapiRef.current = window.vapi
                    setIsConnected(true)
                    setupEventListeners()
                }
            }
            document.head.appendChild(script)
        } else {
            vapiRef.current = window.vapi
            setIsConnected(true)
            setupEventListeners()
        }

        return () => {
            if (vapiRef.current) {
                removeEventListeners()
            }
        }
    }, [])

    const setupEventListeners = () => {
        if (!vapiRef.current) return

        // Call started event
        vapiRef.current.on('call-start', (data: any) => {
            console.log('📞 Call started:', data)
            setIsCallActive(true)
        })

        // Call ended event
        vapiRef.current.on('call-end', (data: any) => {
            console.log('📞 Call ended:', data)
            setIsCallActive(false)
            onCallEnd?.(data)
        })

        // Function call event - this is where we listen for savePartsInfo
        vapiRef.current.on('function-call', (data: any) => {
            console.log('🔧 Function called:', data)
            
            if (data.functionCall?.name === 'savePartsInfo') {
                console.log('💾 Quote data received via function call:', data.functionCall.parameters)
                onQuoteSaved?.(data.functionCall.parameters)
            }
        })

        // Transcript updates
        vapiRef.current.on('message', (data: any) => {
            if (data.type === 'transcript') {
                setCallTranscript(prev => [...prev, data.transcript])
                onTranscriptUpdate?.(data)
            }
        })

        // Analysis event - Vapi's built-in call analysis
        vapiRef.current.on('analysis', (data: any) => {
            console.log('📊 Vapi Analysis:', data)
            setCallAnalysis(data)
            onAnalysis?.(data)
        })

        // Summary event - Call summary from Vapi
        vapiRef.current.on('summary', (data: any) => {
            console.log('📋 Call Summary:', data)
            setCallSummary(data.summary || data)
            onSummary?.(data)
        })

        // Enhanced transcript event with analysis
        vapiRef.current.on('transcript', (data: any) => {
            console.log('📝 Enhanced Transcript:', data)
            if (data.analysis) {
                console.log('Real-time analysis:', data.analysis)
            }
            onTranscriptUpdate?.(data)
        })

        // Error handling
        vapiRef.current.on('error', (error: any) => {
            console.error('❌ Vapi error:', error)
            onError?.(error)
        })
    }

    const removeEventListeners = () => {
        if (!vapiRef.current) return

        vapiRef.current.off('call-start', () => {})
        vapiRef.current.off('call-end', () => {})
        vapiRef.current.off('function-call', () => {})
        vapiRef.current.off('message', () => {})
        vapiRef.current.off('analysis', () => {})
        vapiRef.current.off('summary', () => {})
        vapiRef.current.off('transcript', () => {})
        vapiRef.current.off('error', () => {})
    }

    const startCall = async () => {
        if (!vapiRef.current || !isConnected) {
            throw new Error('Vapi not connected')
        }

        try {
            await vapiRef.current.start(assistantId, {
                customer: { number: customerNumber }
            })
        } catch (error) {
            console.error('❌ Failed to start call:', error)
            throw error
        }
    }

    const endCall = () => {
        if (vapiRef.current && isCallActive) {
            vapiRef.current.stop()
        }
    }

    const sendMessage = (message: any) => {
        if (vapiRef.current && isCallActive) {
            vapiRef.current.send(message)
        }
    }

    return {
        isConnected,
        isCallActive,
        callTranscript,
        callAnalysis,
        callSummary,
        startCall,
        endCall,
        sendMessage
    }
}
