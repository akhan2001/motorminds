'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { shopService, type ShopData } from '../lib/shopService'

// Validate Turnstile CAPTCHA
async function validateTurnstile(token: string): Promise<boolean> {
    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${token}`
        })

        const result = await response.json()
        return result.success
    } catch (error) {
        console.error('Turnstile validation error:', error)
        return false
    }
}

// Get client IP for rate limiting
function getClientIP(): string {
    // This is a simplified version - in production you'd get the real IP
    return '127.0.0.1'
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    try {
        // Extract form data
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const fullName = formData.get('fullName') as string
        const phone = formData.get('phone') as string

        const shopName = formData.get('shopName') as string
        const shopEmail = formData.get('shopEmail') as string
        const shopPhone = formData.get('shopPhone') as string
        const shopAddress = formData.get('shopAddress') as string
        const shopCity = formData.get('shopCity') as string
        const shopProvince = formData.get('shopProvince') as string
        const website = formData.get('website') as string
        const businessNumber = formData.get('businessNumber') as string
        const hstNumber = formData.get('hstNumber') as string
        const servicesOffered = JSON.parse(formData.get('servicesOffered') as string || '[]')
        const operatingHours = JSON.parse(formData.get('operatingHours') as string || '{}')

        const turnstileToken = formData.get('turnstile-token') as string
        const startTime = parseInt(formData.get('startTime') as string)

        // Validation
        if (!email || !password || !fullName || !shopName || !shopAddress || !shopCity) {
            throw new Error('Please fill in all required fields')
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters')
        }

        // Check minimum time (anti-bot measure)
        if (Date.now() - startTime < 10000) {
            throw new Error('Please take your time to fill out the form')
        }

        // Validate Turnstile CAPTCHA
        if (!turnstileToken) {
            throw new Error('Please complete the security verification')
        }

        // Skip validation for demo token
        if (turnstileToken !== 'demo-token') {
            const isValidTurnstile = await validateTurnstile(turnstileToken)
            if (!isValidTurnstile) {
                throw new Error('Security verification failed. Please try again.')
            }
        }

        // Check for honeypot (spam protection)
        if (formData.get('website') && formData.get('website') !== '') {
            throw new Error('Spam detected')
        }

        // Create shop record FIRST (while still anonymous)
        const shopData: ShopData = {
            shop_name: shopName,
            shop_email: shopEmail || email,
            shop_phone: shopPhone || phone,
            shop_address: shopAddress,
            shop_city: shopCity,
            shop_province: shopProvince,
            website: website || null,
            business_number: businessNumber || null,
            hst_number: hstNumber || null,
            services_offered: servicesOffered,
            operating_hours: operatingHours,
            shop_owner: fullName
        }

        const shop = await shopService.createShop(shopData)

        // Create user account with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
                data: {
                    full_name: fullName,
                    role: 'user'
                }
            }
        })

        if (authError) {
            throw new Error(authError.message)
        }

        if (!authData.user) {
            throw new Error('Failed to create user account')
        }

        // Update user with shop_id
        const { error: userError } = await supabase
            .from('users')
            .update({
                shop_id: shop.id,
                role: 'user',
                plan: 'DEFAULT',
                status: 'active'
            })
            .eq('id', authData.user.id)

        if (userError) {
            console.error('User update error:', userError)
            throw new Error('Failed to link user to shop')
        }

        // Log signup attempt for monitoring (optional - don't fail if this fails)
        try {
            await supabase
                .from('signup_attempts')
                .insert({
                    ip_address: getClientIP(),
                    email: email,
                    success: true,
                    shop_id: shop.id
                })
        } catch (logError) {
            console.error('Failed to log signup attempt:', logError)
        }

        revalidatePath('/', 'layout')
        redirect('/login?message=Account created successfully! Please check your email to verify your account.')

    } catch (error: any) {
        console.error('Signup error:', error)

        // Log failed signup attempt (optional - don't fail if this fails)
        try {
            await supabase
                .from('signup_attempts')
                .insert({
                    ip_address: getClientIP(),
                    email: formData.get('email') as string,
                    success: false,
                    error_message: error.message
                })
        } catch (logError) {
            console.error('Failed to log failed signup attempt:', logError)
        }

        redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }
}
