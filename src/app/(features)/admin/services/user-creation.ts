import { supabaseAdmin } from '@/lib/supabase-admin'
import { CreateUserRequest, CreateUserResponse } from '../types/user-creation'

export class UserCreationService {
    static async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
        if (!supabaseAdmin) {
            throw new Error('Database connection not configured')
        }

        try {
            let userId: string | undefined
            let shopId: string | undefined

            // Create user using signup flow to ensure email verification
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: request.user.email,
                password: request.user.password,
                user_metadata: {
                    full_name: request.user.fullName,
                    phone: request.user.phone
                },
                email_confirm: true // This will send the email verification
            })

            if (authError) {
                // Handle specific error cases
                if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
                    throw new Error('User with this email already exists')
                }
                throw new Error(`Failed to create user: ${authError.message}`)
            }

            userId = authData.user?.id

            if (!userId) {
                throw new Error('User ID not returned after creation')
            }

            // Wait for the database trigger to create the public.users record
            // Retry mechanism in case the trigger is slow
            let retryCount = 0
            const maxRetries = 5
            let userRecordExists = false

            while (retryCount < maxRetries && !userRecordExists) {
                await new Promise(resolve => setTimeout(resolve, 500))
                
                const { data: existingUser } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('id', userId)
                    .single()

                if (existingUser) {
                    userRecordExists = true
                } else {
                    retryCount++
                }
            }

            if (!userRecordExists) {
                // If trigger didn't create the record, create it manually
                const { error: insertError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        id: userId,
                        role: request.user.role,
                        plan: request.user.plan,
                        status: request.user.status
                    })

                if (insertError) {
                    console.error('Failed to create user record manually:', insertError)
                    // Clean up auth user
                    await supabaseAdmin.auth.admin.deleteUser(userId)
                    throw new Error('Failed to create user record')
                }
            } else {
                // Update the existing record with the additional fields
                const { error: userError } = await supabaseAdmin
                    .from('users')
                    .update({
                        role: request.user.role,
                        plan: request.user.plan,
                        status: request.user.status
                    })
                    .eq('id', userId)

                if (userError) {
                    console.error('Failed to update user record:', userError)
                    // Don't throw here as the user was created successfully in auth
                }
            }

            // Create shop if requested
            if (request.createShop && request.shop) {
                const { data: shopData, error: shopError } = await supabaseAdmin
                    .from('shops')
                    .insert({
                        shop_name: request.shop.shopName,
                        shop_email: request.shop.shopEmail,
                        shop_phone: request.shop.shopPhone,
                        shop_address: request.shop.shopAddress,
                        shop_city: request.shop.shopCity,
                        shop_province: request.shop.shopProvince,
                        website: request.shop.website || null,
                        business_number: request.shop.businessNumber || null,
                        hst_number: request.shop.hstNumber || null,
                        services_offered: JSON.stringify(request.shop.servicesOffered),
                        operating_hours: JSON.stringify(request.shop.operatingHours),
                        tagline: request.shop.tagline || null,
                        about: request.shop.about || null
                    })
                    .select('id')
                    .single()

                if (shopError) {
                    throw new Error(`Failed to create shop: ${shopError.message}`)
                }

                shopId = shopData.id

                // Update user with shop_id
                const { error: updateError } = await supabaseAdmin
                    .from('users')
                    .update({ shop_id: shopId })
                    .eq('id', userId)

                if (updateError) {
                    console.error('Failed to associate user with shop:', updateError)
                    // Don't throw here as the user and shop were created successfully
                }
            }

            return {
                success: true,
                userId,
                shopId,
                message: request.createShop 
                    ? 'User and shop created successfully' 
                    : 'User created successfully'
            }

        } catch (error) {
            console.error('Error creating user:', error)
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create user'
            }
        }
    }

    static async validateUserData(user: CreateUserRequest['user']): Promise<string[]> {
        const errors: string[] = []

        if (!user.email || !user.email.includes('@')) {
            errors.push('Valid email is required')
        }

        if (!user.password || user.password.length < 6) {
            errors.push('Password must be at least 6 characters')
        }

        if (!user.fullName || user.fullName.trim().length < 2) {
            errors.push('Full name is required')
        }

        if (!user.phone || user.phone.trim().length < 10) {
            errors.push('Valid phone number is required')
        }

        return errors
    }

    static async validateShopData(shop: CreateUserRequest['shop']): Promise<string[]> {
        const errors: string[] = []

        if (!shop) return errors

        if (!shop.shopName || shop.shopName.trim().length < 2) {
            errors.push('Shop name is required')
        }

        if (!shop.shopAddress || shop.shopAddress.trim().length < 5) {
            errors.push('Shop address is required')
        }

        if (!shop.shopCity || shop.shopCity.trim().length < 2) {
            errors.push('Shop city is required')
        }

        if (!shop.shopProvince || shop.shopProvince.trim().length < 2) {
            errors.push('Shop province is required')
        }

        // Tagline and about are optional - no validation needed

        return errors
    }

    static async getUserInfo(userId: string): Promise<{ email: string; fullName: string } | null> {
        if (!supabaseAdmin) {
            throw new Error('Database connection not configured')
        }

        try {
            // Get user from auth.users
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
            
            if (authError) {
                console.error('Error fetching auth user:', authError)
                return null
            }

            if (!authUser.user) {
                return null
            }

            return {
                email: authUser.user.email || '',
                fullName: authUser.user.user_metadata?.full_name || ''
            }
        } catch (error) {
            console.error('Error fetching user info:', error)
            return null
        }
    }
}
