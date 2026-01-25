'use client'

import { useState } from 'react'
import { useEmailHistory, EmailRecord, EmailHistoryFilters } from '../../hooks/use-email-history'
import { EmailStats } from './EmailStats'
import { EmailFilters } from './EmailFilters'
import { EmailList } from './EmailList'
import { EmailDetailSheet } from './EmailDetailSheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, AlertCircle } from 'lucide-react'

export function EmailDashboard() {
    const [filters, setFilters] = useState<EmailHistoryFilters>({
        page: 1,
        limit: 20
    })
    const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const { data, isLoading, error } = useEmailHistory(filters)

    const handleEmailClick = (email: EmailRecord) => {
        setSelectedEmail(email)
        setIsDetailOpen(true)
    }

    const handleFiltersChange = (newFilters: EmailHistoryFilters) => {
        setFilters(newFilters)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Email History
                    </h2>
                    <p className="text-muted-foreground">
                        View and track all invoice emails sent
                    </p>
                </div>
            </div>

            {/* Stats */}
            <EmailStats />

            {/* Main Content */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Sent Emails</CardTitle>
                    <CardDescription>
                        Browse all invoice emails sent to customers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <EmailFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                    />

                    {/* Error State */}
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Failed to load email history. Please try again.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Email List */}
                    <EmailList
                        emails={data?.emails || []}
                        pagination={data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false }}
                        isLoading={isLoading}
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onEmailClick={handleEmailClick}
                    />
                </CardContent>
            </Card>

            {/* Email Detail Sheet */}
            <EmailDetailSheet
                email={selectedEmail}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    )
}
