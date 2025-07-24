import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';

export interface CreateSubmissionParams {
    contractId: string;
    customerEmail: string;
    customerName: string;
}

export interface SubmissionResult {
    slug: string;
    submissionId: string;
}

// Free plan compatible submission creation using existing templates
export async function createDocuSealSubmissionFreePlan({
    contractId,
    customerEmail,
    customerName
}: CreateSubmissionParams): Promise<SubmissionResult> {
    
    if (!contractId || !customerEmail) {
        throw new Error('Contract ID and customer email are required');
    }

    if (!config.docuseal.apiKey) {
        throw new Error('DocuSeal API key not configured');
    }

    // Get contract details
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
        throw new Error('Contract not found');
    }

    // For free plan, you need to use a pre-created template ID
    // This should be set in your environment variables
    const templateId = process.env.DOCUSEAL_FREE_TEMPLATE_ID || config.docuseal.templateId;
    
    if (!templateId) {
        throw new Error('DocuSeal template ID not configured. For free plan, you need to create a template manually and set DOCUSEAL_FREE_TEMPLATE_ID environment variable.');
    }

    try {
        // Create submission using existing template (free plan compatible)
        const docusealResponse = await fetch(`${config.docuseal.apiUrl}/submissions`, {
            method: 'POST',
            headers: {
                'X-Auth-Token': config.docuseal.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_id: parseInt(templateId),
                send_email: false, // We handle email sending ourselves
                submitters: [
                    {
                        role: 'Customer',
                        email: customerEmail,
                        name: customerName,
                        // Pre-fill contract data in the template fields
                        values: {
                            'Contract Title': contract.title,
                            'Customer Name': contract.customer?.customer_name || customerName,
                            'Shop Name': contract.shops?.shop_name || '',
                            'Vehicle Info': contract.vehicle ? 
                                `${contract.vehicle.year} ${contract.vehicle.make} ${contract.vehicle.model}` : 
                                'N/A'
                        }
                    }
                ]
            })
        });

        if (!docusealResponse.ok) {
            const errorData = await docusealResponse.text();
            console.error('DocuSeal API error:', {
                status: docusealResponse.status,
                statusText: docusealResponse.statusText,
                response: errorData,
                apiUrl: config.docuseal.apiUrl,
                hasApiKey: !!config.docuseal.apiKey,
                templateId: templateId
            });
            
            // Parse error for better messaging
            let errorMessage = 'Failed to create DocuSeal submission';
            try {
                const parsedError = JSON.parse(errorData);
                if (parsedError.error) {
                    errorMessage += `: ${parsedError.error}`;
                }
            } catch (e) {
                if (errorData) {
                    errorMessage += `: ${errorData.substring(0, 200)}`;
                }
            }
            
            throw new Error(errorMessage);
        }

        const submissionData = await docusealResponse.json();
        
        // Find customer submitter
        const customerSubmitters = Array.isArray(submissionData) ? submissionData : [submissionData];
        const customerSubmission = customerSubmitters.find(
            (submitter: any) => submitter.email === customerEmail
        );

        if (!customerSubmission?.slug) {
            throw new Error('Failed to get submission slug from DocuSeal');
        }

        // Update contract with submission details
        const { error: updateError } = await supabase
            .from('service_contracts')
            .update({
                docuseal_submission_id: customerSubmission.submission_id || customerSubmission.id,
                signature_status: 'sent'
            })
            .eq('id', contractId);

        if (updateError) {
            console.error('Error updating contract:', updateError);
        }

        return {
            slug: customerSubmission.slug,
            submissionId: customerSubmission.submission_id || customerSubmission.id
        };

    } catch (error) {
        console.error('Error creating DocuSeal submission:', error);
        throw error;
    }
} 