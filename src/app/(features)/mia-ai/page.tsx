'use client'

import React from 'react'
//import { Nav } from '@/app/components/nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUnifiedAuth } from '@/contexts/unified-auth-context'
import MiaPageHeader from './components/miaPageHeader'
import { miaFeatures } from './components/miaFeatures'

function MiaAiPage() {
    const router = useRouter()
    
    // Authentication
    const { user, shopInfo, isLoading: authLoading } = useUnifiedAuth()
    const shopId = shopInfo?.id
    
    // withAuth HOC handles authentication - this component only renders when authenticated

    const handleCardClick = (href: string) => {
        router.push(href)
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* <Nav /> */}
            
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
                                    className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] hover:border-accent dark:hover:border-[#3a3a3a] transition-all duration-200 cursor-pointer group"
                                    onClick={() => handleCardClick(feature.href)}
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 ${feature.color} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                                                    <IconComponent className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-foreground dark:text-white text-lg group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                                        {feature.title}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${feature.color} text-white`}>
                                                            {feature.badge}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="pt-0">
                                        <CardDescription className="text-muted-foreground dark:text-gray-400 mb-4 leading-relaxed">
                                            {feature.description}
                                        </CardDescription>
                                        
                                        <div className="space-y-2 mb-6">
                                            {feature.features.map((featureItem, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-foreground dark:text-gray-300">
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

export default MiaAiPage
