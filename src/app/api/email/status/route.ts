import { NextResponse } from 'next/server'
import { isResendConfigured } from '@/app/(features)/financials/lib/email/resend-client'

// GET /api/email/status - Check if email service is configured
export async function GET() {
    try {
        const isConfigured = isResendConfigured()

        return NextResponse.json({
            isConfigured,
            service: 'Resend'
        })
    } catch (error) {
        console.error('Error checking email status:', error)
        return NextResponse.json(
            { 
                isConfigured: false,
                error: 'Failed to check email status' 
            }, 
            { status: 500 }
        )
    }
}

