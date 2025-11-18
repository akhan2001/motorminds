// src/app/(features)/ai/AIDiagnostics/components/AIDiagnosticsPanel.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import type { Message as AIMessage } from 'ai'
import { DiagnosticsForm } from './DiagnosticsForm'
import { MotorToolDisplay, isMotorTool } from './MotorToolDisplay'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIDiagnosticsPanelProps {
    workOrderId?: string
    vehicleId?: number
    baseVehicleId?: number
    dtcCodes?: string[]
    reportedIssue?: string
    className?: string
    onClose?: () => void
}

export function AIDiagnosticsPanel({
    workOrderId,
    vehicleId,
    baseVehicleId,
    dtcCodes = [],
    reportedIssue,
    className = '',
    onClose
}: AIDiagnosticsPanelProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    // Build initial message with context
    const initialMessage = React.useMemo(() => {
        if (!reportedIssue && dtcCodes.length === 0 && !baseVehicleId) {
            return undefined
        }

        let contextParts: string[] = []

        if (reportedIssue) {
            contextParts.push(`Customer reported: ${reportedIssue}`)
        }

        if (dtcCodes.length > 0) {
            contextParts.push(`DTC codes: ${dtcCodes.join(', ')}`)
        }

        if (baseVehicleId) {
            contextParts.push(`Base Vehicle ID: ${baseVehicleId}`)
        }

        if (contextParts.length > 0) {
            return {
                id: 'initial-context',
                role: 'user' as const,
                content: `I need help diagnosing this issue:\n\n${contextParts.join('\n')}`
            }
        }

        return undefined
    }, [reportedIssue, dtcCodes, baseVehicleId])

    // useChat hook for AI streaming
    const {
        messages,
        input,
        setInput,
        handleSubmit,
        isLoading,
        stop,
        append
    } = useChat({
        api: '/api/ai/diagnostics',
        body: {
            workOrderId,
            selectedVehicleId: vehicleId,
            baseVehicleId
        },
        initialMessages: initialMessage ? [initialMessage] : [],
        onError: (error) => {
            console.error('AI Diagnostics error:', error)
        }
    })

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleFormSubmit = (message: string) => {
        console.log('[AI Diagnostics] Submitting message:', message)
        console.log('[AI Diagnostics] Current messages count:', messages.length)
        console.log('[AI Diagnostics] append available:', typeof append)
        
        // Use append if available (AI SDK v5+)
        if (append && typeof append === 'function') {
            console.log('[AI Diagnostics] Using append()')
            append({ role: 'user', content: message })
        } else {
            console.log('[AI Diagnostics] Using fallback setInput + handleSubmit')
            // Fallback: use setInput + handleSubmit
            if (setInput && typeof setInput === 'function') {
                setInput(message)
                setTimeout(() => {
                    if (handleSubmit) {
                        handleSubmit(new Event('submit') as any)
                    }
                }, 0)
            }
        }
    }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-[#0a0a0a] ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#222222] bg-gray-50 dark:bg-[#131313] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-600 dark:text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Diagnostics</h2>
          </div>
          {onClose && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-[#222222] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {workOrderId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Work Order: {workOrderId}</p>
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800"
      >
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mb-2">
            Messages: {messages.length} | Loading: {isLoading ? 'Yes' : 'No'}
          </div>
        )}
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-12 h-12 text-red-600 dark:text-red-500 mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              AI-Powered Diagnostics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              Describe the vehicle issue, provide DTC codes, or ask diagnostic questions. 
              The AI will help analyze the problem and provide repair guidance.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 max-w-md text-left">
              <ExamplePrompt onClick={() => handleFormSubmit("What does DTC P0420 mean?")}>
                What does DTC P0420 mean?
              </ExamplePrompt>
              <ExamplePrompt onClick={() => handleFormSubmit("Customer reports rough idle and check engine light")}>
                Customer reports rough idle and check engine light
              </ExamplePrompt>
              <ExamplePrompt onClick={() => handleFormSubmit("How do I diagnose a misfire on cylinder 3?")}>
                How do I diagnose a misfire on cylinder 3?
              </ExamplePrompt>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageDisplay key={message.id} message={message} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#222222] bg-gray-50 dark:bg-[#131313] p-4">
        <DiagnosticsForm
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          onStop={stop}
        />
      </div>
        </div>
    )
}

// Message Display Component
function MessageDisplay({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'bg-red-600 dark:bg-red-600 text-white' : 'bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-100'} rounded-lg px-4 py-3`}>
        {/* User Message */}
        {isUser && (
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        )}

        {/* Assistant Message */}
        {isAssistant && (
          <div className="space-y-2">
            {/* Text Content */}
            {message.content && (
              <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                {message.content}
              </div>
            )}

                        {/* Tool Calls */}
                        {message.toolInvocations?.map((tool: any, idx: number) => (
                            isMotorTool(tool.toolName) && (
                                <MotorToolDisplay
                                    key={idx}
                                    toolName={tool.toolName}
                                    input={tool.args}
                                    output={tool.result}
                                    state={tool.state}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Example Prompt Button
function ExamplePrompt({ 
  onClick, 
  children 
}: { 
  onClick: () => void
  children: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      className="text-left text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded px-3 py-2 transition-colors"
    >
      {children}
    </button>
  )
}

