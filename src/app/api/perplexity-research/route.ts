import { NextRequest, NextResponse } from 'next/server'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

export async function POST(request: NextRequest) {
    try {
        if (!process.env.PERPLEXITY_API_KEY) {
            return NextResponse.json(
                {
                    error: 'Perplexity API key not configured',
                    content: 'Research functionality is currently unavailable.',
                },
                { status: 500 }
            )
        }

        const body = await request.json()
        const { query, vehicleContext } = body

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                {
                    error: 'Query is required',
                    content: 'Please provide a search query.',
                },
                { status: 400 }
            )
        }

        // Build enhanced query with vehicle context
        const enhancedQuery = vehicleContext
            ? `${query} (Vehicle: ${vehicleContext.year || ''} ${vehicleContext.make || ''} ${vehicleContext.model || ''} ${vehicleContext.engine || ''})`
            : query

        const response = await fetch(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [
                    {
                        role: 'system',
                        content: `You are an automotive diagnostic research assistant. Search online forums, technical documentation, and automotive resources to provide comprehensive answers with citations. Focus on practical solutions, troubleshooting steps, and real-world experiences from automotive forums.`,
                    },
                    {
                        role: 'user',
                        content: enhancedQuery,
                    },
                ],
                stream: false,
                max_tokens: 4000,
                temperature: 0.2,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Perplexity API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            })
            return NextResponse.json(
                {
                    error: `Perplexity API error: ${response.status}`,
                    content: 'Unable to perform research at this time.',
                },
                { status: 500 }
            )
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || 'No research results found.'
        const citations = data.citations || []
        const searchResults = data.search_results || []

        return NextResponse.json({
            content,
            citations,
            searchResults,
            sources: citations.map((cite: string, idx: number) => ({
                id: idx + 1,
                url: cite,
            })),
        })
    } catch (error) {
        console.error('Perplexity research error:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                content: 'Research request failed. Please try again.',
            },
            { status: 500 }
        )
    }
}

