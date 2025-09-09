import { StreamingTextResponse } from 'ai'
import { NextRequest } from 'next/server'

// Perplexity API configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

export async function POST(req: NextRequest) {
    try {
        if (!process.env.PERPLEXITY_API_KEY) {
            return new Response('Perplexity API key not configured', { status: 500 })
        }

        const { messages, vehicleInfo, diagnosticMode = 'basic' } = await req.json()

        // Validate request data
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.error('Invalid messages in request:', messages)
            return new Response('Invalid messages in request', { status: 400 })
        }

        console.log('MIA Diagnostics Request:', { 
            messagesCount: messages?.length, 
            vehicleInfo, 
            diagnosticMode,
            apiKeyPresent: !!process.env.PERPLEXITY_API_KEY,
            firstMessage: messages[0]
        })

        // Build comprehensive automotive diagnostic prompt
        const systemPrompt = buildDiagnosticPrompt(vehicleInfo, diagnosticMode)
        
        // Create enhanced messages with vehicle context
        const enhancedMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ]

        // Simplified Perplexity API request with working configuration
        const requestBody = {
            model: 'sonar-pro', // Use the working model from test-perplexity.js
            messages: enhancedMessages,
            stream: false, // Start with non-streaming for debugging
            max_tokens: 4000,
            temperature: 0.2,
            top_p: 0.9
        }

        console.log('Perplexity API Request Body:', JSON.stringify(requestBody, null, 2))

        // Call Perplexity API directly
        let response = await fetch(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })

        // Check if response is successful
        if (!response.ok) {
            const errorText = await response.text()
            console.error('Perplexity API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            })
            return new Response(`Perplexity API Error: ${response.status} - ${errorText}`, { status: 500 })
        }

        // Handle non-streaming response for debugging
        const data = await response.json()
        console.log('Perplexity API Response:', data)
        
        // Extract the response content and citations
        const content = data.choices?.[0]?.message?.content || 'No response content'
        const citations = data.citations || []
        const searchResults = data.search_results || []
        
        // Images functionality removed
        
        return Response.json({
            success: true,
            content: content,
            citations: citations,
            searchResults: searchResults,
            fullResponse: data
        })
        
    } catch (error) {
        console.error('MIA Diagnostics API Error:', error)
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined
        })
        return new Response(`Failed to process diagnostic request: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
    }
}

function buildDiagnosticPrompt(vehicleInfo: any, diagnosticMode: string): string {
    const basePrompt = `You are MIA (MotorMinds Intelligence Assistant), an expert automotive diagnostic AI assistant. Your role is to provide comprehensive, accurate, and actionable vehicle diagnostic assistance.

## Your Expertise:
- Advanced automotive diagnostics and troubleshooting
- OBD-II codes interpretation and root cause analysis
- Service manual procedures and technical specifications
- Common failure patterns and known issues
- Repair cost estimation and parts recommendations
- Safety-critical system identification

## Vehicle Context:`

    const vehicleContext = vehicleInfo ? `
- VIN: ${vehicleInfo.vin || 'Not provided'}
- Year: ${vehicleInfo.year || 'Not provided'}
- Make: ${vehicleInfo.make || 'Not provided'}
- Model: ${vehicleInfo.model || 'Not provided'}
- Engine: ${vehicleInfo.engine || 'Not provided'}
- Mileage: ${vehicleInfo.mileage || 'Not provided'}` : `
- No specific vehicle information provided`

    const modeInstructions = getModeInstructions(diagnosticMode)

    return `${basePrompt}${vehicleContext}

${modeInstructions}

## Response Format:
Structure your responses with clear sections:

1. **Diagnostic Analysis**: Brief summary of the likely issue(s)
2. **Potential Causes**: List probable causes in order of likelihood
3. **Recommended Actions**: Step-by-step diagnostic or repair procedures
4. **Parts & Cost Estimates**: If applicable, include part numbers and cost ranges
5. **Safety Considerations**: Any immediate safety concerns or warnings
6. **Additional Resources**: Reference relevant TSBs, recalls, or service bulletins

## Important Guidelines:
- Always prioritize safety in your recommendations
- Provide specific, actionable advice tailored to the vehicle when possible
- Include relevant diagnostic trouble codes (DTCs) when applicable
- Suggest professional inspection for complex or safety-critical issues
- Provide cost estimates in USD ranges when possible
- Reference authoritative sources like service manuals, TSBs, and OEM bulletins

Be thorough, professional, and focused on helping resolve automotive issues efficiently and safely.`
}

function getModeInstructions(mode: string): string {
    switch (mode) {
        case 'advanced':
            return `## Diagnostic Mode: Advanced Analysis
- Include detailed technical explanations
- Reference specific service procedures and specifications
- Provide comprehensive troubleshooting steps
- Include relevant TSBs and known issues
- Suggest specialized tools when needed`
            
        case 'professional':
            return `## Diagnostic Mode: Professional
- Provide expert-level technical detail
- Include precise specifications and tolerances
- Reference service manual procedures verbatim when relevant
- Provide detailed part numbers and supplier information
- Include labor time estimates and shop procedures
- Consider warranty implications and recall information`
            
        default:
            return `## Diagnostic Mode: Basic Diagnostics
- Focus on common issues and solutions
- Provide clear, easy-to-understand explanations
- Suggest basic diagnostic steps first
- Recommend professional help for complex issues`
    }
}

function getDiagnosticModel(mode: string): string {
    // Try different Perplexity models - chat version first, then online
    return 'llama-3.1-sonar-small-128k-chat'
}
