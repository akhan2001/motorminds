'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ChatHeaderProps {
    cartCount: number
    cartVisible: boolean
    onToggleCart: () => void
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    cartCount,
    cartVisible,
    onToggleCart
}) => {
    return (
        <div>
            {/* Work in Progress Banner */}
            <div className="bg-yellow-500/10 border-b border-yellow-500 p-4">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <p className="text-yellow-500 text-sm">
                        This feature is still in development. AI Calling will be abit slower than the rest of the features.
                    </p>
                </div>
            </div>
            <div className="border-b border-[#2a2a2a] p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#b22222] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">M</span>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Mia AI</h3>
                            <p className="text-[#979797] text-xs">Parts Advisor</p>
                        </div>
                    </div>
                    {cartCount > 0 && (
                        <button
                            onClick={onToggleCart}
                            className="px-3 py-1 bg-[#b22222] hover:bg-[#a01e1e] text-white text-xs rounded transition-colors"
                        >
                            Cart ({cartCount})
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
