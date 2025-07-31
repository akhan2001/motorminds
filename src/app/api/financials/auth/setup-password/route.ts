import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

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

        const { password } = await request.json();

        // Validate password strength
        if (!password || password.length < 8) {
            return NextResponse.json({ 
                error: 'Password must be at least 8 characters long' 
            }, { status: 400 });
        }

        // Check if password contains required elements
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);

        if (!hasUppercase || !hasLowercase || !hasNumber) {
            return NextResponse.json({ 
                error: 'Password must contain uppercase, lowercase, and number' 
            }, { status: 400 });
        }

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update shop with hashed password
        const { error: updateError } = await supabase
            .from('shops')
            .update({ 
                financials_password_hash: hashedPassword,
                // Clear any existing reset tokens
                financials_reset_token: null,
                financials_reset_token_expires_at: null
            })
            .eq('id', userData.shop_id);

        if (updateError) {
            console.error('Database error:', updateError);
            return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
        }

        // Log the setup event
        await supabase
            .from('financials_access_log')
            .insert({
                shop_id: userData.shop_id,
                user_id: user.id,
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                status: 'password_setup'
            });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Setup password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
 