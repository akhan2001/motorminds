import { NextRequest, NextResponse } from 'next/server'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface VehicleContext {
    year?: number
    make?: string
    model?: string
    vin?: string
}

interface MiaRequest {
    messages: Message[]
    shopId: string
    vehicleContext?: VehicleContext
}

export async function POST(request: NextRequest) {
    try {
        const { messages, shopId, vehicleContext }: MiaRequest = await request.json()

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
        }

        // Get the latest user message
        const userMessage = messages[messages.length - 1]
        if (userMessage.role !== 'user') {
            return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 })
        }

        // Build query with vehicle context
        let query = userMessage.content
        if (vehicleContext && (vehicleContext.year || vehicleContext.make || vehicleContext.model)) {
            const vehicleInfo = `${vehicleContext.year || ''} ${vehicleContext.make || ''} ${vehicleContext.model || ''}`.trim()
            query = `${vehicleInfo} ${query}`
        }

        // Call Perplexity API
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: `You are Mia, an expert automotive diagnostic assistant for auto shops. 
                        Provide accurate, practical information about automotive repairs, diagnostics, and troubleshooting.
                        Always cite your sources and focus on actionable advice for professional mechanics.
                        Include cost estimates where relevant and emphasize safety considerations.
                        Keep responses concise but thorough.`
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                max_tokens: 1500,
                temperature: 0.2,
                top_p: 0.9,
                search_domain_filter: ["www.autorepairworld.com", "www.motor.com", "www.automotivetechinfo.com", "www.alldata.com"],
                return_citations: true,
                search_recency_filter: "month",
                top_k: 0,
                stream: false,
                presence_penalty: 0,
                frequency_penalty: 1
            })
        })

        if (!perplexityResponse.ok) {
            const errorText = await perplexityResponse.text()
            console.error('Perplexity API error:', errorText)
            return NextResponse.json({ 
                message: "I'm having trouble accessing automotive information right now. Please try again." 
            })
        }

        const data = await perplexityResponse.json()
        const assistantMessage = data.choices[0]?.message?.content || "I couldn't find information for your automotive query."

        return NextResponse.json({
            message: assistantMessage
        })

    } catch (error) {
        console.error('Error in Mia API:', error)
        return NextResponse.json({
            message: "Sorry, I encountered an error. Please try again."
        }, { status: 500 })
    }
}
