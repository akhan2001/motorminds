'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { CustomerSearchBar } from '@/components/common/customers/customer-search-bar'
import { Customer } from '@/app/(features)/customers/types'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface NewConversationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shopId: string
    onSuccess: (customerPhone: string) => void
    onRefetch: () => void
}

export function NewConversationModal({
    open,
    onOpenChange,
    shopId,
    onSuccess,
    onRefetch,
}: NewConversationModalProps) {
    const [isCreating, setIsCreating] = useState(false)

    const handleCustomerSelect = async (customer: Customer) => {
        if (!customer.customer_phone?.trim()) {
            toast.error('This customer has no phone number. Add a phone number in their profile to start an SMS conversation.')
            return
        }

        setIsCreating(true)
        try {
            const res = await fetch('/api/twilio/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: customer.id }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                toast.error(data.error || 'Failed to create conversation')
                return
            }

            const phone = data.conversation?.customer_phone
            if (phone) {
                onRefetch()
                onSuccess(phone)
                onOpenChange(false)
                toast.success('Conversation opened')
            } else {
                toast.error('Invalid response from server')
            }
        } catch {
            toast.error('Failed to create conversation')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl !bg-white dark:!bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white shadow-xl">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-foreground dark:text-white">New conversation</DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-gray-400">
                        Search for a customer to start or open an SMS conversation. If a conversation already exists, it will open.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2 text-foreground dark:text-white">
                    <CustomerSearchBar
                        onSelect={handleCustomerSelect}
                        placeholder="Search by name, phone, or email..."
                        organizationWide={false}
                        showCreateOption={false}
                        disabled={isCreating}
                    />
                    {isCreating && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Opening conversation...
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
