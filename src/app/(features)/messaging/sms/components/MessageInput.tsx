'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, Loader2 } from 'lucide-react'
import { MediaUploadPreview } from './MediaUploadPreview'
import { MEDIA_CONSTRAINTS } from '../../hooks/use-sms-media'
import type { UploadedMedia } from '../../types/sms'

interface MessageInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    onFileSelect: (files: FileList) => void
    uploadedMedia: UploadedMedia[]
    onRemoveMedia: (index: number) => void
    isLoading?: boolean
    isUploading?: boolean
    disabled?: boolean
}

export function MessageInput({
    value,
    onChange,
    onSend,
    onFileSelect,
    uploadedMedia,
    onRemoveMedia,
    isLoading = false,
    isUploading = false,
    disabled = false,
}: MessageInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const canSend = !disabled && (value.trim() || uploadedMedia.length > 0)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (canSend) {
                onSend()
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files)
            // Reset input
            e.target.value = ''
        }
    }

    return (
        <div className="p-4">
            {/* Media preview */}
            <MediaUploadPreview
                media={uploadedMedia}
                onRemove={onRemoveMedia}
                isUploading={isUploading}
            />

            <div className="flex gap-2">
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={MEDIA_CONSTRAINTS.ALLOWED_TYPES.join(',')}
                    multiple
                    className="hidden"
                />

                {/* Attach button */}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-end"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || uploadedMedia.length >= MEDIA_CONSTRAINTS.MAX_ATTACHMENTS}
                >
                    <Paperclip className="h-4 w-4" />
                </Button>

                {/* Message textarea */}
                <Textarea
                    placeholder="Type your message..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-white dark:bg-background border-border text-foreground resize-none flex-1"
                    rows={2}
                    disabled={disabled}
                />

                {/* Send button */}
                <Button
                    onClick={onSend}
                    disabled={!canSend || isLoading}
                    size="sm"
                    className="self-end bg-red-600 hover:bg-red-700 text-white"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Helper text */}
            <p className="text-xs text-muted-foreground mt-1">
                {uploadedMedia.length > 0 &&
                    `${uploadedMedia.length} attachment${uploadedMedia.length > 1 ? 's' : ''} • `}
                Press Enter to send, Shift+Enter for new line
            </p>
        </div>
    )
}
