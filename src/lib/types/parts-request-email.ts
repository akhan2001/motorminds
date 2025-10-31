export interface SendPartsRequestEmailVariables {
    partsRequestId: string
    shopId: string
    vehicleInfo?: {
        year?: string
        make?: string
        model?: string
        engine?: any
        customer_name?: string
    }
    partsRequested: Array<{
        part_name?: string
        part_number?: string
        name?: string
        articleNo?: string
        quantity?: number
        price?: number
        estimated_price?: number
        supplier?: string
        description?: string
    }>
    customerNotes?: string
    notes?: string
    totalEstimatedPrice?: number
    priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface SendPartsRequestEmailData {
    success: boolean
    resendId?: string
    error?: string
}

