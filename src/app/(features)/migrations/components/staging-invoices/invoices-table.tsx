'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    FileText, 
    Calendar, 
    DollarSign, 
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react'
import { useStagingInvoicesByCustomer } from '../../hooks/use-staging-invoices'
import { StagingCustomer } from '../../types/staging-invoices'
import { InvoicesCard } from './invoices-card'

interface InvoicesTableProps {
    selectedCustomer: StagingCustomer | null
}

export function InvoicesTable({ selectedCustomer }: InvoicesTableProps) {
    const { data: invoices = [], isLoading, error } = useStagingInvoicesByCustomer(selectedCustomer?.id || '')

    if (!selectedCustomer) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Customer Selected</h3>
                    <p className="text-gray-400">Select a customer to view their staging invoices</p>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Error Loading Invoices</h3>
                    <p className="text-red-400">Failed to load staging invoices for this customer</p>
                </CardContent>
            </Card>
        )
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="h-4 w-4 text-green-400" />
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-400" />
            case 'migrated':
                return <CheckCircle className="h-4 w-4 text-blue-400" />
            default:
                return <Clock className="h-4 w-4 text-yellow-400" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-600 text-white">Approved</Badge>
            case 'rejected':
                return <Badge className="bg-red-600 text-white">Rejected</Badge>
            case 'migrated':
                return <Badge className="bg-blue-600 text-white">Migrated</Badge>
            default:
                return <Badge className="bg-yellow-600 text-white">Pending</Badge>
        }
    }

    if (isLoading) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Staging Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border border-[#2a2a2a] rounded-lg">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (invoices.length === 0) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Staging Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Invoices Found</h3>
                    <p className="text-gray-400">This customer has no staging invoices</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Staging Invoices ({invoices.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.map((invoice) => (
                        <InvoicesCard key={invoice.id} invoice={invoice} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
