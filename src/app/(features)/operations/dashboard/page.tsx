'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/feedback/loading-states'

export default function DashboardPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to appointments as the default dashboard
        router.replace('/operations/appointments')
    }, [router])

    // Show loading state while redirecting
    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <div className="flex-1 flex items-center justify-center">
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardContent className="flex items-center gap-4 p-6">
                        <LoadingSpinner size="md" className="text-blue-500" />
                        <Calendar className="h-6 w-6 text-blue-400" />
                        <div>
                            <p className="text-white font-medium">Loading Dashboard</p>
                            <p className="text-gray-400 text-sm">Redirecting to appointments calendar...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
