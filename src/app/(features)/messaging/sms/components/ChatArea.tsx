'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
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

        await sendMessageMutation.mutateAsync({
            to: selectedPhone,
            body: messageText,
            customerName: selectedCustomer?.customer_name,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        })

        // Clear form on success
        setMessageText('')
        setUploadedMedia([])
    }

    // Empty state
    if (!selectedPhone) {
        return (
            <Card className="bg-slate-50 dark:bg-card border-border h-full">
                <CardContent className="flex-1 flex items-center justify-center h-full">
                    <div className="text-center">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Select a Conversation
                        </h3>
                        <p className="text-muted-foreground">
                            Choose a conversation from the sidebar to start messaging
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-slate-50 dark:bg-card border-border h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0">
                <ChatHeader
                    selectedPhone={selectedPhone}
                    customer={selectedCustomer}
                    conversations={conversations}
                    onCustomerClick={onCustomerClick}
                />
                <Separator className="bg-border" />
            </div>

            {/* Messages - scrollable area */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-4 p-4">
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

            {/* Input - fixed at bottom */}
            <div className="flex-shrink-0 border-t border-border">
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
