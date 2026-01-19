'use client'

import { X, Loader2 } from 'lucide-react'
import type { UploadedMedia } from '../../types/sms'

interface MediaUploadPreviewProps {
    media: UploadedMedia[]
    onRemove: (index: number) => void
    isUploading?: boolean
}

export function MediaUploadPreview({
    media,
    onRemove,
    isUploading = false,
}: MediaUploadPreviewProps) {
    if (media.length === 0 && !isUploading) return null

    return (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/50 rounded-lg">
            {media.map((item, index) => (
                <div key={index} className="relative group">
                    <img
                        src={item.url}
                        alt={item.fileName}
                        className="w-16 h-16 object-cover rounded-lg border border-border"
                    />
                    <button
                        onClick={() => onRemove(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}

            {isUploading && (
                <div className="w-16 h-16 flex items-center justify-center bg-muted rounded-lg border border-border">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    )
}
