'use client'

import { createClient } from '@/utils/supabase/client'
import { formatPhoneNumberE164, isValidE164 } from '@/lib/utils/phone-utils'
import { toast } from 'sonner'
import { VoiceCallPurpose, VoiceCallStatus } from '../types/voice-call'

export interface VoiceCallRequest {
    partsRequestId: string
    supplierId: string
    phoneNumber: string
    purpose: VoiceCallPurpose
    vehicleInfo?: any
    partsInfo?: any
    priority?: string
    notes?: string
    shopId: string
}

export interface MultiSupplierCallRequest {
    partsRequestId: string
    suppliers: Array<{
        id: string
        name: string
        phone_number: string
        contact_person?: string
    }>
    purpose: VoiceCallPurpose
    vehicleInfo?: any
    partsInfo?: any
    priority?: string
    notes?: string
    shopId: string
}

export interface CallStatusUpdate {
    callId: string
    status: VoiceCallStatus
    analysis?: any
    error?: string
}

export class VoiceCallService {
    private static supabase = createClient()

    /**
     * Start a new voice call with proper sequencing and status management
     */
    static async startCall(request: VoiceCallRequest): Promise<{ callId: string; success: boolean }> {
        try {
            // Validate phone number
            const formattedPhone = formatPhoneNumberE164(request.phoneNumber)
            if (!isValidE164(formattedPhone)) {
                throw new Error('Invalid phone number format. Must be a valid E.164 number')
            }

            // Get current sequence number for this parts request
            const sequenceNumber = await this.getNextSequenceNumber(request.partsRequestId)

            // Update parts request status based on call purpose
            await this.updatePartsRequestStatus(request.partsRequestId, request.purpose)

            // Transform parts array into format expected by dynamic assistant
            const transformedPartsInfo = this.transformPartsForAI(request.partsInfo)
            
            console.log('Original parts info:', request.partsInfo)
            console.log('Transformed parts info:', transformedPartsInfo)

            // Start the AI call
            const response = await fetch('/api/voice-calling/start-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicle_info: request.vehicleInfo,
                    parts_info: transformedPartsInfo,
                    suppliers: [{ 
                        id: request.supplierId,
                        phone_number: request.phoneNumber 
                    }],
                    priority: request.priority,
                    notes: request.notes,
                    parts_request_id: request.partsRequestId,
                    call_purpose: request.purpose,
                    sequence_number: sequenceNumber
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to start call')
            }

            const result = await response.json()
            
            // Show appropriate success message based on purpose
            const purposeMessages: Record<VoiceCallPurpose, string> = {
                'quote_request': 'Mia AI is calling for quote information...',
                'order_followup': 'Mia AI is calling for order follow-up...',
                'parts_ordering': 'Mia AI is placing your parts order...',
                'general_inquiry': 'Mia AI is making a general inquiry call...',
                'other': 'Mia AI is making the call...'
            }
            
            toast.success(purposeMessages[request.purpose] || 'Mia AI is making the call...')
            
            return { callId: result.callId, success: true }

        } catch (error: any) {
            console.error('Error starting voice call:', error)
            toast.error(`Failed to start call: ${error.message}`)
            return { callId: '', success: false }
        }
    }

    /**
     * Start multiple voice calls for multiple suppliers
     */
    static async startMultiSupplierCalls(request: MultiSupplierCallRequest): Promise<{ 
        results: Array<{ supplierId: string; success: boolean; callId?: string; error?: string }> 
        partsRequestId: string
    }> {
        try {
            // Transform parts info once
            const transformedPartsInfo = this.transformPartsForAI(request.partsInfo)

            // Get sequence number
            const startingSequence = await this.getNextSequenceNumber(request.partsRequestId)

            // Update parts request status
            await this.updatePartsRequestStatus(request.partsRequestId, request.purpose)

            // Update supplier_info with multi-supplier data
            await this.supabase
                .from('parts_requests')
                .update({
                    supplier_info: {
                        selected_suppliers: request.suppliers,
                        total_suppliers: request.suppliers.length,
                        completed_suppliers: 0,
                        failed_suppliers: 0
                    }
                })
                .eq('id', request.partsRequestId)

            // Call each supplier
            const callPromises = request.suppliers.map(async (supplier, index) => {
                try {
                    // Validate phone number
                    const formattedPhone = formatPhoneNumberE164(supplier.phone_number)
                    if (!isValidE164(formattedPhone)) {
                        return {
                            supplierId: supplier.id,
                            success: false,
                            error: 'Invalid phone number'
                        }
                    }

                    // Start the AI call
                    const response = await fetch('/api/voice-calling/start-call', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vehicle_info: request.vehicleInfo,
                            parts_info: transformedPartsInfo,
                            supplier: {
                                id: supplier.id,
                                name: supplier.name,
                                phone_number: formattedPhone,
                                contact_person: supplier.contact_person
                            },
                            priority: request.priority,
                            notes: request.notes,
                            parts_request_id: request.partsRequestId,
                            call_purpose: request.purpose,
                            sequence_number: startingSequence + index
                        })
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        return {
                            supplierId: supplier.id,
                            success: false,
                            error: errorData.error || 'Failed to start call'
                        }
                    }

                    const result = await response.json()
                    return {
                        supplierId: supplier.id,
                        success: true,
                        callId: result.callId
                    }
                } catch (error: any) {
                    return {
                        supplierId: supplier.id,
                        success: false,
                        error: error.message
                    }
                }
            })

