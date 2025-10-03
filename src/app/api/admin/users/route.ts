import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            console.error('Supabase admin client not configured')
            return NextResponse.json(
                { error: 'Database connection not configured' },
                { status: 500 }
            )
        }
        
        // console.log('Fetching users from database...')
        
        try {
            // Try to fetch users with shop information
            const { data: users, error } = await supabaseAdmin
                .from('users')
                .select(`
                    id,
                    created_at,
                    role,
                    shop_id,
                    plan,
                    status,
                    shops(
                        id,
                        shop_name
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Database error:', error)
                // Return empty array instead of error for now
                return NextResponse.json({
                    success: true,
                    users: []
                })
            }

            // Transform the data to match the frontend interface
            const transformedUsers = await Promise.all(
                (users || []).map(async (user: any) => {
                    // Fetch auth user data
                    let email = ''
                    let fullName = ''
                    
                    try {
                        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.id)
                        if (!authError && authUser.user) {
                            email = authUser.user.email || ''
                            fullName = authUser.user.user_metadata?.full_name || ''
                        }
                    } catch (error) {
                        console.error('Error fetching auth data for user:', user.id, error)
                    }

                    return {
                        id: user.id,
                        created_at: user.created_at,
                        role: user.role,
                        shop_id: user.shop_id,
                        plan: user.plan,
                        status: user.status,
                        shop_name: user.shops?.shop_name,
                        email,
                        full_name: fullName,
                        last_login: null,
                        phone: null
                    }
                })
            )

            // console.log('Users fetched:', transformedUsers.length)

            return NextResponse.json({
                success: true,
                users: transformedUsers
            })
        } catch (dbError) {
            console.error('Database query error:', dbError)
            // Return empty array on database errors
            return NextResponse.json({
                success: true,
                users: []
            })
        }
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

