import { NextRequest, NextResponse } from 'next/server'
import { MiaAssistantHelper } from '@/lib/integrations/vapi/assistant-configuration'

/**
 * Assistant Configuration API
 * GET /api/voice-calling/assistant - Get assistant configuration
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const detail = searchParams.get('detail') || 'basic'

        if (detail === 'full') {
            // Return full configuration (be careful with sensitive data)
            return NextResponse.json({
                success: true,
                assistant: MiaAssistantHelper.getFullConfig()
            })
        }

        // Return basic assistant information
        return NextResponse.json({
            success: true,
            assistant: {
                id: MiaAssistantHelper.getAssistantId(),
                name: MiaAssistantHelper.getFullConfig().name,
                voice: MiaAssistantHelper.getVoiceConfig(),
                transcriber: MiaAssistantHelper.getTranscriberConfig(),
                features: {
                    recordingEnabled: MiaAssistantHelper.isRecordingEnabled(),
                    endCallFunctionEnabled: MiaAssistantHelper.getFullConfig().endCallFunctionEnabled,
                    backgroundDenoisingEnabled: MiaAssistantHelper.getFullConfig().backgroundDenoisingEnabled
                },
                messages: {
                    firstMessage: MiaAssistantHelper.getFirstMessage(),
                    endCallMessage: MiaAssistantHelper.getEndCallMessage(),
                    endCallPhrases: MiaAssistantHelper.getEndCallPhrases()
                },
                tools: {
                    toolIds: MiaAssistantHelper.getToolIds(),
                    endCallToolId: MiaAssistantHelper.getEndCallToolId()
                }
            }
        })

    } catch (error: any) {
        console.error('❌ Assistant config error:', error)
        return NextResponse.json({ 
            error: 'Failed to get assistant configuration' 
        }, { status: 500 })
    }
}

