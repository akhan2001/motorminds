import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

// POST - Send pending message immediately
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: 'Queue item ID required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Verify queue item exists and belongs to shop
        const { data: existingItem, error: fetchError } = await supabase
            .from('ai_message_queue')
            .select('*')
            .eq('id', id)
            .eq('shop_id', shopId)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
            }
            throw fetchError;
        }

        // Only allow sending pending messages
        if (existingItem.status !== 'pending') {
            return NextResponse.json(
                { error: `Cannot send message with status: ${existingItem.status}` },
                { status: 400 }
            );
        }

        // Update scheduled_send_at to now to make it eligible for immediate processing
        const { error: updateError } = await supabase
            .from('ai_message_queue')
            .update({
                scheduled_send_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        // Trigger the process-queue endpoint synchronously to send immediately
        console.log('🚀 Triggering process-queue for immediate send...');
        
        try {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                           (request.headers.get('host')?.includes('localhost') 
                               ? `http://${request.headers.get('host')}` 
                               : `https://${request.headers.get('host')}`);
            
            const processResponse = await fetch(`${baseUrl}/api/messaging/process-queue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!processResponse.ok) {
                const errorData = await processResponse.json();
                console.error('❌ Process queue failed:', errorData);
                throw new Error(errorData.error || 'Failed to process queue');
            }

            const result = await processResponse.json();
            console.log('✅ Process queue result:', result);

            return NextResponse.json({
                success: true,
                message: result.processed > 0 
                    ? `Message sent successfully!` 
                    : 'Message queued for sending',
                details: result
            });

        } catch (error: any) {
            console.error('❌ Error triggering process-queue:', error);
            
            // Return success but indicate it's queued (cron will pick it up)
            return NextResponse.json({
                success: true,
                message: 'Message scheduled for sending (will be processed by cron job)',
                warning: error.message
            });
        }

    } catch (error: any) {
        console.error('Error sending message now:', error);
        return NextResponse.json(
            { error: 'Failed to send message', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

