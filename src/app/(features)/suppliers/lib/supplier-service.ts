import { CreateSupplierRequest, Supplier, UpdateSupplierRequest } from '@/app/(features)/suppliers/types/supplier'

export class SupplierService {
    private static baseUrl = '/api/suppliers'

    static async getSuppliers(): Promise<{ suppliers: Supplier[] }> {
        const response = await fetch(this.baseUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to fetch suppliers')
        }

        return response.json()
    }

    static async createSupplier(supplierData: CreateSupplierRequest): Promise<{ supplier: Supplier }> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(supplierData),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create supplier')
        }

        return response.json()
    }

    static async updateSupplier(id: string, supplierData: UpdateSupplierRequest): Promise<{ supplier: Supplier }> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(supplierData),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update supplier')
        }

        return response.json()
    }

    static async deleteSupplier(id: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete supplier')
        }
    }

    static generateVoiceOrderingUrl(supplier: Supplier): string {
        if (!supplier.phone_number) {
            throw new Error('No phone number available for this supplier')
        }

        const encodedPhone = encodeURIComponent(supplier.phone_number)
        const encodedName = encodeURIComponent(supplier.name)
        return `/voice-calling/ordering?phone=${encodedPhone}&supplier=${encodedName}`
    }
}
