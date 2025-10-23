import { Resend } from 'resend'

// Initialize Resend client
let resendClient: Resend | null = null

export function getResendClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not configured')
        return null
    }

    if (!resendClient) {
        resendClient = new Resend(process.env.RESEND_API_KEY)
    }

    return resendClient
}

export function isResendConfigured(): boolean {
    return !!process.env.RESEND_API_KEY
}

