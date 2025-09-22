// Main voice ordering page component
'use client'

import { Nav } from '@/app/components/nav'
import VoiceOrderingCard from './components/VoiceOrderingCard'

export default function VoiceCallingPage() {
    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Content container */}
                <div className="p-6 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Voice Calling Hub
                        </h1>
                        <p className="text-gray-400 text-lg">
                            AI-powered voice automation for automotive services
                        </p>
                    </div>

                    {/* Voice Services Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                        <VoiceOrderingCard />
                    </div>
                </div>
            </div>
        </div>
    )
}