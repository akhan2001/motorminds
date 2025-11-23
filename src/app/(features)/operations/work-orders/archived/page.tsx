'use client'

import { Suspense } from "react"
import { Nav } from "@/app/components/nav"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/common/feedback/loading-states"
import { ArchivedWorkOrdersList } from "../../components/work-orders/archived/ArchivedWorkOrdersList"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

function ArchivedWorkOrdersContent() {
    const router = useRouter()

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Button variant="ghost" size="icon" onClick={() => router.push('/operations/work-orders')} className="-ml-2">
                                            <ArrowLeft className="h-5 w-5" />
                                        </Button>
                                        <h1 className="text-3xl font-bold text-foreground dark:text-white">
                                            Archived Work Orders
                                        </h1>
                                    </div>
                                    <p className="text-muted-foreground dark:text-gray-400 ml-11">
                                        View historical archived work orders
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Work Orders List */}
                        <ArchivedWorkOrdersList />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Loading component for Suspense fallback
function ArchivedWorkOrdersLoading() {
    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex items-center justify-center">
                <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                    <CardContent className="flex items-center gap-4 p-6">
                        <LoadingSpinner size="md" className="text-red-500" />
                        <div>
                            <p className="text-foreground dark:text-white font-medium">Loading Archived Work Orders</p>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm">Please wait...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Main component with Suspense wrapper
export default function ArchivedWorkOrdersPage() {
    return (
        <Suspense fallback={<ArchivedWorkOrdersLoading />}>
            <ArchivedWorkOrdersContent />
        </Suspense>
    )
}
