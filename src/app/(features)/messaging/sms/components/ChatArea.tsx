'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MessageCircle } from 'lucide-react'
import { ChatHeader } from './ChatHeader'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { 
    useSmsMessages, 
    useSendSmsMessage, 
    useSmsMessagesRealtime 
} from '../../hooks/use-sms-messages'
import { useMediaUpload, useMediaDelete, validateMediaFile, MEDIA_CONSTRAINTS } from '../../hooks/use-sms-media'
import { toast } from 'sonner'
import type { SmsCustomer, SmsConversation, UploadedMedia } from '../../types/sms'

interface ChatAreaProps {
    shopId: string
    selectedPhone: string
    selectedCustomer: SmsCustomer | null
    conversations: SmsConversation[]
    onCustomerClick?: (customerId: string) => void
}

export function ChatArea({
    shopId,
    selectedPhone,
    selectedCustomer,
    conversations,
    onCustomerClick,
}: ChatAreaProps) {
    const [messageText, setMessageText] = useState('')
    const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Hooks
    const { data: messages = [], isLoading: isLoadingMessages } = useSmsMessages(shopId, selectedPhone)
    const sendMessageMutation = useSendSmsMessage(shopId)
    const uploadMutation = useMediaUpload()
    const deleteMutation = useMediaDelete()

    // Real-time updates
    useSmsMessagesRealtime(shopId, selectedPhone)

    // Scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // Handle file selection
    const handleFileSelect = async (files: FileList) => {
        if (uploadedMedia.length + files.length > MEDIA_CONSTRAINTS.MAX_ATTACHMENTS) {
            toast.error(`Maximum ${MEDIA_CONSTRAINTS.MAX_ATTACHMENTS} attachments allowed`)
            return
        }

        for (const file of Array.from(files)) {
            const validation = validateMediaFile(file)
            if (!validation.valid) {
                toast.error(validation.error)
                continue
            }

            try {
                const media = await uploadMutation.mutateAsync(file)
                setUploadedMedia((prev) => [...prev, media])
            } catch (error) {
                // Error already handled by mutation
            }
        }
    }

    // Handle media removal
    const handleRemoveMedia = async (index: number) => {
        const media = uploadedMedia[index]
        try {
            await deleteMutation.mutateAsync(media.storagePath)
        } catch (error) {
            // Silent fail, still remove from UI
        }
        setUploadedMedia((prev) => prev.filter((_, i) => i !== index))
    }

    // Handle send message
    const handleSend = async () => {
        if (!messageText.trim() && uploadedMedia.length === 0) return

        const mediaUrls = uploadedMedia.map((m) => m.url)
        const hasText = messageText.trim().length > 0
        const hasMedia = mediaUrls.length > 0

        console.log('💬 Sending message:', { hasText, hasMedia, textLength: messageText.length, mediaCount: mediaUrls.length })

        try {
            await sendMessageMutation.mutateAsync({
                to: selectedPhone,
                body: hasText ? messageText : undefined,
                customerName: selectedCustomer?.customer_name,
                mediaUrls: hasMedia ? mediaUrls : undefined,
            })

            // Clear form on success
            setMessageText('')
            setUploadedMedia([])
        } catch (error) {
            // Error already handled by mutation's onError
            console.error('Send message failed:', error)
        }
    }

    // Empty state
    if (!selectedPhone) {
        return (
            <Card className="bg-card border border-border rounded-xl h-full flex flex-col">
                <CardContent className="flex-1 flex items-center justify-center min-h-[320px] p-8">
                    <div className="text-center max-w-sm">
                        <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                            <MessageCircle className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-1">
                            Select a conversation
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Choose a conversation from the list to view and send messages.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card border border-border rounded-xl h-full flex flex-col overflow-hidden">
            <ChatHeader
                selectedPhone={selectedPhone}
                customer={selectedCustomer}
                conversations={conversations}
                onCustomerClick={onCustomerClick}
            />
            <Separator className="bg-border" />

            {/* Messages - scrollable area with proper flex */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="p-4 space-y-3 max-w-3xl mx-auto">
                    {isLoadingMessages ? (
                        <div className="space-y-3 py-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-start">
                                    <div className="h-14 w-3/4 max-w-xs rounded-2xl bg-muted animate-pulse" />
                                </div>
                            ))}
                            <div className="flex justify-end">
                                <div className="h-12 w-48 rounded-2xl bg-muted animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <MessageBubble key={message.id} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 border-t border-border bg-muted/30">
                <MessageInput
                    value={messageText}
                    onChange={setMessageText}
                    onSend={handleSend}
                    onFileSelect={handleFileSelect}
                    uploadedMedia={uploadedMedia}
                    onRemoveMedia={handleRemoveMedia}
                    isLoading={sendMessageMutation.isPending}
                    isUploading={uploadMutation.isPending}
                />
            </div>
        </Card>
    )
}
