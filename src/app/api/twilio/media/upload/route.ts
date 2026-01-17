import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getShopIdForUser } from '@/utils/get-shop-id'

// Admin client for storage (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Storage bucket name and folder
const STORAGE_BUCKET = 'motorminds'
const MEDIA_FOLDER = 'media'

// Max file size: 5MB (Twilio MMS limit)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed MIME types for MMS (Twilio compatible)
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
]

/**
 * POST /api/twilio/media/upload - Upload media file for MMS
 */
export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser()

        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 })
        }

        // Parse multipart form data
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            )
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, GIF` },
                { status: 400 }
            )
        }

        // Generate unique file path: media/{shopId}/{timestamp}_{random}.{ext}
        const fileExtension = getFileExtension(file.type)
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const fileName = `${MEDIA_FOLDER}/${shopId}/${timestamp}_${randomId}${fileExtension}`

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        // Upload to Supabase Storage (using admin client to bypass RLS)
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)

            // Check if bucket doesn't exist
            if (uploadError.message?.includes('Bucket not found') || 
                (uploadError as any).statusCode === '404') {
                return NextResponse.json(
                    {
                        error: `Storage bucket "${STORAGE_BUCKET}" not found.`,
                        details: 'Ensure the "motorminds" bucket exists in Supabase Storage with a "media" folder.',
                    },
                    { status: 503 }
                )
            }

            return NextResponse.json(
                { error: 'Failed to upload file: ' + uploadError.message },
                { status: 500 }
            )
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName)

        const mediaUrl = urlData.publicUrl

        return NextResponse.json({
            success: true,
            url: mediaUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            storagePath: fileName,
        })
    } catch (error) {
        console.error('POST /api/twilio/media/upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/twilio/media/upload - Delete uploaded media
 */
export async function DELETE(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser()

        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const storagePath = searchParams.get('path')

        if (!storagePath) {
            return NextResponse.json({ error: 'No path provided' }, { status: 400 })
        }

        // Ensure the path belongs to this shop (security check)
        // Path format: media/{shopId}/...
        if (!storagePath.startsWith(`${MEDIA_FOLDER}/${shopId}/`)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Delete from storage (using admin client to bypass RLS)
        const { error: deleteError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove([storagePath])

        if (deleteError) {
            console.error('Delete error:', deleteError)
            return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
        })
    } catch (error) {
        console.error('DELETE /api/twilio/media/upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(contentType: string): string {
    const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'video/mp4': '.mp4',
        'video/3gpp': '.3gp',
        'audio/mpeg': '.mp3',
        'audio/ogg': '.ogg',
        'application/pdf': '.pdf',
    }
    return mimeToExt[contentType] || '.bin'
}
