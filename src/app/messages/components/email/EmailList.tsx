'use client'

import { EmailRecord, EmailHistoryFilters } from '../../hooks/use-email-history'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Mail, MailOpen, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface EmailListProps {
    emails: EmailRecord[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasMore: boolean
    }
    isLoading: boolean
    filters: EmailHistoryFilters
    onFiltersChange: (filters: EmailHistoryFilters) => void
    onEmailClick: (email: EmailRecord) => void
}

export function EmailList({
    emails,
    pagination,
    isLoading,
    filters,
    onFiltersChange,
    onEmailClick
}: EmailListProps) {
    const handlePageChange = (newPage: number) => {
        onFiltersChange({ ...filters, page: newPage })
    }

    if (isLoading) {
        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Recipient</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="w-[120px]">Invoice #</TableHead>
                            <TableHead className="w-[150px]">Date</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    if (emails.length === 0) {
        return (
            <div className="rounded-md border p-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No emails found</h3>
                <p className="text-sm text-muted-foreground">
                    {filters.search || filters.status || filters.dateFrom
                        ? 'Try adjusting your filters to see more results.'
                        : 'Invoice emails will appear here once sent.'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Recipient</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="w-[120px]">Invoice #</TableHead>
                            <TableHead className="w-[150px]">Date</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {emails.map((email) => (
                            <TableRow
                                key={email.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => onEmailClick(email)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {email.status === 'sent' ? (
                                            <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">
                                                {email.recipient_name || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {email.recipient_email}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="truncate max-w-[300px]">{email.subject}</p>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-sm">
                                        {email.invoice_number}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <p>{format(new Date(email.sent_at), 'MMM d, yyyy')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={email.status === 'sent' ? 'default' : 'destructive'}
                                        className={email.status === 'sent' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : ''}
                                    >
                                        {email.status === 'sent' ? 'Sent' : 'Failed'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} emails
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={!pagination.hasMore}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
