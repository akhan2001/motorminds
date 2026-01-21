'use client'

import { Suspense } from "react"
import { PageLoading } from "@/components/common/feedback/page-states"
import { SecondaryPageHeader } from "@/components/common/feedback/SecondaryPageHeader"
import { ScaffoldContainer } from "@/components/layout"
import { ArchivedWorkOrdersList } from "../../components/work-orders/archived/ArchivedWorkOrdersList"

function ArchivedWorkOrdersContent() {
    return (
        <div className="h-full flex flex-col bg-background">
            <SecondaryPageHeader
                title="Archived Work Orders"
                description="View historical archived work orders"
                backHref="/operations/work-orders"
            />
            <div className="flex-1 overflow-auto">
                <ScaffoldContainer size="large" className="py-6">
                    <ArchivedWorkOrdersList />
                </ScaffoldContainer>
            </div>
        </div>
    )
}

// Main component with Suspense wrapper
export default function ArchivedWorkOrdersPage() {
    return (
        <Suspense fallback={<PageLoading title="Loading Archived Work Orders" />}>
            <ArchivedWorkOrdersContent />
        </Suspense>
    )
}
