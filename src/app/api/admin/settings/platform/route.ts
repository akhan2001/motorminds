import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Only super admins can access platform settings
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        const userRole = userData.role?.toUpperCase()
        const isSuperAdmin = userRole === 'SUPER-ADMIN' || userRole === 'SUPER_ADMIN'
        
        if (!isSuperAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Super admin access required' },
                { status: 403 }
            )
        }

        // TODO: Fetch platform settings from a settings table or environment
        // For now, return default settings structure
        return NextResponse.json({
            settings: {
                general: {
                    site_name: process.env.NEXT_PUBLIC_SITE_NAME || 'MotorMinds',
                    site_description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Auto Parts Management Platform',
                    maintenance_mode: false,
                    registration_enabled: true,
                    email_verification_required: true
                },
                email: {
                    smtp_host: '',
                    smtp_port: 587,
                    smtp_username: '',
                    smtp_password: '',
                    from_email: '',
                    from_name: 'MotorMinds'
                },
                notifications: {
                    email_notifications: true,
                    sms_notifications: true,
                    push_notifications: true,
                    admin_alerts: true
                },
                security: {
                    password_min_length: 8,
                    session_timeout: 24,
                    two_factor_required: false,
                    ip_whitelist: []
                },
                integrations: {
                    stripe_enabled: false,
                    twilio_enabled: false,
                    google_analytics_id: '',
                    facebook_pixel_id: ''
                }
            }
        })
    } catch (error) {
        console.error('Error fetching platform settings:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Only super admins can update platform settings
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        const userRole = userData.role?.toUpperCase()
        const isSuperAdmin = userRole === 'SUPER-ADMIN' || userRole === 'SUPER_ADMIN'
        
        if (!isSuperAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Super admin access required' },
                { status: 403 }
            )
        }

        // TODO: Save platform settings to a settings table
        // For now, just return success
        // In production, you would save to a platform_settings table or use environment variables

        return NextResponse.json({
            success: true,
            message: 'Platform settings updated successfully',
            settings: body
        })
    } catch (error) {
        console.error('Error updating platform settings:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

