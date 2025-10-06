import { formatPhoneNumberE164, isValidPhoneNumber } from '@/utils/format-phone'
import { createClient } from '@/utils/supabase/server'

/**
 * Simplified Mia AI Calling Service
 * Uses your pre-configured Vapi assistant directly
 */

export interface MiaCallRequest {
    supplier_phone_number: string
    supplier_name: string
    supplier_contact_person?: string
    parts_request_id?: string
    vehicle_info?: any
    parts_info?: any
    shop_id?: string // Add shop ID to fetch shop data
}

export interface MiaCallResponse {
    success: boolean
    call_id: string
    message: string
    supplier: string
    phone_number: string
}

export class MiaCallingService {
    /**
     * Initiate Mia AI call using your pre-configured assistant
     */
    static async startMiaCall(request: MiaCallRequest): Promise<MiaCallResponse> {
        try {
            console.log('🤖 Starting Mia AI call with pre-configured assistant:', request)

            // Validate and format phone number
            if (!isValidPhoneNumber(request.supplier_phone_number)) {
                throw new Error(`Invalid phone number: ${request.supplier_phone_number}`)
            }

            const formattedPhone = formatPhoneNumberE164(request.supplier_phone_number)
            console.log('📱 Formatted phone:', formattedPhone)

            // Get shop information (fetch from API or pass from context)
            let shopInfo = {
                name: 'MotorMinds Auto Shop',
                account_numbers: {}
            };

            // If shop_id is provided, you could fetch real shop data
            if (request.shop_id) {
                try {
                    const shopResponse = await fetch(`/api/shops/${request.shop_id}`);
                    if (shopResponse.ok) {
                        const shopData = await shopResponse.json();
                        shopInfo = {
                            name: shopData.name || 'MotorMinds Auto Shop',
                            account_numbers: shopData.account_numbers || {}
                        };
                    }
                } catch (error) {
                    console.warn('Could not fetch shop data, using defaults:', error);
                }
            }

            // Create comprehensive call context
            const callContext = {
                shop_info: shopInfo,
                supplier_info: {
                    name: request.supplier_name,
                    contact_person: request.supplier_contact_person,
                    phone_number: formattedPhone
                },
                vehicle_info: request.vehicle_info || {},
                parts_info: request.parts_info || {},
                parts_request_id: request.parts_request_id
            };

            // Call server API to start the call (keeps keys server-side)
            const response = await fetch('/api/voice/start-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier_phone_number: formattedPhone,
                    supplier_name: request.supplier_name,
                    supplier_contact_person: request.supplier_contact_person,
                    parts_request_id: request.parts_request_id,
                    vehicle_info: request.vehicle_info,
                    parts_info: request.parts_info
                })
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(err.error || `HTTP ${response.status}`)
            }

            const call = await response.json()

            console.log('✅ Mia AI call created:', call.id)
            
            return {
                success: true,
                call_id: call.callId,
                message: 'Mia AI call initiated successfully',
                supplier: request.supplier_name,
                phone_number: formattedPhone
            }
        } catch (error: any) {
            console.error('❌ Error starting Mia AI call:', error)
            throw new Error(error.message || 'Failed to start Mia AI call')
        }
    }

    /**
     * Get parts request with quote information
     */
    static async getPartsRequestWithQuote(partsRequestId: string): Promise<any> {
        try {
            const response = await fetch(`/api/parts-requests/${partsRequestId}`)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            console.error('❌ Error fetching parts request:', error)
            throw new Error(error.message || 'Failed to fetch parts request')
        }
    }

    /**
     * Wait for quote completion using a simple timeout approach
     * This gives the call time to complete naturally without aggressive polling
     */
    static async waitForCallCompletion(
        callDurationEstimate: number = 300000 // 5 minutes default
    ): Promise<void> {
        return new Promise((resolve) => {
            console.log(`⏳ Waiting ${callDurationEstimate/1000} seconds for call to complete naturally...`)
            setTimeout(() => {
                console.log('✅ Call completion wait period finished')
                resolve()
            }, callDurationEstimate)
        })
    }

    /**
     * Check if quote is available (single check, no polling)
     */
    static async checkForQuote(partsRequestId: string): Promise<any> {
        try {
            const partsRequest = await this.getPartsRequestWithQuote(partsRequestId)
            
            if (partsRequest.quote_provided && partsRequest.status === 'quoted') {
                console.log('✅ Quote found!')
                return partsRequest
            } else {
                console.log('📋 No quote available yet')
                return null
            }
        } catch (error: any) {
            console.error('❌ Error checking for quote:', error)
            throw error
        }
    }

    /**
     * Create voice call log entry
     */
    static async createVoiceCallLog(callData: {
        shop_id: string;
        phone_number: string;
        vapi_call_id: string;
        parts_request_id?: string;
        supplier_id?: string;
        user_id?: string;
        purpose?: string;
        sequence_number?: number;
    }) {
        const supabase = await createClient();
        
        const { data, error } = await supabase
            .from('voice_calls')
            .insert([{
                shop_id: callData.shop_id,
                phone_number: callData.phone_number,
                vapi_call_id: callData.vapi_call_id,
                parts_request_id: callData.parts_request_id,
                supplier_id: callData.supplier_id,
                user_id: callData.user_id,
                status: 'pending',
                purpose: callData.purpose || 'quote_request',
                sequence_number: callData.sequence_number || 1
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating voice call log:', error);
            throw error;
        }

        return data;
    }
}