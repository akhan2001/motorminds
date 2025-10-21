'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshCw, FileText, DollarSign } from 'lucide-react'
import { useStagingInvoices } from '../hooks/use-migrations-data'
import { StagingFilters } from '../lib/migrations-service'

export default function StagingInvoicesTable() {
    const filters: StagingFilters = {
        limit: 100
    }

    const { data: invoices, isLoading, error, refetch } = useStagingInvoices(filters)

    const getStatusBadge = (status: string | null) => {
        const statusMap = {
            pending: { label: 'Pending', color: 'bg-gray-600' },
            matched: { label: 'Matched', color: 'bg-green-600' },
            invalid: { label: 'Invalid', color: 'bg-red-600' },
            migrated: { label: 'Migrated', color: 'bg-blue-600' }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap] || { label: 'Unknown', color: 'bg-gray-600' }
        return (
            <Badge className={`${statusInfo.color} text-white text-xs`}>
                {statusInfo.label}
            </Badge>
        )
    }

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return 'N/A'
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD'
        }).format(amount)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString()
    }

    if (isLoading) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Staging Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-gray-700 rounded animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Staging Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-red-400 mb-4">Error loading invoices</p>
                        <Button onClick={() => refetch()} variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Staging Invoices ({invoices?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Table */}
                {invoices && invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-[#2a2a2a]">
                                    <TableHead className="text-gray-300">Invoice #</TableHead>
                                    <TableHead className="text-gray-300">Date</TableHead>
                                    <TableHead className="text-gray-300">Total</TableHead>
                                    <TableHead className="text-gray-300">Status</TableHead>
                                    <TableHead className="text-gray-300">Customer</TableHead>
                                    <TableHead className="text-gray-300">Batch ID</TableHead>
                                    <TableHead className="text-gray-300">Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice) => (
                                    <TableRow key={invoice.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                                        <TableCell className="text-white font-medium">
                                            {invoice.invoice_number || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {formatDate(invoice.invoice_date)}
                                        </TableCell>
                                        <TableCell className="text-white font-medium">
                                            <div className="flex items-center">
                                                <DollarSign className="h-4 w-4 mr-1 text-green-400" />
                                                {formatCurrency(invoice.total_amount)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(invoice.import_status)}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {invoice.customer_id ? (
                                                <Badge className="bg-green-600 text-white text-xs">
                                                    Matched
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-gray-600 text-white text-xs">
                                                    Unmatched
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-sm">
                                            {invoice.import_batch_id || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-sm">
                                            {formatDate(invoice.created_at)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No staging invoices found</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
