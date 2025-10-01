import { NextRequest, NextResponse } from 'next/server'
import { vapi } from '@/lib/integrations/vapi/vapi-client'
import { buildTransientMiaAssistant } from '@/lib/integrations/vapi/transient-assistant'
import { formatPhoneNumberE164, isValidE164 } from '@/utils/format-phone'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))

        const {
            supplier_phone_number,
            supplier_name,
            supplier_contact_person,
            vehicle_info,
            parts_info,
            // Optional: a direct message to be spoken by the assistant
            message
        } = body || {}

        if (!supplier_phone_number) {
            return NextResponse.json({ error: 'supplier_phone_number is required' }, { status: 400 })
        }

        const phone = formatPhoneNumberE164(String(supplier_phone_number))
        if (!isValidE164(phone)) {
            return NextResponse.json({ error: 'supplier_phone_number must be a valid E.164 number' }, { status: 400 })
        }

        if (!process.env.VAPI_PHONE_NUMBER_ID) {
            return NextResponse.json({ error: 'Server misconfiguration: VAPI_PHONE_NUMBER_ID is not set' }, { status: 500 })
        }

        // Keep it simple: optional concise opener for the assistant
        const spokenMessage =
            typeof message === 'string' && message.trim().length > 0
                ? message.trim()
                : "Hey! I'm looking for parts!"

        // Build metadata in the shape your assistant prompt expects
        const metadata = {
            source: 'motorminds',
            timestamp: new Date().toISOString(),
            call_context: {
                shop_info: {
                    name: 'MotorMinds Auto Shop',
                    business_type: 'Automotive Repair Shop',
                    contact_person: 'Mia',
                    account_numbers: {
                        // Common suppliers - can be expanded
                        general: 'MM-2024',
                        parts_plus: 'MOTO-001',
                        napa: 'MIND-789'
                    },
                    phone: '(555) 123-4567',
                    address: 'Professional automotive repair facility'
                },
                supplier_info: {
                    name: supplier_name || '',
                    contact_person: supplier_contact_person || '',
                    phone_number: phone
                },
                vehicle_info: vehicle_info || {},
                parts_info: parts_info || {},
                parts_request_id: body?.parts_request_id || undefined
            },
            // Optional helper for a minimal call script if your assistant uses it
            speak: spokenMessage,
            simple_call: true
        }


        // Use a transient assistant config (no external URLs)
        const assistant = buildTransientMiaAssistant(metadata.call_context, spokenMessage)

        const call = await vapi.calls.create({
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
            customer: { number: phone },
            assistant,
            metadata
        } as any)

        const returnedCallId = (call as any).id || (call as any).call?.id || (call as any).callId
        return NextResponse.json({
            success: true,
            callId: returnedCallId,
            call_id: returnedCallId,
            phone_number: phone,
            message_spoken: spokenMessage
        })
    } catch (error: any) {
        console.error('❌ simple start-call error:', error)
        const message = error?.message || 'Failed to start call'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}


