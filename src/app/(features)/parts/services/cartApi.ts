import { Part } from '../hooks/usePartsData'

interface SubmitCartRequest {
    parts: Part[]
    vehicleInfo: any
    customerNotes?: string
    priority: string
}

interface SubmitCartResponse {
    success: boolean
    requestId: string
    data: {
        totalParts: number
        totalEstimatedPrice: number
    }
    error?: string
}

class CartApiService {
    async submitCart(request: SubmitCartRequest): Promise<SubmitCartResponse> {
        const response = await fetch('/api/parts-requests/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        })
        
        const data = await response.json()
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to submit parts request')
        }
        
        return data
    }
}

export const cartApi = new CartApiService()
