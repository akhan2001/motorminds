// src/app/(features)/ai/AIDiagnostics/components/DiagnosticsForm.tsx
'use client'

import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Send, StopCircle } from 'lucide-react'

interface DiagnosticsFormProps {
    onSubmit: (message: string) => void
    isLoading: boolean
    onStop?: () => void
    disabled?: boolean
    placeholder?: string
}

export function DiagnosticsForm({
    onSubmit,
    isLoading,
    onStop,
    disabled = false,
    placeholder = "Describe the vehicle issue or ask a diagnostic question..."
}: DiagnosticsFormProps) {
    const [input, setInput] = React.useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [input])

    // Focus on mount
    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (input.trim() && !isLoading && !disabled) {
            onSubmit(input)
            setInput('')
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const handleStop = () => {
        onStop?.()
    }

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] p-2">
                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || isLoading}
                    rows={1}
                    className="flex-1 resize-none bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 min-h-[40px] max-h-[200px] overflow-y-auto"
                    style={{ scrollbarWidth: 'thin' }}
                />

                {/* Submit/Stop Button */}
                <div className="flex-shrink-0 pb-1">
                    {isLoading ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
              onClick={handleStop}
              className="h-8 w-8 p-0 rounded-full"
              disabled={!onStop}
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || disabled}
              className="h-8 w-8 p-0 rounded-full bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 text-white"
            >
              <Send className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Helper Text */}
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between px-1">
                <span>
                    Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#3a3a3a] text-[10px]">Enter</kbd> to send,
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#3a3a3a] text-[10px] ml-1">Shift + Enter</kbd> for new line
                </span>
                <span className="text-[10px]">
                    {input.length} / 2000
                </span>
            </div>
        </form>
    )
}

