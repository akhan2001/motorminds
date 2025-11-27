import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

// Perplexity API configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

const PARTS_ADVISOR_SYSTEM_PROMPT = `You are Mia, the MotorMinds AI parts advisor for Canadian customers. You help customers find real automotive parts from actual Canadian suppliers with current CAD pricing and availability.

CRITICAL RESPONSE FORMAT INSTRUCTIONS:
- MUST respond with ONLY a valid JSON object
- NO markdown code blocks (no triple backticks)
- NO text before or after the JSON
- NO additional formatting or explanations
- Start directly with { and end with }

Your Task:
Search the internet for REAL AUTOMOTIVE PARTS from CANADIAN SUPPLIERS ONLY that match the user's request. Find actual Canadian retailers, current CAD prices, part numbers, and availability from major Canadian auto parts stores.

Required JSON Response Format (respond with this exact structure):
{
  "message": "Brief helpful message about the search results",
  "parts": [
    {
      "partName": "Exact part name from supplier",
      "partNumber": "Real manufacturer part number", 
      "compatible": "Vehicle compatibility info",
      "price": "$XX.XX CAD (current Canadian price)",
      "supplier": "Supplier/retailer name",
      "availability": "In stock/Out of stock/2-3 days",
      "link": "Direct link to product page"
    }
  ],
  "sources": [
    {
      "title": "Source title",
      "url": "Source URL", 
      "description": "Brief description of source"
    }
  ]
}

Search Guidelines:
- Search ONLY major Canadian auto parts retailers: NAPA Canada, Canadian Tire, Chase Auto Parts, PartSource, Auto Value, Uni-Select Canada, etc.
- Include OEM manufacturers available in Canada: Bosch, ACDelco, Motorcraft, Genuine Honda/Toyota/Ford parts
- Find current Canadian pricing (CAD) and availability
- Include direct links to Canadian retailer product pages when possible
- Verify part compatibility with the specific vehicle
- Prioritize quality brands and reliable Canadian suppliers
- Focus exclusively on Canadian suppliers and retailers with Canadian inventory

Vehicle Context: {vehicleContext}
User Query: {query}

IMPORTANT: Respond with ONLY the JSON object. No other text, no markdown formatting, no code blocks.`