            const results = await Promise.all(callPromises)
            
            // Show summary toast
            const successCount = results.filter(r => r.success).length
            const totalCount = results.length
            
            if (successCount === totalCount) {
                toast.success(`Mia AI is calling all ${totalCount} suppliers...`)
            } else if (successCount > 0) {
                toast.warning(`Mia AI is calling ${successCount} of ${totalCount} suppliers. ${totalCount - successCount} failed.`)
            } else {
                toast.error('Failed to initiate any calls')
            }

            return {
                results,
                partsRequestId: request.partsRequestId
            }

        } catch (error: any) {
            console.error('Error starting multi-supplier calls:', error)
            toast.error(`Failed to start calls: ${error.message}`)
            return {
                results: request.suppliers.map(s => ({
                    supplierId: s.id,
                    success: false,
                    error: error.message
                })),
                partsRequestId: request.partsRequestId
            }
        }
    }

    /**
     * Transform parts array into format expected by dynamic assistant
     */
    private static transformPartsForAI(partsArray: any): any {
        if (!partsArray || !Array.isArray(partsArray) || partsArray.length === 0) {
            return {
                partName: 'Unknown Part',
                partNumber: '',
                quantity: 1,
                description: 'No parts specified'
            }
        }

        // If single part, use it directly
        if (partsArray.length === 1) {
            const part = partsArray[0]
            return {
                partName: part.part_name || 'Unknown Part',
                partNumber: part.part_number || '',
                quantity: part.quantity || 1,
                description: part.description || ''
            }
        }

        // If multiple parts, create a combined description
        const totalQuantity = partsArray.reduce((sum, part) => sum + (part.quantity || 0), 0)
        const partNames = partsArray.map(part => `${part.quantity || 1} ${part.part_name || 'Unknown Part'}`).join(', ')
        const partNumbers = partsArray.map(part => part.part_number).filter(Boolean).join(', ')
        
        return {
            partName: partNames,
            partNumber: partNumbers,
            quantity: totalQuantity,
            description: `Multiple parts: ${partNames}`
        }
    }

    /**
     * Refresh all supplier calls for a parts request
     */
    static async refreshPartsRequest(partsRequestId: string): Promise<{
        success: boolean
        results?: any[]
        aggregated_status?: any
        error?: string
    }> {
        try {
            const response = await fetch('/api/voice-calling/refresh-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parts_request_id: partsRequestId
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to refresh request')
            }

            const result = await response.json()
            
            if (result.success) {
                toast.success(`Refreshed ${result.results.length} supplier call(s)`)
            }
            
            return {
                success: true,
                results: result.results,
                aggregated_status: result.aggregated_status
            }

        } catch (error: any) {
            console.error('Error refreshing parts request:', error)
            toast.error(`Failed to refresh: ${error.message}`)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get the next sequence number for calls related to a parts request
     */
    private static async getNextSequenceNumber(partsRequestId: string): Promise<number> {
        const { data: existingCalls, error } = await this.supabase
            .from('voice_calls')
            .select('sequence_number')
            .eq('parts_request_id', partsRequestId)
            .order('sequence_number', { ascending: false })
            .limit(1)

        if (error) {
            console.error('Error getting sequence number:', error)
            return 1
        }

        return existingCalls.length > 0 ? (existingCalls[0].sequence_number || 0) + 1 : 1
    }

    /**
     * Update parts request status based on call purpose
     */
    private static async updatePartsRequestStatus(partsRequestId: string, purpose: VoiceCallPurpose): Promise<void> {
        const statusMap: Record<VoiceCallPurpose, string> = {
            'quote_request': 'processing', // Use correct database status
            'order_followup': 'quoted', // Keep current status  
            'parts_ordering': 'ordered', // Use correct database status
            'general_inquiry': 'pending', // Keep current status
            'other': 'pending' // Keep current status for other purposes
        }

        const newStatus = statusMap[purpose]
        if (!newStatus) {
            console.log(`No status mapping for purpose: ${purpose}`)
            return
        }

        console.log(`Updating parts request ${partsRequestId} from purpose ${purpose} to status ${newStatus}`)

        const { data, error } = await this.supabase
            .from('parts_requests')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', partsRequestId)
            .select()

        if (error) {
            console.error('Error updating parts request status:', {
                partsRequestId,
                purpose,
                newStatus,
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            throw new Error(`Failed to update parts request status: ${error.message}`)
        } else {
            console.log('Successfully updated parts request status:', data)
        }
    }

    /**
     * Get all calls for a parts request with proper ordering
     */
    static async getCallsForPartsRequest(partsRequestId: string): Promise<any[]> {
        const { data: calls, error } = await this.supabase
            .from('voice_calls')
            .select(`
                *,
                supplier:suppliers(id, name, contact_person, phone_number)
            `)
            .eq('parts_request_id', partsRequestId)
            .order('sequence_number', { ascending: true })

        if (error) {
            console.error('Error fetching calls for parts request:', error)
            return []
        }

        return calls || []
    }

    /**
     * Update call status and sync with parts request
     */
    static async updateCallStatus(update: CallStatusUpdate): Promise<void> {
        try {
            // Update voice call
            const { data: voiceCall, error: callError } = await this.supabase
                .from('voice_calls')
                .update({
                    status: update.status,
                    quote_received: update.analysis,
                    error_details: update.error,
                    updated_at: new Date().toISOString()
                })
                .eq('id', update.callId)
                .select('parts_request_id, purpose')
                .single()

            if (callError) {
                console.error('Error updating voice call:', callError)
                return
            }

            // Sync parts request status based on call outcome
            if (voiceCall?.parts_request_id) {
                await this.syncPartsRequestStatus(voiceCall.parts_request_id, update.status, voiceCall.purpose, update.analysis)
            }

        } catch (error) {
            console.error('Error in updateCallStatus:', error)
        }
    }

    /**
     * Sync parts request status based on voice call outcomes
     */
    private static async syncPartsRequestStatus(
        partsRequestId: string, 
        callStatus: VoiceCallStatus, 
        callPurpose: VoiceCallPurpose,
        analysis?: any
    ): Promise<void> {
        let newPartsStatus: string | null = null

        // Determine new parts request status based on call outcome
        if (callStatus === 'completed' && analysis) {
            if (callPurpose === 'quote_request') {
                newPartsStatus = analysis.successEvaluation ? 'ready_to_order' : 'quote_received'
            } else if (callPurpose === 'parts_ordering') {
                newPartsStatus = analysis.successEvaluation ? 'completed' : 'order_placed'
            }
        } else if (callStatus === 'failed') {
            if (callPurpose === 'quote_request') {
                newPartsStatus = 'pending' // Reset to allow retry
            } else if (callPurpose === 'parts_ordering') {
                newPartsStatus = 'ready_to_order' // Reset to allow retry
            }
        }

        if (newPartsStatus) {
            const updateData: any = { 
                status: newPartsStatus,
                updated_at: new Date().toISOString()
            }

            // Save quote data if available
            if (analysis && callPurpose === 'quote_request') {
                updateData.quote_provided = analysis.structuredData || analysis
            }

            const { error } = await this.supabase
                .from('parts_requests')
                .update(updateData)
                .eq('id', partsRequestId)

            if (error) {
                console.error('Error syncing parts request status:', error)
            }
        }
    }

    /**
     * Get the current status and next available actions for a parts request
     */
    static async getPartsRequestActions(partsRequestId: string): Promise<{
        status: string
        availableActions: Array<{
            action: string
            label: string
            purpose: VoiceCallPurpose
            description: string
        }>
    }> {
        const { data: partsRequest, error } = await this.supabase
            .from('parts_requests')
            .select('status, quote_provided')
            .eq('id', partsRequestId)
            .single()

        if (error || !partsRequest) {
            return { status: 'unknown', availableActions: [] }
        }

        const actionMap: Record<string, Array<any>> = {
            'pending': [
                {
                    action: 'start_quote_call',
                    label: 'Get Quote',
                    purpose: 'quote_request' as VoiceCallPurpose,
                    description: 'Call supplier to get pricing and availability'
                }
            ],
            'quote_requested': [
                {
                    action: 'retry_quote_call',
                    label: 'Retry Quote Call',
                    purpose: 'quote_request' as VoiceCallPurpose,
                    description: 'Retry the quote request call'
                }
            ],
            'quote_received': [
                {
                    action: 'followup_call',
                    label: 'Follow Up',
                    purpose: 'order_followup' as VoiceCallPurpose,
                    description: 'Call to clarify details or get more information'
                },
                {
                    action: 'place_order',
                    label: 'Place Order',
                    purpose: 'parts_ordering' as VoiceCallPurpose,
                    description: 'Place the parts order with supplier'
                }
            ],
            'ready_to_order': [
                {
                    action: 'place_order',
                    label: 'Place Order',
                    purpose: 'parts_ordering' as VoiceCallPurpose,
                    description: 'Place the parts order with supplier'
                }
            ],
            'order_placed': [
                {
                    action: 'followup_call',
                    label: 'Check Status',
                    purpose: 'order_followup' as VoiceCallPurpose,
                    description: 'Call to check order status or delivery time'
                }
            ]
        }

        return {
            status: partsRequest.status,
            availableActions: actionMap[partsRequest.status] || []
        }
    }
}
