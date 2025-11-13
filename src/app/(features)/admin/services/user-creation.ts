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
                // Ensure servicesOffered is always an array
                const servicesOffered = Array.isArray(request.shop.servicesOffered) 
                    ? request.shop.servicesOffered 
                    : []

                // Ensure operatingHours is always an object
                const operatingHours = request.shop.operatingHours && typeof request.shop.operatingHours === 'object'
                    ? request.shop.operatingHours
                    : {
                        monday: { open: '09:00', close: '17:00', closed: false },
                        tuesday: { open: '09:00', close: '17:00', closed: false },
                        wednesday: { open: '09:00', close: '17:00', closed: false },
                        thursday: { open: '09:00', close: '17:00', closed: false },
                        friday: { open: '09:00', close: '17:00', closed: false },
                        saturday: { open: '09:00', close: '15:00', closed: false },
                        sunday: { open: '00:00', close: '00:00', closed: true }
                    }

                const shopDataToInsert: any = {
                    shop_name: request.shop.shopName,
                    shop_email: request.shop.shopEmail || null,
                    shop_phone: request.shop.shopPhone || null,
                    shop_address: request.shop.shopAddress,
                    shop_city: request.shop.shopCity,
                    shop_province: request.shop.shopProvince,
                    website: request.shop.website || null,
                    business_number: request.shop.businessNumber || null,
                    hst_number: request.shop.hstNumber || null,
                    services_offered: servicesOffered,
                    operating_hours: operatingHours,
                    default_hourly_rate: request.shop.defaultHourlyRate || 99.99
                }

                // Add optional fields only if they have values
                if (request.shop.shopOwner && request.shop.shopOwner.trim().length > 0) {
                    shopDataToInsert.shop_owner = request.shop.shopOwner.trim()
                }
                if (request.shop.shopAbout && request.shop.shopAbout.trim().length > 0) {
                    shopDataToInsert.shop_about = request.shop.shopAbout.trim()
                }
                if (request.shop.shopTagline && request.shop.shopTagline.trim().length > 0) {
                    shopDataToInsert.shop_tagline = request.shop.shopTagline.trim()
                }

                const { data: shopData, error: shopError } = await supabaseAdmin
                    .from('shops')
                    .insert(shopDataToInsert)
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

        // Shop name: min 2, max 50
        if (!shop.shopName || shop.shopName.trim().length < 2) {
            errors.push('Shop name must be at least 2 characters')
        } else if (shop.shopName.trim().length > 50) {
            errors.push('Shop name must not be longer than 50 characters')
        }

        // Shop email: required and must be valid email
        if (!shop.shopEmail || shop.shopEmail.trim().length === 0) {
            errors.push('Shop email is required')
        } else if (!shop.shopEmail.includes('@')) {
            errors.push('Please enter a valid email')
        }

        // Shop phone: required and min 10 digits
        if (!shop.shopPhone || shop.shopPhone.trim().length === 0) {
            errors.push('Shop phone is required')
        } else if (shop.shopPhone.trim().length < 10) {
            errors.push('Phone number must be at least 10 digits')
        }

        // Shop address: min 5
        if (!shop.shopAddress || shop.shopAddress.trim().length < 5) {
            errors.push('Address must be at least 5 characters')
        }

        // Shop city: min 2
        if (!shop.shopCity || shop.shopCity.trim().length < 2) {
            errors.push('City must be at least 2 characters')
        }

        // Shop province: min 2
        if (!shop.shopProvince || shop.shopProvince.trim().length < 2) {
            errors.push('Province/State must be at least 2 characters')
        }

        // Shop owner: optional, but if provided, min 2
        if (shop.shopOwner && shop.shopOwner.trim().length > 0 && shop.shopOwner.trim().length < 2) {
            errors.push('Owner name must be at least 2 characters')
        }

        // Shop about: optional, but if provided, min 10, max 500
        if (shop.shopAbout && shop.shopAbout.trim().length > 0) {
            if (shop.shopAbout.trim().length < 10) {
                errors.push('About section must be at least 10 characters')
            } else if (shop.shopAbout.trim().length > 500) {
                errors.push('About section must not be longer than 500 characters')
            }
        }

        // Shop tagline: optional, but if provided, min 5, max 100
        if (shop.shopTagline && shop.shopTagline.trim().length > 0) {
            if (shop.shopTagline.trim().length < 5) {
                errors.push('Tagline must be at least 5 characters')
            } else if (shop.shopTagline.trim().length > 100) {
                errors.push('Tagline must not be longer than 100 characters')
            }
        }

        // Default hourly rate: optional, but if provided, min 1, max 1000
        if (shop.defaultHourlyRate !== undefined && shop.defaultHourlyRate !== null) {
            if (shop.defaultHourlyRate < 1) {
                errors.push('Hourly rate must be at least $1.00')
            } else if (shop.defaultHourlyRate > 1000) {
                errors.push('Hourly rate must be less than $1000.00')
            }
        }

        // Website: optional, but if provided, must be valid URL
        if (shop.website && shop.website.trim().length > 0) {
            try {
                new URL(shop.website)
            } catch {
                errors.push('Website must be a valid URL')
            }
        }

        // Services offered: must be an array
        if (!Array.isArray(shop.servicesOffered)) {
            errors.push('Services offered must be an array')
        }

        // Operating hours: must be an object
        if (!shop.operatingHours || typeof shop.operatingHours !== 'object' || Array.isArray(shop.operatingHours)) {
            errors.push('Operating hours must be an object')
        }

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
