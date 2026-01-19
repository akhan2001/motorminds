'use client'

import { EmailRecord } from '../../hooks/use-email-history'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { Mail, User, Calendar, FileText, Hash } from 'lucide-react'

interface EmailDetailSheetProps {
    email: EmailRecord | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EmailDetailSheet({ email, open, onOpenChange }: EmailDetailSheetProps) {
    if (!email) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-white dark:bg-[#0a0a0a] border-border dark:border-[#222222] w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg">Email Details</SheetTitle>
                        <Badge
                            variant={email.status === 'sent' ? 'default' : 'destructive'}
                            className={email.status === 'sent' ? 'bg-emerald-500/10 text-emerald-600' : ''}
                        >
                            {email.status === 'sent' ? 'Sent' : 'Failed'}
                        </Badge>
                    </div>
                    <SheetDescription className="text-xs">
                        Sent via Resend • ID: {email.email_provider_id || 'N/A'}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Recipient Info */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Recipient
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                            <p className="font-medium">{email.recipient_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{email.recipient_email}</p>
                        </div>
                    </div>

                    {/* Invoice & Date Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Invoice
                            </h4>
                            <p className="font-mono text-sm">{email.invoice_number}</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Sent At
                            </h4>
                            <p className="text-sm">
                                {format(new Date(email.sent_at), 'MMM d, yyyy h:mm a')}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Subject */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Subject
                        </h4>
                        <p className="text-sm font-medium">{email.subject}</p>
                    </div>

                    {/* Email Body */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Message Body
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                            {email.body ? (
                                <div 
                                    className="prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: email.body }}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    No message body available
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
