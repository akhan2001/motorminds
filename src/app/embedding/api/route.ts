import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const { data: records, error } = await supabase
            .from('toyota-table')
            .select('id, content')
            .is('embeddings', null)
            .limit(10); // Add limit for safety during testing

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ 
                success: false, 
                error: error.message 
            }, { status: 500 });
        }

        // For debugging, print some record info
        const recordSummary = records?.map(r => ({
            id: r.id,
            contentType: typeof r.content,
            hasContent: r.content !== null && r.content !== undefined
        }));

        console.log('Records summary:', JSON.stringify(recordSummary, null, 2));
        console.log(`Found ${records?.length || 0} records without embeddings`);

        return NextResponse.json({ 
            success: true, 
            count: records?.length || 0,
            summary: recordSummary,
            message: `Found ${records?.length || 0} records without embeddings` 
        });
    } catch (err) {
        console.error('API route error:', 
            err instanceof Error ? `${err.message}\n${err.stack}` : err);
            
        return NextResponse.json({ 
            success: false, 
            error: err instanceof Error ? err.message : 'Unknown error' 
        }, { status: 500 });
    }
}