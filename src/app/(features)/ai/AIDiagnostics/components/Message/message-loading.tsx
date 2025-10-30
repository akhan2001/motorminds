"use client"

/**
 * Message Loading Component
 * 
 * Displays a loading animation while MIA is processing and generating a response.
 * Shows a typing indicator with animated dots.
 * 
 * @component
 */
export function MessageLoading() {
    return (
        <div className="flex justify-start">
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                    {/* Typing Indicator */}
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                    </div>
                    
                    {/* Loading Text */}
                    <span className="text-sm text-gray-400">
                        MIA is analyzing...
                    </span>
                </div>
            </div>
        </div>
    )
}

