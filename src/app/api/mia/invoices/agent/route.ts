import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { handleAgentError, validateAgentConfig } from '@/lib/ai/langchain'
import { validateInvoicePrompt, type InvoicePrompt } from '../schemas'
import { createOpenAI } from '@ai-sdk/openai'
import { convertToCoreMessages, streamText } from 'ai'

// Initialize OpenAI
const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()
        
        // Validate request structure
        const validation = validateInvoicePrompt(body)
        if (!validation.success) {
            return Response.json(
                { error: 'Invalid request format', details: validation.error.errors },
                { status: 400 }
            )
        }
        
        const { message, context } = validation.data
        
        // Authenticate user and validate shop access
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        // Verify user has access to the shop
        const { data: shopData, error: shopError } = await supabase
            .from('shop_info')
            .select('id, shop_name')
            .eq('id', context.shop_id)
            .eq('owner_id', user.id)
            .single()
            
        if (shopError || !shopData) {
            return Response.json({ error: 'Shop access denied' }, { status: 403 })
        }
        
        // Get conversation history from request or initialize
        const messages = body.messages || [{ role: 'user', content: message }]
        
        // Create session ID for conversation continuity
        const sessionId = body.session_id || `${user.id}-${context.shop_id}-${Date.now()}`
        
        // Validate agent configuration
        const agentConfig = validateAgentConfig({
            shop_id: context.shop_id,
            current_customer_id: context.current_customer_id,
            current_vehicle_id: context.current_vehicle_id,
            current_invoice_id: context.current_invoice_id
        })
        
        if (!agentConfig) {
            return Response.json({ error: 'Invalid agent configuration' }, { status: 400 })
        }
        
        try {
            // Use Vercel AI SDK for streaming response
            const result = await streamText({
                model: openai('gpt-4o-mini'),
                messages: convertToCoreMessages([
                    {
                        role: 'system',
                        content: `You are MIA (MotorMinds Intelligent Assistant), an advanced AI assistant specialized in automotive shop invoice management for ${shopData.shop_name}.

## Your Core Capabilities:
- **Invoice Creation**: Generate detailed invoices with line items, calculations, and proper formatting
- **Customer Management**: Search, create, and update customer records
- **Vehicle Tracking**: Manage customer vehicle information and service history
- **Pricing Assistance**: Suggest competitive pricing for automotive services and parts
- **Invoice Analytics**: Search and analyze existing invoices and patterns

## Current Context:
- Shop: ${shopData.shop_name}
- Shop ID: ${context.shop_id}
${context.current_customer_id ? `- Active Customer: ${context.current_customer_id}` : ''}
${context.current_vehicle_id ? `- Active Vehicle: ${context.current_vehicle_id}` : ''}
${context.current_invoice_id ? `- Working on Invoice: ${context.current_invoice_id}` : ''}

## Communication Style:
- Be professional, helpful, and automotive-industry knowledgeable
- Use clear, concise language suitable for busy shop environments
- Ask clarifying questions when needed, but aim to infer reasonable defaults
- Provide actionable responses with specific next steps
- Always confirm important actions before executing them

Focus on helping with invoice-related tasks and questions efficiently and accurately.`
                    },
                    ...messages
                ]),
                temperature: 0.1,
                maxTokens: 1500,
            })

            // Return streaming response
            return result.toAIStreamResponse()
            
        } catch (agentError) {
            console.error('Agent processing error:', agentError)
            const errorMessage = handleAgentError(agentError)
            
            return Response.json({ 
                error: 'Processing error', 
                message: errorMessage 
            }, { status: 500 })
        }
        
    } catch (error) {
        console.error('API route error:', error)
        return Response.json({ 
            error: 'Internal server error',
            message: 'An unexpected error occurred. Please try again.'
        }, { status: 500 })
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

// Health check endpoint
export async function GET(request: NextRequest) {
    try {
        // Basic connectivity test
        const supabase = await createClient()
        const { error } = await supabase.from('shop_info').select('id').limit(1)
        
        if (error) {
            return Response.json({ 
                status: 'error', 
                message: 'Database connectivity issue' 
            }, { status: 503 })
        }
        
        return Response.json({ 
            status: 'healthy',
            service: 'MIA Invoice Agent',
            timestamp: new Date().toISOString()
        })
        
    } catch (error) {
        return Response.json({ 
            status: 'error', 
            message: 'Health check failed' 
        }, { status: 503 })
    }
}
