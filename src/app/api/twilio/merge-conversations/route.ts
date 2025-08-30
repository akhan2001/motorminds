import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/twilio/merge-conversations - Manually merge duplicate conversations
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get all conversations grouped by normalized phone number
        const { data: conversations, error } = await supabase
            .from('sms_conversations')
            .select('*')
            .order('last_message_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
        }

        // Group conversations by normalized phone number
        const phoneGroups: { [key: string]: any[] } = {};
        
        conversations?.forEach(conv => {
            if (!conv.customer_phone) return;
            
            // Normalize phone number
            const phone = conv.customer_phone;
            const normalized = phone.replace('+', '');
            const withoutCountryCode = normalized.startsWith('1') ? normalized.substring(1) : normalized;
            
            // Use the most common format as the key
            const key = phone.includes('+') ? phone : `+1${withoutCountryCode}`;
            
            if (!phoneGroups[key]) {
                phoneGroups[key] = [];
            }
            phoneGroups[key].push(conv);
        });

        let mergedCount = 0;
        const results = [];

        // Process each group
        for (const [normalizedPhone, convs] of Object.entries(phoneGroups)) {
            if (convs.length > 1) {
                console.log(`Merging ${convs.length} conversations for ${normalizedPhone}`);
                
                // Sort by last_message_at to keep the most recent
                convs.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
                
                const keepConversation = convs[0];
                const deleteConversations = convs.slice(1);
                
                // Update all messages to point to the kept conversation
                for (const conv of deleteConversations) {
                    await supabase
                        .from('sms_messages')
                        .update({
                            customer_id: keepConversation.customer_id
                        })
                        .eq('shop_id', conv.shop_id)
                        .or(`from_number.eq.${conv.customer_phone},to_number.eq.${conv.customer_phone}`);
                }
                
                // Delete duplicate conversations
                for (const conv of deleteConversations) {
                    await supabase
                        .from('sms_conversations')
                        .delete()
                        .eq('id', conv.id);
                }
                
                // Update the kept conversation to use normalized phone
                await supabase
                    .from('sms_conversations')
                    .update({
                        customer_phone: normalizedPhone
                    })
                    .eq('id', keepConversation.id);
                
                mergedCount += deleteConversations.length;
                results.push({
                    phone: normalizedPhone,
                    kept: keepConversation.id,
                    deleted: deleteConversations.map(c => c.id),
                    count: convs.length
                });
            }
        }

        return NextResponse.json({
            success: true,
            mergedCount,
            results,
            message: `Merged ${mergedCount} duplicate conversations`
        });

    } catch (error) {
        console.error('Merge error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/twilio/merge-conversations - Check for duplicate conversations
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: conversations, error } = await supabase
            .from('sms_conversations')
            .select('*')
            .order('last_message_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
        }

        // Group by normalized phone number
        const phoneGroups: { [key: string]: any[] } = {};
        
        conversations?.forEach(conv => {
            if (!conv.customer_phone) return;
            
            const phone = conv.customer_phone;
            const normalized = phone.replace('+', '');
            const withoutCountryCode = normalized.startsWith('1') ? normalized.substring(1) : normalized;
            const key = phone.includes('+') ? phone : `+1${withoutCountryCode}`;
            
            if (!phoneGroups[key]) {
                phoneGroups[key] = [];
            }
            phoneGroups[key].push(conv);
        });

        const duplicates = Object.entries(phoneGroups)
            .filter(([_, convs]) => convs.length > 1)
            .map(([phone, convs]) => ({
                phone,
                conversations: convs.map(c => ({
                    id: c.id,
                    customer_phone: c.customer_phone,
                    last_message_at: c.last_message_at,
                    customer_id: c.customer_id
                })),
                count: convs.length
            }));

        return NextResponse.json({
            success: true,
            totalConversations: conversations?.length || 0,
            duplicates,
            duplicateCount: duplicates.length
        });

    } catch (error) {
        console.error('Check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
