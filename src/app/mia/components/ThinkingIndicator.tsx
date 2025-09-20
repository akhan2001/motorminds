'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Brain, Loader2 } from 'lucide-react'

interface ThinkingIndicatorProps {
    message?: string
}

export default function ThinkingIndicator({ message = "MIA is analyzing your request..." }: ThinkingIndicatorProps) {
    return (
        <div className="flex justify-start mb-6">
            <div className="max-w-4xl w-full">
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Brain className="h-5 w-5 text-blue-400 animate-pulse" />
                                <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-sm font-medium">
                                    {message}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span className="text-xs text-gray-400 ml-2">
                                        Processing diagnostic information...
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
