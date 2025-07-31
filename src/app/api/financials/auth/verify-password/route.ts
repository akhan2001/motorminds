import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.FINANCIALS_JWT_SECRET || 'your-secret-key-here'
);

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's shop_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single();

        if (userError || !userData?.shop_id) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        const shopId = userData.shop_id;

        // Check for lockout - count failed attempts in last 60 seconds
        const { data: recentAttempts, error: attemptError } = await supabase
            .from('financials_auth_attempts')
            .select('created_at')
            .eq('shop_id', shopId)
            .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last 60 seconds
            .order('created_at', { ascending: false });

        if (attemptError) {
            console.error('Error checking attempts:', attemptError);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        if (recentAttempts && recentAttempts.length >= 3) {
            const lastAttempt = new Date(recentAttempts[0].created_at);
            const lockoutEnds = new Date(lastAttempt.getTime() + 60000);
            const remainingSeconds = Math.ceil((lockoutEnds.getTime() - Date.now()) / 1000);

            if (remainingSeconds > 0) {
                return NextResponse.json({ 
                    error: 'Too many attempts', 
                    lockoutRemaining: remainingSeconds 
                }, { status: 429 });
            }
        }

        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Password required' }, { status: 400 });
        }

        // Get shop's financial password hash
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('financials_password_hash')
            .eq('id', shopId)
            .single();

        if (shopError || !shopData) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        if (!shopData.financials_password_hash) {
            return NextResponse.json({ 
                error: 'Financial password not configured. Please contact your administrator.' 
            }, { status: 400 });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, shopData.financials_password_hash);

        // Always log the attempt
        await supabase
            .from('financials_auth_attempts')
            .insert({ shop_id: shopId });

        // Log detailed access log
        await supabase
            .from('financials_access_log')
            .insert({
                shop_id: shopId,
                user_id: user.id,
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                status: isValid ? 'success' : 'failure'
            });

        if (!isValid) {
            return NextResponse.json({ 
                error: 'Incorrect password. Please check your password and try again.' 
            }, { status: 401 });
        }

        // Generate JWT token for financial session
        const token = await new SignJWT({ 
            shopId, 
            userId: user.id,
            exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('15m')
            .sign(JWT_SECRET);

        // Set secure cookie
        const response = NextResponse.json({ 
            success: true,
            expiresAt: new Date(Date.now() + (15 * 60 * 1000)).toISOString()
        });

        response.cookies.set('financial-session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 minutes
            path: '/financials'
        });

        return response;

    } catch (error) {
        console.error('Verify password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
 