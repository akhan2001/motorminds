import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { v4 as uuidv4 } from 'uuid'

const BUCKET_NAME = 'invoice-pdfs'

// POST /api/invoices/pdf - Upload invoice PDF and get shareable URL
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const shopId = await getShopIdForUser()
        
        if (!supabaseAdmin) {
            console.error('Supabase admin client not configured - check SUPABASE_SERVICE_ROLE_KEY')
            return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
        }
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 })
        }

        const body = await request.json()
        const { pdfBase64, invoiceNumber, filename } = body

        if (!pdfBase64 || !invoiceNumber) {
            return NextResponse.json({ 
                error: 'Missing required fields: pdfBase64, invoiceNumber' 
            }, { status: 400 })
        }

        // Generate unique file path
        const token = uuidv4()
        const filePath = `${shopId}/${invoiceNumber}/${token}.pdf`

        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(pdfBase64, 'base64')

        // Upload to Supabase Storage (using admin client for service role access)
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(filePath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: false
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            // Check for common errors
            if (uploadError.message?.includes('Bucket not found')) {
                return NextResponse.json({ 
                    error: 'PDF storage bucket not found. Please create "invoice-pdfs" bucket in Supabase Storage.' 
                }, { status: 500 })
            }
            return NextResponse.json({ 
                error: 'Failed to upload PDF: ' + uploadError.message 
            }, { status: 500 })
        }

        // Generate signed URL (valid for 72 hours)
        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .createSignedUrl(filePath, 72 * 60 * 60) // 72 hours in seconds

        if (signedUrlError) {
            console.error('Signed URL error:', signedUrlError)
            return NextResponse.json({ 
                error: 'Failed to generate PDF URL: ' + signedUrlError.message 
            }, { status: 500 })
        }

        // Store record in database for tracking (using admin to bypass RLS)
        const { error: dbError } = await supabaseAdmin
            .from('invoice_pdf_links')
            .insert({
                shop_id: shopId,
                invoice_number: invoiceNumber,
                token: token,
                file_path: filePath,
                expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString()
            })

        if (dbError) {
            console.error('Failed to store PDF link record:', dbError)
            // Don't fail - the URL still works
        }

        return NextResponse.json({
            success: true,
            url: signedUrlData.signedUrl,
            token: token,
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        })

    } catch (error: any) {
        console.error('POST /api/invoices/pdf error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
