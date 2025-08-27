// Financial authentication middleware helper
// This can be integrated into your main middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.FINANCIALS_JWT_SECRET || 'your-secret-key-here'
);

export async function checkFinancialAuth(request: NextRequest): Promise<NextResponse | null> {
    // Only check financial auth for /financials routes
    if (!request.nextUrl.pathname.startsWith('/financials')) {
        return null;
    }

    // Allow the layout and auth endpoints to pass through
    if (
        request.nextUrl.pathname === '/financials' ||
        request.nextUrl.pathname.startsWith('/api/financials/auth/')
    ) {
        return null;
    }

    try {
        // Get financial session token from cookie
        const token = request.cookies.get('financial-session')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/financials', request.url));
        }

        // Verify JWT token
        const { payload } = await jwtVerify(token, JWT_SECRET);
        
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            // Token expired, redirect to unlock
            const response = NextResponse.redirect(new URL('/financials', request.url));
            response.cookies.set('financial-session', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 0,
                path: '/financials'
            });
            return response;
        }

        // Token is valid, allow access
        return null;

    } catch (error) {
        // Invalid token, redirect to unlock
        console.error('Financial auth middleware error:', error);
        const response = NextResponse.redirect(new URL('/financials', request.url));
        response.cookies.set('financial-session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/financials'
        });
        return response;
    }
}