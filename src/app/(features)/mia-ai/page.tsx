'use client'

import React from 'react'
import { Nav } from '@/app/components/nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../operations/hooks/use-auth'
import MiaPageHeader from './components/miaPageHeader'
import { miaFeatures } from './components/miaFeatures'

export default function MiaAiPage() {
    const router = useRouter()
    
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()
    
    // Loading state
    if (authLoading) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <div>
                                <p className="text-white font-medium">Loading Mia AI</p>
                                <p className="text-gray-400 text-sm">Initializing AI services...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Error state
    if (authError) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-white font-medium">Failed to Load Mia AI</p>
                                <p className="text-gray-400 text-sm mb-3">
                                    {authError && typeof authError === 'object' && 'message' in authError 
                                        ? (authError as Error).message 
                                        : 'Unknown error occurred'}
                                </p>
                                <Button 
                                    onClick={() => window.location.reload()}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    size="sm"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Authentication check
    if (!shopId || !user) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            <div>
                                <p className="text-white font-medium">Authentication Required</p>
                                <p className="text-gray-400 text-sm">
                                    Unable to access Mia AI. Please ensure you are logged in.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const handleCardClick = (href: string) => {
        router.push(href)
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            
            <MiaPageHeader />

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {miaFeatures.map((feature, index) => {
                            const IconComponent = feature.icon
                            return (
                                <Card 
                                    key={feature.title}
                                    className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-200 cursor-pointer group"
                                    onClick={() => handleCardClick(feature.href)}
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 ${feature.color} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                                                    <IconComponent className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-white text-lg group-hover:text-blue-400 transition-colors">
                                                        {feature.title}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${feature.color.replace('bg-', 'bg-')} text-white`}>
                                                            {feature.badge}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="pt-0">
                                        <CardDescription className="text-gray-400 mb-4 leading-relaxed">
                                            {feature.description}
                                        </CardDescription>
                                        
                                        <div className="space-y-2 mb-6">
                                            {feature.features.map((featureItem, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${feature.color}`} />
                                                    {featureItem}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <Button 
                                            className={`w-full ${feature.color} ${feature.hoverColor} text-white font-medium transition-all duration-200 group-hover:shadow-lg`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleCardClick(feature.href)
                                            }}
                                        >
                                            Access {feature.badge}
                                            <IconComponent className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
