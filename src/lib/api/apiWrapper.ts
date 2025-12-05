import { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@supabase/ssr'

interface ApiWrapperOptions {
    /**
     * If true, requires authentication to access the API route
     */
    withAuth?: boolean
    /**
     * If true, requires admin role to access the API route
     */
    requireAdmin?: boolean
}

/**
 * API Wrapper for Next.js API routes
 * 
 * Based on Supabase Studio's apiWrapper pattern:
 * - Validates authentication for protected routes
 * - Checks admin permissions if required
 * - Provides consistent error handling
 * - Adds user context to request
 * 
 * @example
 * ```ts
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   return apiWrapper(req, res, async (req, res) => {
 *     // Your API logic here
 *     // req.user is available if withAuth: true
 *     res.status(200).json({ data: 'success' })
 *   }, { withAuth: true })
 * }
 * ```
 */
export default async function apiWrapper(
    req: NextApiRequest,
    res: NextApiResponse,
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
    options: ApiWrapperOptions = {}
) {
    const { withAuth = false, requireAdmin = false } = options

    try {
        // If authentication is required, validate the user
        if (withAuth) {
            const authResult = await apiAuthenticate(req)

            if (!authResult.success) {
                return res.status(401).json({
                    error: {
                        message: `Unauthorized: ${authResult.error}`,
                        code: 'UNAUTHORIZED',
                    },
                })
            }

            // Add user to request object for handler to use
            ; (req as any).user = authResult.user
                ; (req as any).claims = authResult.claims

            // If admin is required, check role
            if (requireAdmin) {
                const isAdmin = await checkAdminRole(authResult.user.id)

                if (!isAdmin) {
                    return res.status(403).json({
                        error: {
                            message: 'Forbidden: Admin access required',
                            code: 'FORBIDDEN',
                        },
                    })
                }
            }
        }

        // Call the actual handler
        return await handler(req, res)
    } catch (error) {
        console.error('[apiWrapper] Error:', error)

        return res.status(500).json({
            error: {
                message: error instanceof Error ? error.message : 'Internal server error',
                code: 'INTERNAL_ERROR',
            },
        })
    }
}

/**
 * Authenticate API request
 * Validates JWT token from Authorization header
 */
async function apiAuthenticate(req: NextApiRequest): Promise<{
    success: boolean
    user?: any
    claims?: any
    error?: string
}> {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader) {
            return { success: false, error: 'Missing authorization header' }
        }

        const token = authHeader.replace(/bearer /i, '').trim()
        if (!token) {
            return { success: false, error: 'Missing access token' }
        }

        // Create Supabase client with the token
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return []
                    },
                    setAll() { },
                },
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            }
        )

        // Validate the token by getting claims
        const { data, error } = await supabase.auth.getClaims()

        if (error || !data?.claims) {
            return { success: false, error: error?.message || 'Invalid token' }
        }

        // Extract user info from claims
        const user = {
            id: data.claims.sub,
            email: data.claims.email,
            user_metadata: data.claims.user_metadata || {},
            app_metadata: data.claims.app_metadata || {},
        }

        return {
            success: true,
            user,
            claims: data.claims,
        }
    } catch (error) {
        console.error('[apiAuthenticate] Error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
        }
    }
}

/**
 * Check if user has admin role
 */
async function checkAdminRole(userId: string): Promise<boolean> {
    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return []
                    },
                    setAll() { },
                },
            }
        )

        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .maybeSingle()

        if (error || !data) {
            return false
        }

        const role = data.role?.toUpperCase()
        return (
            role === 'ADMIN' ||
            role === 'SUPER-ADMIN' ||
            role === 'SUPER_ADMIN' ||
            role === 'SHOP_ADMIN' ||
            role === 'ORGANIZATION_ADMIN'
        )
    } catch (error) {
        console.error('[checkAdminRole] Error:', error)
        return false
    }
}

/**
 * Helper to check if response is OK
 */
export function isResponseOk(response: any): boolean {
    return response && response.success !== false && !response.error
}

