'use client'

import { Suspense } from "react"
import { PageLoading } from "@/components/common/feedback/page-states"
import { SecondaryPageHeader } from "@/components/common/feedback/SecondaryPageHeader"
import { ScaffoldContainer } from "@/components/layout"
import { ArchivedInvoicesTable } from "../../components/invoices/archived/ArchivedInvoicesTable"

function ArchivedInvoicesContent() {
    return (
        <div className="h-full flex flex-col bg-background">
            <SecondaryPageHeader
                title="Archived Invoices"
                description="View historical archived invoices"
                backHref="/financials/invoices"
            />
            <div className="flex-1 overflow-auto">
                <ScaffoldContainer size="large" className="py-6">
                    <ArchivedInvoicesTable />
                </ScaffoldContainer>
            </div>
        </div>
    )
}

// Main component with Suspense wrapper
export default function ArchivedInvoicesPage() {
    return (
        <Suspense fallback={<PageLoading title="Loading Archived Invoices" spinnerColor="text-red-500" />}>
            <ArchivedInvoicesContent />
        </Suspense>
    )
}
