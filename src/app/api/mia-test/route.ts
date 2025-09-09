import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { messages, vehicleInfo } = await req.json()

        console.log('MIA Test Request:', { 
            messagesCount: messages?.length, 
            vehicleInfo,
            firstMessage: messages?.[0]
        })

        // Simulate a response without calling Perplexity API
        const mockResponse = {
            success: true,
            content: `Hello! I'm MIA (MotorMinds Intelligence Assistant). I received your message: "${messages?.[0]?.content || 'No message'}" and vehicle info: ${JSON.stringify(vehicleInfo || {})}. This is a test response to verify the API is working correctly.`,
            fullResponse: {
                choices: [{
                    message: {
                        content: `Test response for: ${messages?.[0]?.content || 'No message'}`
                    }
                }]
            }
        }

        return Response.json(mockResponse)

    } catch (error) {
        console.error('MIA Test API Error:', error)
        return new Response(`Test API Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
    }
}
