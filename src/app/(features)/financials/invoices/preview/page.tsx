'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Nav } from '@/app/components/nav'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { useInvoice } from '../../hooks/use-invoices'
import { useShopInfo } from '@/hooks/core/useShopInfo'
import { useAuth } from '../../../operations/hooks/use-auth'
import { TonyTemplatePreview } from '../../components/invoice-preview/TonyTemplatePreview'

function PreviewContent() {
    const searchParams = useSearchParams()
    const invoiceId = searchParams?.get('id') || null
    const { shopId, isLoading: isAuthLoading } = useAuth()
    const { data: invoice, isLoading: isInvoiceLoading, error: invoiceError } = useInvoice(invoiceId || '')
    const { data: shopInfo, isLoading: isShopLoading } = useShopInfo()

    if (isAuthLoading || !shopId) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center p-4">
                    <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    if (!invoiceId) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center p-4">
                    <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                        <div className="flex flex-col items-center justify-center text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                                Invoice ID Required
                            </h3>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm">
                                Please provide an invoice ID in the URL query parameter (e.g., ?id=INV-123)
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    if (isInvoiceLoading || isShopLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center p-4">
                    <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    if (invoiceError || !invoice) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center p-4">
                    <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                        <div className="flex flex-col items-center justify-center text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                                Error Loading Invoice
                            </h3>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm">
                                {invoiceError instanceof Error ? invoiceError.message : 'Failed to load invoice details'}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    if (!shopInfo) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center p-4">
                    <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                        <div className="flex flex-col items-center justify-center text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                                Shop Information Missing
                            </h3>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm">
                                Unable to load shop information
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Nav />
            <div className="container mx-auto py-8 px-4">
                <div 
                    className="mx-auto bg-white shadow-lg"
                    style={{ 
                        width: '210mm',
                        height: '297mm',
                        padding: '12px',
                        boxSizing: 'border-box'
                    }}
                >
                    <TonyTemplatePreview invoice={invoice} shop={shopInfo} />
                </div>
            </div>
        </div>
    )
}

export default function PreviewPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        }>
            <PreviewContent />
        </Suspense>
    )
}

