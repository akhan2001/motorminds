import { NextRequest, NextResponse } from 'next/server'
import { UserCreationService } from '@/app/(features)/admin/services/user-creation'
import { CreateUserRequest } from '@/app/(features)/admin/types/user-creation'

export async function POST(request: NextRequest) {
    try {
        const body: CreateUserRequest = await request.json()

        // Validate the request
        if (!body.user) {
            return NextResponse.json(
                { error: 'User data is required' },
                { status: 400 }
            )
        }

        if (body.createShop && !body.shop) {
            return NextResponse.json(
                { error: 'Shop data is required when createShop is true' },
                { status: 400 }
            )
        }

        // Validate user data
        const userErrors = await UserCreationService.validateUserData(body.user)
        if (userErrors.length > 0) {
            return NextResponse.json(
                { error: 'User validation failed', details: userErrors },
                { status: 400 }
            )
        }

        // Validate shop data if creating a shop
        if (body.createShop && body.shop) {
            const shopErrors = await UserCreationService.validateShopData(body.shop)
            if (shopErrors.length > 0) {
                return NextResponse.json(
                    { error: 'Shop validation failed', details: shopErrors },
                    { status: 400 }
                )
            }
        }

        // Create the user
        const result = await UserCreationService.createUser(body)

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
