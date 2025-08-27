import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

        // Check recent attempts (last 60 seconds)
        const { data: recentAttempts, error: attemptError } = await supabase
            .from('financials_auth_attempts')
            .select('created_at')
            .eq('shop_id', shopId)
            .gte('created_at', new Date(Date.now() - 60000).toISOString())
            .order('created_at', { ascending: false });

        if (attemptError) {
            console.error('Error checking attempts:', attemptError);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        const attemptCount = recentAttempts?.length || 0;
        let lockoutRemaining = 0;

        if (attemptCount >= 3 && recentAttempts && recentAttempts.length > 0) {
            const lastAttempt = new Date(recentAttempts[0].created_at);
            const lockoutEnds = new Date(lastAttempt.getTime() + 60000); // 60 seconds
            lockoutRemaining = Math.max(0, Math.ceil((lockoutEnds.getTime() - Date.now()) / 1000));
        }

        return NextResponse.json({
            isLockedOut: lockoutRemaining > 0,
            lockoutRemaining,
            attemptCount: Math.min(attemptCount, 3)
        });

    } catch (error) {
        console.error('Check lockout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
 