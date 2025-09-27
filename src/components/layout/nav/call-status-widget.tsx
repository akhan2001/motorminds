"use client"

import { useCallStatus } from '@/hooks/useCallStatus'
import { useState, useEffect } from 'react'

interface CallStatusWidgetProps {
    callId: string | null
    onCallComplete?: (analysis: any) => void
    onCallFailed?: (error: string) => void
}

export function CallStatusWidget({ callId, onCallComplete, onCallFailed }: CallStatusWidgetProps) {
    const { status, isLoading, isCompleted, isFailed, hasAnalysis, isConnected } = useCallStatus(callId)

    useEffect(() => {
        if (isCompleted && hasAnalysis && onCallComplete) {
            onCallComplete(status?.analysis)
        }
    }, [isCompleted, hasAnalysis, status?.analysis, onCallComplete])

    useEffect(() => {
        if (isFailed && onCallFailed) {
            onCallFailed(status?.error || 'Unknown error')
        }
    }, [isFailed, status?.error, onCallFailed])

    if (!callId) return null

    return (
        <div className="border rounded-lg p-4 bg-[#0d0d0d] border-[#1f1f1f]">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">Call Status</h3>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-400">{isConnected ? 'Live' : 'Polling'}</span>
                </div>
            </div>

            {isLoading && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                        <span className="text-white">Call in progress...</span>
                    </div>
                    <p className="text-sm text-gray-400">Status: {status?.status || 'Starting...'}</p>
                </div>
            )}

            {isCompleted && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400">
                        <span>✅</span>
                        <span className="text-white">Call completed successfully</span>
                    </div>
                    {status?.duration && (
                        <p className="text-sm text-gray-400">
                            Duration: {Math.round(status.duration / 60)}m {status.duration % 60}s
                        </p>
                    )}
                </div>
            )}

            {isFailed && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-400">
                        <span>❌</span>
                        <span className="text-white">Call failed</span>
                    </div>
                    <p className="text-sm text-gray-400">Reason: {status?.endedReason || 'Unknown'}</p>
                </div>
            )}
        </div>
    )
}
