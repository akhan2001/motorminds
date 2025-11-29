import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// docuseal-html-template doesn't exist - feature needs refactoring
// import { generateContractHTML } from '@/app/customer-contracts/utils/docuseal-html-template';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const contractId = url.searchParams.get('contractId');

        if (!contractId) {
            return new NextResponse('Contract ID is required', { status: 400 });
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
            return new NextResponse('Contract not found', { status: 404 });
        }

        // TODO: Refactor - generateContractHTML doesn't exist
        // const htmlContent = generateContractHTML(contract, contract.shops);

        return NextResponse.json({ error: 'Endpoint needs refactoring' }, { status: 501 });

        // Return HTML for preview
        // return new NextResponse(htmlContent, {
        //     headers: {
        //         'Content-Type': 'text/html',
        //     },
        // });

    } catch (error) {
        console.error('Error generating HTML preview:', error);
        return new NextResponse('Failed to generate preview', { status: 500 });
    }
} 