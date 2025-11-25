import { NextRequest, NextResponse } from 'next/server'
import { UserCreationService } from '@/app/(features)/admin/services/user-creation'
import { CreateUserRequest } from '@/app/(features)/admin/types/user-creation'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body: any = await request.json()

        // Check user creation limits for organization admins
        if (body.admin_type === 'organization-admin' && body.organization_id) {
            const supabase = await createClient()
            
            // Get authenticated user
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            
            if (authError || !user) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                )
            }

            // Get user's organization_id
            const { data: userData } = await supabase
                .from('users')
                .select('organization_id, role')
                .eq('id', user.id)
                .single()

            // Verify user is organization admin and matches the organization_id
            const userRole = userData?.role?.toUpperCase()
            const isOrgAdmin = (userRole === 'ADMIN' || userRole === 'ORGANIZATION_ADMIN') && 
                             userData?.organization_id === body.organization_id

            if (!isOrgAdmin) {
                return NextResponse.json(
                    { error: 'Forbidden - Organization admin access required' },
                    { status: 403 }
                )
            }

            // Check user limit
            const limitResponse = await fetch(`${request.nextUrl.origin}/api/admin/organization/user-limit`, {
                headers: {
                    'Cookie': request.headers.get('Cookie') || ''
                }
            })

            if (limitResponse.ok) {
                const limitData = await limitResponse.json()
                if (!limitData.canCreate) {
                    return NextResponse.json(
                        { error: `User limit reached. Maximum ${limitData.limit} users allowed.` },
                        { status: 403 }
                    )
                }
            }
        }

        // Check user creation limits for shop admins
        if (body.admin_type === 'shop-admin' && body.shop_id) {
            const supabase = await createClient()
            
            // Get authenticated user
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            
            if (authError || !user) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                )
            }

            // Get user's shop_id
            const { data: userData } = await supabase
                .from('users')
                .select('shop_id, role')
                .eq('id', user.id)
                .single()

            // Verify user is shop admin and matches the shop_id
            const userRole = userData?.role?.toUpperCase()
            const isShopAdmin = (userRole === 'ADMIN' || userRole === 'SHOP_ADMIN') && 
                              userData?.shop_id === body.shop_id

            if (!isShopAdmin) {
                return NextResponse.json(
                    { error: 'Forbidden - Shop admin access required' },
                    { status: 403 }
                )
            }

            // Prevent shop admins from creating admin roles
            if (body.role === 'admin' || body.role === 'super-admin') {
                return NextResponse.json(
                    { error: 'Shop admins cannot create admin roles' },
                    { status: 403 }
                )
            }

            // Check user limit
            const limitResponse = await fetch(`${request.nextUrl.origin}/api/admin/shop/user-limit`, {
                headers: {
                    'Cookie': request.headers.get('Cookie') || ''
                }
            })

            if (limitResponse.ok) {
                const limitData = await limitResponse.json()
                if (!limitData.canCreate) {
                    return NextResponse.json(
                        { error: `User limit reached. Maximum ${limitData.maxTotal} users allowed (shop admin + ${limitData.limit} additional).` },
                        { status: 403 }
                    )
                }
            }
        }

        // Convert to CreateUserRequest format
        // Handle both nested structure (from page) and flat structure (for backwards compatibility)
        const userData = body.user || body
        const shopData = body.shop
        
        const createUserRequest: any = {
            user: {
                email: userData.email,
                password: userData.password,
                fullName: userData.fullName || userData.full_name,
                phone: userData.phone || '',
                role: userData.role,
                plan: userData.plan || 'DEFAULT',
                status: userData.status,
                shop_id: body.shop_id || null,
                organization_id: body.organization_id || null
            },
            shop: shopData,
            createShop: body.createShop || false
        }

        // Validate the request
        if (!createUserRequest.user) {
            return NextResponse.json(
                { error: 'User data is required' },
                { status: 400 }
            )
        }

        // Validate user data
        const userErrors = await UserCreationService.validateUserData(createUserRequest.user)
        if (userErrors.length > 0) {
            return NextResponse.json(
                { error: 'User validation failed', details: userErrors },
                { status: 400 }
            )
        }

        // Create the user
        const result = await UserCreationService.createUser(createUserRequest)

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                userId: result.userId,
                shopId: result.shopId
            })
        } else {
            // Provide more specific error messages
            let statusCode = 400
            if (result.message.includes('already exists')) {
                statusCode = 409 // Conflict
            } else if (result.message.includes('validation')) {
                statusCode = 422 // Unprocessable Entity
            }
            
            return NextResponse.json(
                { 
                    error: result.message,
                    success: false 
                },
                { status: statusCode }
            )
        }

    } catch (error) {
        console.error('Error in create user API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
