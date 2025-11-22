export interface PlatformSettings {
    general: {
        site_name: string
        site_description: string
        maintenance_mode: boolean
        registration_enabled: boolean
        email_verification_required: boolean
    }
    email: {
        smtp_host: string
        smtp_port: number
        smtp_username: string
        smtp_password: string
        from_email: string
        from_name: string
    }
    notifications: {
        email_notifications: boolean
        sms_notifications: boolean
        push_notifications: boolean
        admin_alerts: boolean
    }
    security: {
        password_min_length: number
        session_timeout: number
        two_factor_required: boolean
        ip_whitelist: string[]
    }
    integrations: {
        stripe_enabled: boolean
        twilio_enabled: boolean
        google_analytics_id: string
        facebook_pixel_id: string
    }
}

export interface OrganizationSettings {
    name: string
    organization_type: 'mso' | 'franchise' | 'corporate'
    billing_email?: string
    subscription_plan?: string
    status: 'active' | 'suspended' | 'inactive'
}

export interface ShopSettings {
    shop_name: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    shop_owner?: string
    shop_about?: string
    shop_tagline?: string
    default_hourly_rate?: number
    website?: string
    business_number?: string
    hst_number?: string
    operating_hours?: any
    services_offered?: any
    widget_config?: any
    status_tracker_presets?: any
}

export type SettingsType = 'platform' | 'organization' | 'shop'

