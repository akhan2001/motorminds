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
        
        // Handle Vercel AI SDK format - messages array
        const messages = body.messages || []
        const context = body.context || { shop_id: 'default-shop' }
        
        if (!messages.length) {
            return Response.json(
                { error: 'No messages provided' },
                { status: 400 }
            )
        }
        
        // Authenticate user and validate shop access
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        // Get shop ID from users table (same approach as invoices page)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single()
            
        if (userError || !userData?.shop_id) {
            console.log('No shop_id found in users table for user:', user.id)
            return Response.json({ error: 'No shop associated with user. Please complete shop setup.' }, { status: 403 })
        }
        
        // Get shop data from shops table
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('id, shop_name')
            .eq('id', userData.shop_id)
            .single()
            
        if (shopError || !shopData) {
            console.log('Shop not found in shops table:', userData.shop_id)
            return Response.json({ error: 'Shop data not found' }, { status: 403 })
        }
        
        // Create session ID for conversation continuity
        const sessionId = body.session_id || `${user.id}-${shopData.id}-${Date.now()}`
        
        try {
            // Use Vercel AI SDK for streaming response
            const result = await streamText({
                model: openai('gpt-4o-mini'),
                messages: convertToCoreMessages([
                    {
                        role: 'system',
                        content: `You are MIA (MotorMinds Intelligent Assistant), a helpful AI assistant for automotive shop management.

You specialize in helping automotive shop staff with:
- Invoice-related questions and tasks
- Customer management
- Vehicle information
- Shop operations

Current shop: ${shopData.shop_name}

Be professional, helpful, and concise. Always provide clear and actionable responses.`
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
