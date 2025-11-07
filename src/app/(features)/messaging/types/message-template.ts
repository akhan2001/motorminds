export interface MessageTemplate {
    id: string
    shop_id: string
    name: string
    template: string
    description?: string
    trigger_type: string // e.g., 'service_completed', 'appointment_reminder', 'mass_promotion'
    is_active: boolean
    created_at: string
    updated_at: string
    deleted_at?: string | null
}

export interface MessageTemplateCreateData {
    shop_id: string
    name: string
    template: string
    description?: string
    trigger_type: string
    is_active?: boolean
}

export interface MessageTemplateUpdateData {
    name?: string
    template?: string
    description?: string
    trigger_type?: string
    is_active?: boolean
}

