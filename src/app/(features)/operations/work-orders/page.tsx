'use client'

import { Suspense } from 'react'
import { WorkOrdersPageContent } from './WorkOrdersPageContent'

/**
 * Loading component for Suspense fallback
 */
function WorkOrdersLoading() {
    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="flex-1 flex items-center justify-center">
                <div className="text-foreground">Loading...</div>
            </div>
        </div>
    )
}

/**
 * Work Orders Page
 * Main page component that wraps the content in Suspense
 */
export default function WorkOrdersPage() {
    return (
        <Suspense fallback={<WorkOrdersLoading />}>
            <WorkOrdersPageContent />
        </Suspense>
    )
}