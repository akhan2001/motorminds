import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';
// docuseal-utils doesn't exist - feature needs refactoring
// import { createDocuSealSubmission } from '@/app/customer-contracts/utils/docuseal-utils';

const resend = new Resend(config.email.resendApiKey);

export async function POST(req: Request) {
    try {
        const { contractId } = await req.json();
        
        if (!contractId) {
            return NextResponse.json({ 
                error: 'Contract ID is required' 
            }, { status: 400 });
        }

        // Get contract details with shop and customer info
        const { data: contract, error: contractError } = await supabase
            .from('service_contracts')
            .select(`
                *,
                customer:customers (*),
                shops (*)
            `)
            .eq('id', contractId)
            .single();

        if (contractError || !contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        if (!contract.customer?.customer_email) {
            return NextResponse.json({ 
                error: 'Customer email not found' 
            }, { status: 400 });
        }

        // TODO: Refactor - createDocuSealSubmission doesn't exist
        return NextResponse.json({ error: 'Endpoint needs refactoring' }, { status: 501 });
        
        // Create DocuSeal submission using utility function
        // const submissionData = await createDocuSealSubmission({
        //     contractId: contract.id,
        //     customerEmail: contract.customer.customer_email,
        //     customerName: contract.customer.customer_name || 'Customer'
        // });
        
        // Create signing URL for customer with submission slug
        // const signingUrl = `${config.app.baseUrl}/contracts/sign/${contractId}?slug=${submissionData.slug}`;
        
        // Send email with signing link
        const { data, error } = await resend.emails.send({
            from: `${contract.shops.shop_name} <noreply@${config.email.fromDomain}>`,
            to: [contract.customer.customer_email],
            subject: `Service Contract - Signature Required`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Service Contract - Signature Required</h2>
                    <p>Hello ${contract.customer.customer_name},</p>
                    <p>Please review and sign your service contract by clicking the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${signingUrl}" 
                           style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                            Review & Sign Contract
                        </a>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Contract Details:</h3>
                        <p style="margin: 5px 0;"><strong>Title:</strong> ${contract.title}</p>
                        <p style="margin: 5px 0;"><strong>Shop:</strong> ${contract.shops.shop_name}</p>
                        ${contract.vehicle ? `<p style="margin: 5px 0;"><strong>Vehicle:</strong> ${contract.vehicle.year} ${contract.vehicle.make} ${contract.vehicle.model}</p>` : ''}
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #1565c0; font-size: 14px;">
                            <strong>Digital Signature:</strong> This contract uses secure digital signature technology. 
                            Your signature will be legally binding and fully compliant.
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        If you have any questions about this contract, please contact us directly.
                    </p>
                    
                    <p>Thank you,<br/>
                    <strong>${contract.shops.shop_name}</strong></p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #888; font-size: 12px;">
                        This email was sent by ${contract.shops.shop_name} via MotorMinds.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend API error:', error);
            return NextResponse.json({ 
                error: 'Failed to send email' 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true,
            message: 'Signing email sent successfully',
            signingUrl,
            submissionSlug: submissionData.slug,
            data 
        });

    } catch (error) {
        console.error('Error sending signing email:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to process request' 
        }, { status: 500 });
    }
} 