import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { contractId } = await req.json();

        if (!contractId) {
            return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
        }

        // With HTML-based submissions, we no longer need to create templates
        // Submissions are created directly from HTML content
        return NextResponse.json({
            message: 'Template creation is no longer needed with HTML-based submissions',
            info: 'Contracts now use direct HTML-to-PDF conversion with embedded signature fields'
        });

    } catch (error) {
        console.error('Template creation endpoint called:', error);
        return NextResponse.json({
            error: 'This endpoint is deprecated. Use HTML-based submissions instead.'
        }, { status: 410 }); // 410 Gone - resource no longer available
    }
} 