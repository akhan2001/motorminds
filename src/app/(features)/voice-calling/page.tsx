// Main voice ordering page component
'use client'

import VoiceOrderingCard from './ordering/components/VoiceOrderingCard'
import VoiceSchedulingCard from './scheduling/components/VoiceSchedulingCard'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'

export default function VoiceCallingPage() {
    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Content container */}
                <div className="p-6 max-w-4xl mx-auto"> 
                    {/* Breadcrumb Navigation */}
                    <Breadcrumb className="mb-6">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-white">
                                    Voice Calling
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

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
                    <div className="grid md:grid-cols-2 gap-6">
                        <VoiceOrderingCard />
                        <VoiceSchedulingCard />
                    </div>
                </div>
            </div>
        </div>
    )
}