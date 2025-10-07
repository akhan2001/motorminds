'use client'

import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import type { VoiceCallPurpose } from '../types/voice-call'
import type { SelectedSupplier, VehicleInfo, PartItem } from '../types'

export interface CreatePartsRequestData {
    vehicleInfo: VehicleInfo
    partsRequested: PartItem[]
    selectedSuppliers: SelectedSupplier[]
    priority: string
    notes: string
    shopId: string
    userId?: string
}

export class PartsRequestService {
    private static supabase = createClient()

    /**
     * Create a new parts request with multiple suppliers
     */
    static async createPartsRequest(data: CreatePartsRequestData) {
        try {
            const supplierInfo = {
                supplier_name: data.selectedSuppliers[0]?.name || 'Unknown Supplier',
                supplier_id: data.selectedSuppliers[0]?.id || undefined,
                contact_person: data.selectedSuppliers[0]?.contact_person || '',
                phone_number: data.selectedSuppliers[0]?.phone_number || '',
                email: data.selectedSuppliers[0]?.email || '',
                account_number: data.selectedSuppliers[0]?.account_number || '',
                // Multi-supplier metadata
                selected_suppliers: data.selectedSuppliers,
                total_suppliers: data.selectedSuppliers.length,
                completed_suppliers: 0,
                failed_suppliers: 0
            }

            const vehicleData = {
                year: data.vehicleInfo.year ? parseInt(String(data.vehicleInfo.year)) : undefined,
                make: data.vehicleInfo.make,
                model: data.vehicleInfo.model,
                vin: data.vehicleInfo.vin || '',
                engine: data.vehicleInfo.engine || '',
                mileage: data.vehicleInfo.mileage ? parseInt(String(data.vehicleInfo.mileage).replace(/,/g, '')) : undefined,
                trim: data.vehicleInfo.trim || '',
                color: data.vehicleInfo.color || '',
                transmission: data.vehicleInfo.transmission || '',
                drivetrain: data.vehicleInfo.drivetrain || '',
                fuel_type: data.vehicleInfo.fuel_type || '',
                body_style: data.vehicleInfo.body_style || ''
            }

            const { data: newPartsRequest, error } = await this.supabase
                .from('parts_requests')
                .insert({
                    shop_id: data.shopId,
                    user_id: data.userId,
                    vehicle_info: vehicleData,
                    parts_requested: data.partsRequested,
                    supplier_info: supplierInfo,
                    priority: data.priority,
                    notes: data.notes.trim() || undefined,
                    customer_notes: '',
                    status: 'pending'
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating parts request:', error)
                throw new Error(error.message)
            }

            return newPartsRequest
        } catch (error: any) {
            console.error('Error in createPartsRequest:', error)
            throw error
        }
    }

    /**
     * Get all voice calls for a parts request
     */
    static async getVoiceCallsForRequest(partsRequestId: string) {
        try {
            const { data, error } = await this.supabase
                .from('voice_calls')
                .select('*')
                .eq('parts_request_id', partsRequestId)
                .order('sequence_number')

            if (error) {
                console.error('Error fetching voice calls:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('Error in getVoiceCallsForRequest:', error)
            return []
        }
    }
}

