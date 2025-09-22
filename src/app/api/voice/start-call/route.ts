import { NextRequest, NextResponse } from 'next/server'
import { vapi, MIA_ASSISTANT_ID } from '@/lib/integrations/vapi/vapi-client'
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

        // Keep it simple: pass a concise script for the assistant to say
        // If a custom message is provided, use it; otherwise compose a short one
        const spokenMessage =
            typeof message === 'string' && message.trim().length > 0
                ? message.trim()
                : [
                    `Hello${supplier_name ? ` ${supplier_name}` : ''}, this is MotorMinds calling`,
                    supplier_contact_person ? `for ${supplier_contact_person}` : undefined,
                    parts_info?.partName || parts_info?.part_name
                        ? `about ${parts_info?.quantity ?? 1} ${parts_info?.partName || parts_info?.part_name}`
                        : undefined,
                    vehicle_info?.year || vehicle_info?.make || vehicle_info?.model
                        ? `for a ${[vehicle_info?.year, vehicle_info?.make, vehicle_info?.model].filter(Boolean).join(' ')}`
                        : undefined,
                    'Could you please provide price and availability?'
                ]
                .filter(Boolean)
                .join('. ') + '.'

        // Build metadata in the shape your assistant prompt expects
        const metadata = {
            source: 'motorminds',
            timestamp: new Date().toISOString(),
            call_context: {
                shop_info: {
                    name: 'MotorMinds Auto Shop',
                    account_numbers: {}
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


		// Create a simple inline assistant that just reads the message and ends the call
		const call = await vapi.calls.create({
			phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
			customer: { number: phone },
			assistant: {
				firstMessage: spokenMessage
			},
			metadata
		} as any)

        return NextResponse.json({
            success: true,
            callId: (call as any).id || (call as any).call?.id || (call as any).callId,
            phone_number: phone,
            message_spoken: spokenMessage
        })
    } catch (error: any) {
        console.error('❌ simple start-call error:', error)
        const message = error?.message || 'Failed to start call'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}


