'use client'

import { Suspense } from "react"
// import { Nav } from "@/app/components/nav"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/common/feedback/loading-states"
import { ArchivedInvoicesTable } from "../../components/invoices/archived/ArchivedInvoicesTable"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

function ArchivedInvoicesContent() {
    const router = useRouter()

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* <Nav /> */}
            <div className="flex-1 flex flex-col ">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Button variant="ghost" size="icon" onClick={() => router.push('/financials/invoices')} className="-ml-2">
                                            <ArrowLeft className="h-5 w-5" />
                                        </Button>
                                        <h1 className="text-3xl font-bold text-foreground dark:text-white">
                                            Archived Invoices
                                        </h1>
                                    </div>
                                    <p className="text-muted-foreground dark:text-gray-400 ml-11">
                                        View historical archived invoices
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Invoices Table */}
                        <ArchivedInvoicesTable />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Loading component for Suspense fallback
function ArchivedInvoicesLoading() {
    return (
        <div className="h-screen flex flex-col bg-background">
            {/* <Nav /> */}
            <div className="flex-1 flex items-center justify-center">
                <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                    <CardContent className="flex items-center gap-4 p-6">
                        <LoadingSpinner size="md" className="text-red-500" />
                        <div>
                            <p className="text-foreground dark:text-white font-medium">Loading Archived Invoices</p>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm">Please wait...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Main component with Suspense wrapper
export default function ArchivedInvoicesPage() {
    return (
        <Suspense fallback={<ArchivedInvoicesLoading />}>
            <ArchivedInvoicesContent />
        </Suspense>
    )
}
