import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { markContractCompleted, markContractDeclined, markContractViewed } from '@/app/customer-contracts/utils/contract-utils';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const headersList = headers();
        
        // Log the webhook for debugging
        console.log('DocuSeal webhook received:', {
            event: body.event_type,
            submissionId: body.data?.id,
            status: body.data?.status
        });

        // Extract event information
        const eventType = body.event_type;
        const submissionData = body.data;

        if (!submissionData?.id) {
            return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
        }

        // Find the contract associated with this DocuSeal submission
        const { data: contract, error: contractError } = await supabase
            .from('service_contracts')
            .select('id, title, signature_status')
            .eq('docuseal_submission_id', submissionData.id.toString())
            .single();

        if (contractError || !contract) {
            console.log('Contract not found for submission:', submissionData.id);
            return NextResponse.json({ message: 'Contract not found' }, { status: 404 });
        }

        // Handle different webhook events
        switch (eventType) {
            case 'submission.viewed':
                if (contract.signature_status === 'sent') {
                    await markContractViewed(contract.id);
                    console.log(`Contract ${contract.id} marked as viewed`);
                }
                break;

            case 'submission.completed':
                if (submissionData.status === 'completed') {
                    // Get the signed document URL from DocuSeal
                    const completionData = {
                        submission_id: submissionData.id,
                        download_url: submissionData.download_url || null,
                        completed_at: submissionData.completed_at || new Date().toISOString()
                    };

                    await markContractCompleted(contract.id, completionData);
                    console.log(`Contract ${contract.id} marked as completed`);
                }
                break;

            case 'submission.declined':
                await markContractDeclined(contract.id, {
                    submission_id: submissionData.id,
                    declined_at: submissionData.declined_at || new Date().toISOString(),
                    reason: submissionData.decline_reason || 'No reason provided'
                });
                console.log(`Contract ${contract.id} marked as declined`);
                break;

            default:
                console.log(`Unhandled webhook event: ${eventType}`);
        }

        return NextResponse.json({ message: 'Webhook processed successfully' });

    } catch (error) {
        console.error('Error processing DocuSeal webhook:', error);
        return NextResponse.json({ 
            error: 'Failed to process webhook' 
        }, { status: 500 });
    }
}

// Handle preflight requests for CORS
export async function OPTIONS(req: Request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
} 