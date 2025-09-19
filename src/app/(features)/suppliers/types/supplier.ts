export interface Supplier {
    id: string;
    shop_id: string;
    name: string;
    contact_person?: string;
    phone_number?: string;
    email?: string;
    address?: {
        street?: string;
        city?: string;
        province?: string;
        postal_code?: string;
        country?: string;
    };
    account_number?: string;
    notes?: string;
    status: 'active' | 'inactive' | 'suspended';
    metadata?: any;
    created_at: string;
    updated_at: string;
}

export interface CreateSupplierRequest {
    name: string;
    contact_person?: string;
    phone_number?: string;
    email?: string;
    address?: Supplier['address'];
    account_number?: string;
    notes?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
    status?: 'active' | 'inactive' | 'suspended';
}
