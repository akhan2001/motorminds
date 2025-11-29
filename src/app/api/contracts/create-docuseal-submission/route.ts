import { NextResponse } from 'next/server';
// Docuseal utils file doesn't exist - feature needs refactoring
// import { createDocuSealSubmission } from '@/app/customer-contracts/utils/docuseal-utils';

export async function POST(req: Request) {
    try {
        const { contractId, customerEmail, customerName } = await req.json();
        
        // TODO: Refactor this endpoint - docuseal utils don't exist
        return NextResponse.json({ error: 'Endpoint needs refactoring' }, { status: 501 });
        
        // const result = await createDocuSealSubmission({
        //     contractId,
        //     customerEmail,
        //     customerName
        // });

        // return NextResponse.json(result);

    } catch (error) {
        console.error('Error creating DocuSeal submission:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Failed to create submission' 
        }, { status: 500 });
    }
} 