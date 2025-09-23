import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, data } = body

        console.log('📡 Vapi Webhook:', type, data)

        switch (type) {
            case 'call-end':
                await handleCallEnd(data)
                break
            case 'analysis':
                await handleAnalysis(data)
                break
            case 'summary':
                await handleSummary(data)
                break
            case 'transcript':
                await handleTranscript(data)
                break
            case 'function-call':
                await handleFunctionCall(data)
                break
            default:
                console.log('🔄 Unhandled webhook type:', type)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('❌ Webhook error:', error)
        return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
    }
}

async function handleCallEnd(data: any) {
    try {
        const supabase = await createClient()
        
        await supabase
            .from('call_logs')
            .upsert({
                call_id: data.callId || data.id,
                duration: data.duration,
                status: data.status || 'completed',
                transcript: data.transcript || '',
                end_reason: data.endReason,
                cost: data.cost,
                metadata: data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })

        console.log('✅ Call end logged:', data.callId)
    } catch (error) {
        console.error('❌ Failed to log call end:', error)
    }
}

async function handleAnalysis(data: any) {
    try {
        const supabase = await createClient()
        
        await supabase
            .from('call_analysis')
            .upsert({
                call_id: data.callId || data.id,
                sentiment: data.sentiment,
                sentiment_score: data.sentimentScore,
                keywords: data.keywords || [],
                topics: data.topics || [],
                success_metrics: data.successMetrics || {},
                structured_data: data.structuredData || {},
                confidence_score: data.confidenceScore,
                analysis_metadata: data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })

        console.log('✅ Analysis saved:', data.callId)
    } catch (error) {
        console.error('❌ Failed to save analysis:', error)
    }
}

async function handleSummary(data: any) {
    try {
        const supabase = await createClient()
        
        await supabase
            .from('call_summaries')
            .upsert({
                call_id: data.callId || data.id,
                summary: data.summary,
                key_points: data.keyPoints || [],
                action_items: data.actionItems || [],
                outcome: data.outcome,
                next_steps: data.nextSteps || [],
                summary_metadata: data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })

        console.log('✅ Summary saved:', data.callId)
    } catch (error) {
        console.error('❌ Failed to save summary:', error)
    }
}

async function handleTranscript(data: any) {
    try {
        const supabase = await createClient()
        
        // Store individual transcript segments with timestamps
        if (data.transcript && data.callId) {
            await supabase
                .from('call_transcripts')
                .insert({
                    call_id: data.callId,
                    speaker: data.speaker || 'unknown',
                    text: data.transcript,
                    timestamp: data.timestamp || new Date().toISOString(),
                    confidence: data.confidence,
                    sentiment: data.sentiment,
                    analysis: data.analysis || {},
                    created_at: new Date().toISOString()
                })
        }

        console.log('✅ Transcript segment saved:', data.callId)
    } catch (error) {
        console.error('❌ Failed to save transcript:', error)
    }
}

async function handleFunctionCall(data: any) {
    try {
        const supabase = await createClient()
        
        await supabase
            .from('call_function_calls')
            .insert({
                call_id: data.callId || data.id,
                function_name: data.functionCall?.name,
                parameters: data.functionCall?.parameters || {},
                result: data.result || {},
                success: data.success || false,
                timestamp: data.timestamp || new Date().toISOString(),
                created_at: new Date().toISOString()
            })

        console.log('✅ Function call logged:', data.functionCall?.name)
    } catch (error) {
        console.error('❌ Failed to log function call:', error)
    }
}

// GET endpoint to retrieve analysis data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const callId = searchParams.get('callId')
        
        if (!callId) {
            return NextResponse.json({ error: 'callId is required' }, { status: 400 })
        }

        const supabase = await createClient()
        
        // Fetch all analysis data for the call
        const [callLog, analysis, summary, transcripts, functionCalls] = await Promise.all([
            supabase.from('call_logs').select('*').eq('call_id', callId).single(),
            supabase.from('call_analysis').select('*').eq('call_id', callId).single(),
            supabase.from('call_summaries').select('*').eq('call_id', callId).single(),
            supabase.from('call_transcripts').select('*').eq('call_id', callId).order('timestamp'),
            supabase.from('call_function_calls').select('*').eq('call_id', callId).order('timestamp')
        ])

        return NextResponse.json({
            callLog: callLog.data,
            analysis: analysis.data,
            summary: summary.data,
            transcripts: transcripts.data || [],
            functionCalls: functionCalls.data || []
        })
    } catch (error) {
        console.error('❌ Failed to fetch analysis:', error)
        return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 })
    }
}
