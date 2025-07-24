import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';
import { generateContractHTML } from './docuseal-html-template';
import { createDocuSealSubmissionFreePlan } from './docuseal-free-plan-utils';

export interface CreateSubmissionParams {
    contractId: string;
    customerEmail: string;
    customerName: string;
}

export interface SubmissionResult {
    slug: string;
    submissionId: string;
}

export async function createDocuSealSubmission({
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

    // Get contract with shop details
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

    try {
        // First, try HTML-based submission (Pro plan feature)
        const htmlContent = generateContractHTML(contract, contract.shops);

        const docusealResponse = await fetch(`${config.docuseal.apiUrl}/submissions/html`, {
            method: 'POST',
            headers: {
                'X-Auth-Token': config.docuseal.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `${contract.title} - ${contract.shops.shop_name}`,
                external_id: `contract-${contract.id}`,
                send_email: false,
                documents: [
                    {
                        name: contract.title || 'Service Contract',
                        html: htmlContent,
                        size: 'A4'
                    }
                ],
                submitters: [
                    {
                        role: 'Customer',
                        email: customerEmail,
                        name: customerName
                    }
                ]
            })
        });

        if (!docusealResponse.ok) {
            const errorData = await docusealResponse.text();
            console.error('DocuSeal HTML API error:', {
                status: docusealResponse.status,
                statusText: docusealResponse.statusText,
                response: errorData,
                apiUrl: config.docuseal.apiUrl,
                hasApiKey: !!config.docuseal.apiKey
            });

            // If it's a plan limitation error (403/402) or Pro feature error, try free plan approach
            if (docusealResponse.status === 403 || 
                docusealResponse.status === 402 || 
                errorData.includes('Pro') ||
                errorData.includes('plan') ||
                errorData.includes('subscription')) {
                
                console.log('HTML submissions not available - trying template-based approach for free plan...');
                return await createDocuSealSubmissionFreePlan({
                    contractId,
                    customerEmail,
                    customerName
                });
            }
            
            // For other errors, provide detailed message
            let errorMessage = 'Failed to create DocuSeal submission';
            try {
                const parsedError = JSON.parse(errorData);
                if (parsedError.error) {
                    errorMessage += `: ${parsedError.error}`;
                } else if (parsedError.message) {
                    errorMessage += `: ${parsedError.message}`;
                }
            } catch (e) {
                if (errorData) {
                    errorMessage += `: ${errorData.substring(0, 200)}`;
                }
            }
            
            throw new Error(errorMessage);
        }

        // Process successful HTML submission response
        const submissionData = await docusealResponse.json();
        const customerSubmission = submissionData.submitters?.find(
            (submitter: any) => submitter.email === customerEmail
        );

        if (!customerSubmission?.slug) {
            throw new Error('Failed to get submission slug from DocuSeal');
        }

        // Update contract with submission details
        const { error: updateError } = await supabase
            .from('service_contracts')
            .update({
                docuseal_submission_id: submissionData.id || customerSubmission.slug,
                signature_status: 'sent'
            })
            .eq('id', contractId);

        if (updateError) {
            console.error('Error updating contract:', updateError);
        }

        return {
            slug: customerSubmission.slug,
            submissionId: submissionData.id
        };

    } catch (error) {
        // If HTML submission failed and we haven't tried template approach yet, try it
        if (error instanceof Error && 
            (error.message.includes('Failed to create DocuSeal submission') ||
             error.message.includes('fetch'))) {
            
            console.log('HTML submission failed - trying template-based approach...');
            try {
                return await createDocuSealSubmissionFreePlan({
                    contractId,
                    customerEmail,
                    customerName
                });
            } catch (fallbackError) {
                console.error('Both HTML and template approaches failed:', {
                    htmlError: error,
                    templateError: fallbackError
                });
                throw new Error(`DocuSeal integration failed. HTML approach: ${error.message}. Template approach: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
            }
        }
        
        console.error('Error creating DocuSeal submission:', error);
        throw error;
    }
}

// Legacy template creation function - keeping for reference but no longer used
export async function createDocuSealTemplate({
    contract,
    shop
}: any): Promise<any> {
    console.warn('createDocuSealTemplate is deprecated. Using HTML-based submissions instead.');
    return { id: 'html-based', slug: 'html-based' };
} 