'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UploadedMedia, MediaUploadResponse } from '../types/sms'

// Media constraints
export const MEDIA_CONSTRAINTS = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_ATTACHMENTS: 10,
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
} as const

/**
 * Validate file for upload
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MEDIA_CONSTRAINTS.MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `${file.name} is too large. Maximum size is 5MB`,
        }
    }

    if (!MEDIA_CONSTRAINTS.ALLOWED_TYPES.includes(file.type as any)) {
        return {
            valid: false,
            error: `${file.name} has unsupported format. Use JPG, PNG, GIF, or WebP`,
        }
    }

    return { valid: true }
}

/**
 * Hook: Upload media file
 */
export function useMediaUpload() {
    return useMutation({
        mutationFn: async (file: File): Promise<UploadedMedia> => {
            // Validate file
            const validation = validateMediaFile(file)
            if (!validation.valid) {
                throw new Error(validation.error)
            }

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/twilio/media/upload', {
                method: 'POST',
                body: formData,
            })

            const data: MediaUploadResponse = await response.json()

            if (!response.ok) {
                throw new Error((data as any).error || 'Failed to upload file')
            }

            return {
                url: data.url,
                fileName: data.fileName,
                fileSize: data.fileSize,
                fileType: data.fileType,
                storagePath: data.storagePath,
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to upload file')
        },
    })
}

/**
 * Hook: Delete uploaded media
 */
export function useMediaDelete() {
    return useMutation({
        mutationFn: async (storagePath: string): Promise<void> => {
            const response = await fetch(
                `/api/twilio/media/upload?path=${encodeURIComponent(storagePath)}`,
                { method: 'DELETE' }
            )

            if (!response.ok) {
                throw new Error('Failed to delete file')
            }
        },
        onError: (error: Error) => {
            console.error('Failed to delete media:', error)
        },
    })
}

/**
 * Hook: Batch upload multiple files
 */
export function useBatchMediaUpload() {
    const uploadMutation = useMediaUpload()

    return useMutation({
        mutationFn: async (files: File[]): Promise<UploadedMedia[]> => {
            const results: UploadedMedia[] = []

            for (const file of files) {
                try {
                    const media = await uploadMutation.mutateAsync(file)
                    results.push(media)
                } catch (error) {
                    // Continue with other files, error already toasted
                    console.error(`Failed to upload ${file.name}:`, error)
                }
            }

            return results
        },
    })
}
