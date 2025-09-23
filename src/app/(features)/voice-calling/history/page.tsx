'use client'

import { Nav } from '@/app/components/nav'
import CallHistory from '@/app/(features)/voice-calling/components/CallHistory'

export default function CallHistoryPage() {
    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-auto">
                <div className="p-6 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Call History
                        </h1>
                        <p className="text-gray-400">
                            View all voice calls, transcripts, and analysis data
                        </p>
                    </div>

                    <CallHistory />
                </div>
            </div>
        </div>
    )
}