export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()
        const { message, vehicleContext, sessionId } = await request.json()

        if (!message || !sessionId) {
            return NextResponse.json(
                { error: 'Message and sessionId are required' },
                { status: 400 }
            )
        }

        // Verify session belongs to shop and get session data
        const { data: session, error: sessionError } = await supabase
            .from('mia_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .eq('shop_id', shopId)
            .eq('status', 'active')
            .single()

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found or inactive' }, { status: 404 })
        }

        // Use vehicle context from session if not provided in request
        const contextToUse = vehicleContext || session.vehicle_context

        // Store user message
        const { error: userMessageError } = await supabase
            .from('mia_messages')
            .insert({
                session_id: sessionId,
                role: 'user',
                content: message,
                metadata: { vehicleContext: contextToUse }
            })

        if (userMessageError) {
            console.error('Error storing user message:', userMessageError)
            return NextResponse.json({ error: 'Failed to store message' }, { status: 500 })
        }

        // Check if Perplexity API key is configured
        if (!process.env.PERPLEXITY_API_KEY) {
            // Store fallback AI response
            const fallbackMessage = "I'd be happy to help you find parts! However, my real-time search capabilities are currently being configured. Please use the catalog search above to browse available parts."
            
            await supabase
                .from('mia_messages')
                .insert({
                    session_id: sessionId,
                    role: 'assistant',
                    content: fallbackMessage,
                    metadata: { products: [], sources: [], type: 'fallback' }
                })

            return NextResponse.json({
                success: true,
                message: fallbackMessage,
                products: [],
                sources: []
            })
        }

        try {
            // Create enhanced system prompt with vehicle context
            const vehicleContextString = contextToUse && Object.keys(contextToUse).length > 0 
                ? `${contextToUse.year || ''} ${contextToUse.make || ''} ${contextToUse.model || ''} ${contextToUse.engine || ''}`.trim()
                : "No specific vehicle selected"
            
            const enhancedSystemPrompt = PARTS_ADVISOR_SYSTEM_PROMPT
                .replace("{vehicleContext}", vehicleContextString)
                .replace("{query}", message)

            // Prepare Perplexity API request
            const requestBody = {
                model: 'sonar-pro', // Use sonar-pro for real-time web search
                messages: [
                    {
                        role: 'system',
                        content: enhancedSystemPrompt
                    },
                    {
                        role: 'user',
                        content: `Find real automotive parts for: ${message}${vehicleContextString !== "No specific vehicle selected" ? ` for ${vehicleContextString}` : ''}

IMPORTANT: Respond with ONLY a valid JSON object. No markdown formatting, no code blocks, no additional text. Start with { and end with }.`
                    }
                ],
                stream: false,
                max_tokens: 4000,
                temperature: 0.1, // Lower temperature for more consistent formatting
                top_p: 0.9
            }

            // Call Perplexity API
            const response = await fetch(PERPLEXITY_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Perplexity API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                })
                throw new Error(`Perplexity API Error: ${response.status}`)
            }

            const data = await response.json()
            const aiResponse = data.choices?.[0]?.message?.content?.trim()
            const citations = data.citations || []

            if (!aiResponse) {
                throw new Error("No response from Perplexity")
            }

            // Try to parse as JSON with robust cleaning
            let parsedResponse
            try {
                // Clean the response to handle various formatting issues
                let cleanedResponse = aiResponse.trim()
                
                // Remove markdown code blocks if present
                if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
                    cleanedResponse = cleanedResponse
                        .replace(/^```json\s*/, '')
                        .replace(/\s*```$/, '')
                        .trim()
                } else if (cleanedResponse.startsWith('```') && cleanedResponse.endsWith('```')) {
                    cleanedResponse = cleanedResponse
                        .replace(/^```\s*/, '')
                        .replace(/\s*```$/, '')
                        .trim()
                }
                
                // Remove any leading/trailing text that isn't JSON
                const jsonStart = cleanedResponse.indexOf('{')
                const jsonEnd = cleanedResponse.lastIndexOf('}')
                if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                    cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1)
                }
                
                parsedResponse = JSON.parse(cleanedResponse)
                
                // Validate required fields
                if (!parsedResponse.message || !Array.isArray(parsedResponse.parts) || !Array.isArray(parsedResponse.sources)) {
                    throw new Error('Invalid JSON structure')
                }
                
            } catch (parseError) {
                console.error('JSON parsing failed:', parseError)
                
                // If JSON parsing fails, try to extract meaningful information
                let fallbackMessage = "I found some automotive parts information, but I'm having trouble formatting the response properly. Please try rephrasing your request."
                
                // Try to extract the message from the raw response if it looks like JSON
                try {
                    const messageMatch = aiResponse.match(/"message":\s*"([^"]+)"/);
                    if (messageMatch && messageMatch[1]) {
                        fallbackMessage = messageMatch[1];
                    }
                } catch (e) {
                    console.error('Failed to extract message:', e)
                }
                
                const fallbackSources = citations.map((citation: any) => ({
                    title: citation.title || 'Search Result',
                    url: citation.url || '',
                    description: citation.text || ''
                }))

                await supabase
                    .from('mia_messages')
                    .insert({
                        session_id: sessionId,
                        role: 'assistant',
                        content: fallbackMessage,
                        metadata: { 
                            products: [],
                            sources: fallbackSources,
                            type: 'text_response',
                            parseError: true
                        }
                    })

                return NextResponse.json({
                    success: true,
                    message: fallbackMessage,
                    products: [],
                    sources: fallbackSources
                })
            }

            // Validate and transform the response
            const parts = Array.isArray(parsedResponse.parts) ? parsedResponse.parts.filter((part: any) => 
                part &&
                typeof part.partName === 'string' &&
                typeof part.partNumber === 'string' &&
                typeof part.compatible === 'string' &&
                typeof part.price === 'string'
            ) : []

            // Combine sources from response and citations
            const sources = [
                ...(parsedResponse.sources || []),
                ...citations.map((citation: any) => ({
                    title: citation.title || 'Search Result',
                    url: citation.url || '',
                    description: citation.text || ''
                }))
            ]

            const responseMessage = parsedResponse.message || `Found ${parts.length} real parts from suppliers:`
            const limitedSources = sources.slice(0, 5)

            // Store AI response
            await supabase
                .from('mia_messages')
                .insert({
                    session_id: sessionId,
                    role: 'assistant',
                    content: responseMessage,
                    metadata: { 
                        parts: parts,
                        sources: limitedSources,
                        type: 'search_results',
                        vehicleContext: contextToUse
                    }
                })

            return NextResponse.json({
                success: true,
                message: responseMessage,
                products: parts,
                sources: limitedSources
            })

        } catch (aiError) {
            console.error('Perplexity API error:', aiError)
            
            // Store fallback AI error response
            const errorMessage = "I'm having trouble searching for parts right now. Please try the catalog search above or rephrase your question."
            
            await supabase
                .from('mia_messages')
                .insert({
                    session_id: sessionId,
                    role: 'assistant',
                    content: errorMessage,
                    metadata: { 
                        products: [],
                        sources: [],
                        type: 'error_response',
                        error: aiError instanceof Error ? aiError.message : 'Unknown error'
                    }
                })

            return NextResponse.json({
                success: true,
                message: errorMessage,
                products: [],
                sources: []
            })
        }

    } catch (error) {
        console.error('Mia API error:', error)
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        )
    }
}