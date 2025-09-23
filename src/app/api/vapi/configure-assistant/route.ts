import { NextRequest, NextResponse } from 'next/server'
import { vapi } from '@/lib/integrations/vapi/vapi-client'
import structuredDataSchema from '../structured-data-schema.json'

export async function POST(request: NextRequest) {
    try {
        const { assistantId } = await request.json()
        
        if (!assistantId) {
            return NextResponse.json({ error: 'assistantId is required' }, { status: 400 })
        }

        // Configure the assistant with structured data extraction
        const assistantConfig = {
            // Enhanced transcriber for automotive parts keywords
            transcriber: {
                model: "nova-2",
                keywords: [
                    "part number", "price", "cost", "availability", "delivery", "eta",
                    "in stock", "backorder", "discontinued", "shipping", "warranty",
                    "brake", "engine", "transmission", "alternator", "battery",
                    "oil filter", "air filter", "spark plug", "belt", "hose"
                ]
            },
            
            // Enable analysis features
            analyser: {
                plan: "pro",
                summaryPlan: "basic", 
                structuredDataPlan: "pro"
            },
            
            // Structured data extraction schema
            ...structuredDataSchema,
            
            // Enhanced system prompt for parts extraction
            systemMessage: `You are Mia, an AI assistant specialized in automotive parts procurement calls. 

Your primary goals:
1. Extract structured parts information during conversations
2. Identify key details: part numbers, prices, availability, delivery times
3. Capture supplier information and contact details
4. Note any special conditions, warranties, or requirements

CRITICAL: When you gather parts information, immediately extract it using the structured data schema. Pay special attention to:
- Part numbers (both OEM and supplier-specific)
- Exact pricing (cost vs retail)
- Availability status (in stock, backorder, discontinued)
- Delivery timeframes (ETA, business days)
- Supplier details and contact information

Always confirm extracted information with the supplier before ending the call.`,

            // Function for saving structured data
            functions: [
                {
                    name: "saveStructuredPartsData",
                    description: "Save structured parts information extracted from the conversation",
                    url: process.env.NODE_ENV === 'production' 
                        ? "https://yourdomain.com/api/voice/save-structured-data"
                        : "http://localhost:3000/api/voice/save-structured-data",
                    verb: "POST"
                }
            ],

            // Webhook configuration
            webhookUrl: process.env.NODE_ENV === 'production'
                ? "https://yourdomain.com/api/vapi/webhook"
                : "http://localhost:3000/api/vapi/webhook"
        }

        // Update the assistant configuration
        const response = await vapi.assistants.update(assistantId, assistantConfig as any)
        
        return NextResponse.json({
            success: true,
            message: "Assistant configured with structured data extraction",
            assistantId,
            configuration: {
                structuredDataEnabled: true,
                requiredFields: structuredDataSchema.structuredDataSchema.required,
                totalFields: Object.keys(structuredDataSchema.structuredDataSchema.properties).length
            }
        })
        
    } catch (error: any) {
        console.error('❌ Error configuring assistant:', error)
        return NextResponse.json({ 
            error: 'Failed to configure assistant',
            details: error.message 
        }, { status: 500 })
    }
}

// GET endpoint to retrieve current assistant configuration
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const assistantId = searchParams.get('assistantId')
        
        if (!assistantId) {
            return NextResponse.json({ error: 'assistantId is required' }, { status: 400 })
        }

        const assistant = await vapi.assistants.get(assistantId)
        
        return NextResponse.json({
            success: true,
            assistant,
            hasStructuredData: !!(assistant as any).structuredDataSchema,
            currentSchema: (assistant as any).structuredDataSchema || null
        })
        
    } catch (error: any) {
        console.error('❌ Error getting assistant:', error)
        return NextResponse.json({ 
            error: 'Failed to get assistant configuration',
            details: error.message 
        }, { status: 500 })
    }
}
