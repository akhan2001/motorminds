import { vapi } from "@/lib/integrations/vapi/vapi-client"
import { MiaCallingService } from "@/app/(features)/voice-calling/lib/mia-calling-service"
import { getShopIdForUser } from "@/utils/get-shop-id"
import { formatPhoneNumberE164, isValidPhoneNumber } from "@/utils/format-phone"
import { createDynamicAssistant, CallContext } from "@/app/api/voice-calling/dynamic-assistant"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            vehicle_info,
            parts_info,
            supplier,
            suppliers,
            priority,
            notes,
            parts_request_id,
            call_purpose = 'quote_request',
            sequence_number = 1,
            user_id
        } = body

        // Handle both single supplier and suppliers array for backward compatibility
        let supplierData
        if (supplier) {
            supplierData = supplier
        } else if (suppliers && Array.isArray(suppliers) && suppliers.length > 0) {
            supplierData = suppliers[0]
        } else {
            return NextResponse.json(
                { error: 'No supplier provided' },
                { status: 400 }
            )
        }

        const rawPhoneNumber = supplierData.phone_number
        const supplier_name = supplierData.name
        const supplier_contact_person = supplierData.contact_person
        const supplier_id = supplierData.id

        if (!rawPhoneNumber) {
            return NextResponse.json(
                { error: 'Supplier phone number is required' },
                { status: 400 }
            )
        }

        // Format and validate phone number
        if (!isValidPhoneNumber(rawPhoneNumber)) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            )
        }

        const phone_number = formatPhoneNumberE164(rawPhoneNumber)

        // Get shop ID from authenticated user
        const userShopId = await getShopIdForUser()
        if (!userShopId) {
            return NextResponse.json(
                { error: 'Shop ID not found for user' },
                { status: 403 }
            )
        }

        // Create dynamic assistant configuration
        const callContext: CallContext = {
            vehicle_info,
            parts_info,
            priority,
            notes,
            shop_name: "AutoPro Mechanics" // Could be dynamic based on shop
        }
        
        const dynamicAssistant = createDynamicAssistant(callContext)

        // Check required environment variables
        if (!process.env.VAPI_PHONE_NUMBER_ID) {
            console.error('❌ VAPI_PHONE_NUMBER_ID environment variable is missing')
            return NextResponse.json(
                { error: 'VAPI phone number ID not configured' },
                { status: 500 }
            )
        }

        if (!process.env.VAPI_API_KEY) {
            console.error('❌ VAPI_API_KEY environment variable is missing')
            return NextResponse.json(
                { error: 'VAPI API key not configured' },
                { status: 500 }
            )
        }

        console.log('📞 Creating VAPI call with:', {
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
            customerNumber: phone_number,
            supplierName: supplier_name
        })

        // Vapi Call Sessions with metadata for multi-shop support
        const call = await vapi.calls.create({
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
            customer: { 
                number: phone_number 
            },
            assistant: {
                ...dynamicAssistant,
                serverMessages: ["end-of-call-report", "status-update", "hang", "tool-calls"],
                server: {
                    url: "https://app.motorminds.ca/api/voice-calling/webhook"
                },
                metadata: {
                    shop_id: userShopId,
                    parts_request_id: parts_request_id,
                    supplier_name: supplier_name,
                    supplier_id: supplier_id,
                    call_context: {
                        vehicle_info,
                        parts_info,
                        priority,
                        notes
                    }
                }
            }
        })

        // Log the call in our database
        // Only include supplier_id if it's a valid UUID format
        const isValidUUID = (str: string) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(str);
        };

        // Get call ID from response
        const callId = (call as any).id || ''
        
        // Create voice_calls record with supplier name
        const voiceCallLog = await MiaCallingService.createVoiceCallLog({
            shop_id: userShopId,
            phone_number,
            vapi_call_id: callId,
            parts_request_id,
            supplier_id: supplier_id && isValidUUID(supplier_id) ? supplier_id : null,
            supplier_name: supplier_name || 'Unknown Supplier',
            user_id: user_id && isValidUUID(user_id) ? user_id : null,
            purpose: call_purpose,
            sequence_number: sequence_number
        })

        return NextResponse.json({
            success: true,
            callId: callId,
            voiceCallId: voiceCallLog.id,
            parts_request_id: parts_request_id,
            message: 'Call initiated successfully'
        })

    } catch (error: any) {
        console.error('❌ Error starting call:', error)
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        })
        
        // Return more specific error information
        return NextResponse.json(
            { 
                error: 'Failed to start call',
                details: error.message,
                type: error.name || 'UnknownError'
            },
            { status: 500 }
        )
    }
}