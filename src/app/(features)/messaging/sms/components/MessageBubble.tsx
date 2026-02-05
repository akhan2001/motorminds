'use client'

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SmsMessage } from '../../types/sms'

interface MessageBubbleProps {
    message: SmsMessage
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Media preview component for displaying images in messages
 */
function MessageMedia({ 
    mediaUrls, 
    isOutbound 
}: { 
    mediaUrls: string[]
    isOutbound: boolean 
}) {
    if (!mediaUrls || mediaUrls.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 mb-2">
            {mediaUrls.map((url, index) => (
                <Dialog key={index}>
                    <DialogTrigger asChild>
                        <button className="relative group cursor-pointer">
                            <img
                                src={url}
                                alt={`Media ${index + 1}`}
                                className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-border"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <span className="text-xs text-white">
                                    Click to enlarge
                                </span>
                            </div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
                        <VisuallyHidden>
                            <DialogTitle>Image preview</DialogTitle>
                        </VisuallyHidden>
                        <img
                            src={url}
                            alt={`Media ${index + 1}`}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        />
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    )
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isOutbound = message.direction === 'outbound'
    const hasMedia = message.media_urls && message.media_urls.length > 0

    return (
        <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm',
                    isOutbound
                        ? 'bg-red-600 text-white rounded-br-md'
                        : 'bg-muted text-foreground border border-border rounded-bl-md'
                )}
            >
                {hasMedia && (
                    <MessageMedia
                        mediaUrls={message.media_urls}
                        isOutbound={isOutbound}
                    />
                )}
                {message.message_body && (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.message_body}</p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 justify-end">
                    {message.message_type === 'mms' && (
                        <Image
                            className={cn(
                                'h-3 w-3',
                                isOutbound ? 'text-red-100' : 'text-muted-foreground'
                            )}
                        />
                    )}
                    <span
                        className={cn(
                            'text-[11px]',
                            isOutbound ? 'text-red-100' : 'text-muted-foreground'
                        )}
                    >
                        {formatTime(message.created_at)}
                    </span>
                </div>
            </div>
        </div>
    )
}
