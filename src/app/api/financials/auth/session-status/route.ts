import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.FINANCIALS_JWT_SECRET || 'your-secret-key-here'
);

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get financial session token from cookie
        const token = request.cookies.get('financial-session')?.value;

        if (!token) {
            return NextResponse.json({ 
                isValid: false, 
                reason: 'No session token' 
            });
        }

        try {
            // Verify JWT token
            const { payload } = await jwtVerify(token, JWT_SECRET);
            
            // Check if token belongs to current user
            if (payload.userId !== user.id) {
                return NextResponse.json({ 
                    isValid: false, 
                    reason: 'Token user mismatch' 
                });
            }

            // Check expiration
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                return NextResponse.json({ 
                    isValid: false, 
                    reason: 'Token expired' 
                });
            }

            return NextResponse.json({
                isValid: true,
                expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
                shopId: payload.shopId
            });

        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return NextResponse.json({ 
                isValid: false, 
                reason: 'Invalid token' 
            });
        }

    } catch (error) {
        console.error('Session status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    // Logout - clear the session cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('financial-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/financials'
    });

    return response;
}
 