import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        if (!process.env.PERPLEXITY_API_KEY) {
            return Response.json({ 
                error: 'Perplexity API key not configured',
                apiKeyPresent: false 
            }, { status: 500 })
        }

        // Simple test request to Perplexity
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [
                    { role: 'user', content: 'Hello, this is a test message.' }
                ],
                max_tokens: 50,
                stream: false
            })
        })

        console.log('Perplexity Test Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Perplexity Test Error:', errorText)
            return Response.json({
                error: 'Perplexity API Error',
                status: response.status,
                statusText: response.statusText,
                body: errorText,
                apiKeyPresent: true
            }, { status: 500 })
        }

        const data = await response.json()
        return Response.json({
            success: true,
            message: 'Perplexity API is working',
            apiKeyPresent: true,
            response: data
        })

    } catch (error) {
        console.error('Test API Error:', error)
        return Response.json({
            error: 'Failed to test Perplexity API',
            details: error instanceof Error ? error.message : 'Unknown error',
            apiKeyPresent: !!process.env.PERPLEXITY_API_KEY
        }, { status: 500 })
    }
}
