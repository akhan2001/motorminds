import { NextResponse } from 'next/server';
import { createDocuSealSubmission } from '@/app/customer-contracts/utils/docuseal-utils';

export async function POST(req: Request) {
    try {
        const { contractId, customerEmail, customerName } = await req.json();
        
        const result = await createDocuSealSubmission({
            contractId,
            customerEmail,
            customerName
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error creating DocuSeal submission:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to create submission' 
        }, { status: 500 });
    }
} 