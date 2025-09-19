import { NextRequest, NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'

// Initialize Vapi client
const vapi = new VapiClient({
    token: process.env.VAPI_API_KEY!
})

export async function POST(request: NextRequest) {
    try {
        const { phoneNumber } = await request.json()

        // Validate input
        if (!phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            )
        }

        // Validate environment variables
        if (!process.env.VAPI_API_KEY) {
            console.error('VAPI_API_KEY is not configured')
            return NextResponse.json(
                { error: 'Voice service not configured' },
                { status: 500 }
            )
        }

        if (!process.env.VAPI_PHONE_NUMBER_ID) {
            console.error('VAPI_PHONE_NUMBER_ID is not configured')
            return NextResponse.json(
                { error: 'Voice phone number not configured' },
                { status: 500 }
            )
        }

        if (!process.env.VAPI_ASSISTANT_ID) {
            console.error('VAPI_ASSISTANT_ID is not configured')
            return NextResponse.json(
                { error: 'Voice assistant not configured' },
                { status: 500 }
            )
        }

        // Clean and format phone number
        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '')
        const formattedPhoneNumber = cleanPhoneNumber.startsWith('1') 
            ? `+${cleanPhoneNumber}` 
            : `+1${cleanPhoneNumber}`

        console.log('Starting call to:', formattedPhoneNumber)

        // Create the call using Vapi
        const call = await vapi.calls.create({
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
            customer: { 
                number: formattedPhoneNumber 
            },
            assistantId: process.env.VAPI_ASSISTANT_ID
        })

        console.log('Call created successfully:', call.id)

        return NextResponse.json({
            success: true,
            callId: call.id,
            status: call.status,
            message: 'Call initiated successfully'
        })

    } catch (error: any) {
        console.error('Error starting call:', error)
        
        // Handle specific Vapi errors
        if (error.name === 'VapiError') {
            return NextResponse.json(
                { 
                    error: 'Voice service error',
                    details: error.message 
                },
                { status: 400 }
            )
        }

        // Handle network errors
        if (error.code === 'NETWORK_ERROR') {
            return NextResponse.json(
                { error: 'Unable to connect to voice service' },
                { status: 503 }
            )
        }

        // Generic error
        return NextResponse.json(
            { 
                error: 'Failed to start call',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        )
    }
}
