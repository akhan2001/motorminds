import { Wrench, AlertTriangle, FileText, Eye, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { ButtonTooltip } from '../../../../components/ui/ButtonTooltip'
import { DiagnosticMessage, DiagnosticReference, DiagnosticVisualAid } from './MiaDiagnostics.types'
import { Reasoning } from './elements/Reasonings'

interface DiagnosticMessageProps {
    id: string
    message: DiagnosticMessage
    isLoading: boolean
    readOnly?: boolean
    onDelete?: (id: string) => void
    onEdit?: (id: string) => void
    isAfterEditedMessage?: boolean
    isBeingEdited?: boolean
    onCancelEdit?: () => void
}

const DiagnosticReferences = ({ references }: { references: DiagnosticReference[] }) => {
    if (!references || references.length === 0) return null

    const getSourceIcon = (source: DiagnosticReference['source']) => {
        switch (source) {
            case 'service_manual':
                return <FileText size={14} />
            case 'tsb':
                return <AlertTriangle size={14} />
            case 'oem_bulletin':
                return <Wrench size={14} />
            case 'repair_guide':
                return <FileText size={14} />
            case 'perplexity':
                return <ExternalLink size={14} />
            default:
                return <FileText size={14} />
        }
    }

    const getSourceLabel = (source: DiagnosticReference['source']) => {
        switch (source) {
            case 'service_manual':
                return 'Service Manual'
            case 'tsb':
                return 'Technical Service Bulletin'
            case 'oem_bulletin':
                return 'OEM Bulletin'
            case 'repair_guide':
                return 'Repair Guide'
            case 'perplexity':
                return 'Web Source'
            default:
                return 'Reference'
        }
    }

    return (
        <div className="mt-4 border border-[#444444] rounded-lg bg-[#1a1a1a] p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <FileText size={16} />
                References & Sources
            </h4>
            <div className="space-y-3">
                {references.map((ref) => (
                    <div key={ref.id} className="border border-[#333333] rounded-md p-3 bg-[#222222]">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                {getSourceIcon(ref.source)}
                                <span>{getSourceLabel(ref.source)}</span>
                                {ref.relevanceScore && (
                                    <span className="text-xs text-green-400">
                                        {Math.round(ref.relevanceScore * 100)}% relevant
                                    </span>
                                )}
                            </div>
                            {ref.url && (
                                <a
                                    href={ref.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#f52f2f] hover:text-[#f52f2f]/80 text-xs"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                        <h5 className="text-sm font-medium text-white mb-1">{ref.title}</h5>
                        {ref.excerpt && (
                            <p className="text-xs text-gray-400 line-clamp-2">{ref.excerpt}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

const DiagnosticVisualAids = ({ visualAids }: { visualAids: DiagnosticVisualAid[] }) => {
    if (!visualAids || visualAids.length === 0) return null

    return (
        <div className="mt-4 border border-[#444444] rounded-lg bg-[#1a1a1a] p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Eye size={16} />
                Visual Diagnostics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visualAids.map((aid) => (
                    <div key={aid.id} className="border border-[#333333] rounded-md bg-[#222222] overflow-hidden">
                        {aid.placeholder ? (
                            <div className="h-32 bg-[#1a1a1a] border-b border-[#333333] flex items-center justify-center">
                                <span className="text-gray-500 text-sm">[{aid.type} placeholder]</span>
                            </div>
                        ) : aid.url ? (
                            <img 
                                src={aid.url} 
                                alt={aid.title}
                                className="w-full h-32 object-cover border-b border-[#333333]"
                            />
                        ) : (
                            <div className="h-32 bg-[#1a1a1a] border-b border-[#333333] flex items-center justify-center">
                                <Eye size={24} className="text-gray-500" />
                            </div>
                        )}
                        <div className="p-3">
                            <h5 className="text-sm font-medium text-white mb-1">{aid.title}</h5>
                            <p className="text-xs text-gray-400 capitalize">{aid.type}</p>
                            {aid.description && (
                                <p className="text-xs text-gray-500 mt-1">{aid.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const DiagnosticSummary = ({ message }: { message: DiagnosticMessage }) => {
    const { diagnosticData } = message

    if (!diagnosticData) return null

    return (
        <div className="mt-4 border border-[#444444] rounded-lg bg-[#1a1a1a] p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Wrench size={16} />
                Diagnostic Summary
            </h4>
            
            {diagnosticData.dtcCodes && diagnosticData.dtcCodes.length > 0 && (
                <div className="mb-3">
                    <h5 className="text-xs font-medium text-gray-400 mb-2">Diagnostic Trouble Codes:</h5>
                    <div className="flex flex-wrap gap-2">
                        {diagnosticData.dtcCodes.map((code, index) => (
                            <span 
                                key={index}
                                className="px-2 py-1 bg-[#333333] text-orange-400 text-xs rounded font-mono"
                            >
                                {code}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {diagnosticData.symptoms && diagnosticData.symptoms.length > 0 && (
                <div className="mb-3">
                    <h5 className="text-xs font-medium text-gray-400 mb-2">Symptoms:</h5>
                    <div className="flex flex-wrap gap-2">
                        {diagnosticData.symptoms.map((symptom, index) => (
                            <span 
                                key={index}
                                className="px-2 py-1 bg-[#222222] text-blue-400 text-xs rounded"
                            >
                                {symptom}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {diagnosticData.severity && (
                <div className="mb-3">
                    <h5 className="text-xs font-medium text-gray-400 mb-2">Severity:</h5>
                    <span className={cn(
                        "px-2 py-1 text-xs rounded font-medium",
                        diagnosticData.severity === 'critical' && "bg-red-900 text-red-300",
                        diagnosticData.severity === 'high' && "bg-orange-900 text-orange-300",
                        diagnosticData.severity === 'medium' && "bg-yellow-900 text-yellow-300",
                        diagnosticData.severity === 'low' && "bg-green-900 text-green-300"
                    )}>
                        {diagnosticData.severity.toUpperCase()}
                    </span>
                </div>
            )}

            {diagnosticData.estimatedCost && (
                <div className="mb-3">
                    <h5 className="text-xs font-medium text-gray-400 mb-2">Estimated Repair Cost:</h5>
                    <span className="text-sm text-green-400 font-mono">
                        ${diagnosticData.estimatedCost.min} - ${diagnosticData.estimatedCost.max} {diagnosticData.estimatedCost.currency}
                    </span>
                </div>
            )}
        </div>
    )
}

const baseMarkdownComponents: Partial<Components> = {
    img: ({ src }: { src?: string }) => <span className="text-gray-400 font-mono text-xs">[Image: {src}]</span>,
}

const DiagnosticMessageComponent = ({
    id,
    message,
    isLoading,
    readOnly,
    onDelete,
    onEdit,
    isAfterEditedMessage = false,
    isBeingEdited = false,
    onCancelEdit,
}: DiagnosticMessageProps) => {
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
    
    if (!message) {
        console.error(`DiagnosticMessage component received undefined message prop for id: ${id}`)
        return null
    }

    const role = message.role
    const parts = 'parts' in message ? message.parts : []
    const content = 'content' in message ? (message.content as string) : ''
    const isUser = role === 'user'
    const hasTextContent = content && content.trim().length > 0
    const shouldUsePartsRendering = Array.isArray(parts) && parts.length > 0

    return (
        <div
            className={cn(
                'text-foreground-light text-sm first:mt-0',
                isUser ? 'text-foreground mt-6' : '',
                isAfterEditedMessage && 'opacity-50 cursor-pointer transition-opacity'
            )}
            onClick={isAfterEditedMessage ? onCancelEdit : undefined}
        >
            <div className="flex gap-4 w-auto overflow-hidden group">
                {isUser && (
                    <div className="w-5 h-5 shrink-0 rounded-full bg-[#f52f2f] flex items-center justify-center translate-y-0.5">
                        <span className="text-white text-xs font-medium">U</span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {shouldUsePartsRendering ? (
                        parts.map((part: any, index: number) => {
                            switch (part.type) {
                                case 'reasoning':
                                    return (
                                        <Reasoning
                                            key={`${id}-${index}`}
                                            className="w-full mb-4"
                                            isStreaming={part.state === 'streaming'}
                                        >
                                            {part.text}
                                        </Reasoning>
                                    )
                                case 'text':
                                default:
                                    return (
                                        <div
                                            key={`${id}-part-${index}`}
                                            className={cn(
                                                'max-w-none prose prose-sm prose-invert',
                                                '[&>div]:my-4 prose-h1:text-xl prose-h1:mt-6 prose-h2:text-lg prose-h3:no-underline prose-h3:text-base prose-h3:mb-4',
                                                'prose-strong:font-medium prose-strong:text-foreground prose-ol:space-y-3 prose-ul:space-y-3 prose-li:my-0',
                                                'break-words [&>p:not(:last-child)]:!mb-2',
                                                isUser && 'text-foreground [&>p]:font-medium',
                                                isBeingEdited && 'animate-pulse'
                                            )}
                                        >
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={baseMarkdownComponents}
                                            >
                                                {part.text || part.content}
                                            </ReactMarkdown>
                                        </div>
                                    )
                            }
                        })
                    ) : hasTextContent ? (
                        <div
                            className={cn(
                                'prose prose-sm prose-invert max-w-none break-words',
                                isUser && 'text-foreground [&>p]:font-medium'
                            )}
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={baseMarkdownComponents}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <span className="text-gray-400 italic">MIA is analyzing your vehicle issue...</span>
                    )}

                    {/* Diagnostic-specific content */}
                    {!isUser && message.diagnosticData && (
                        <>
                            <DiagnosticSummary message={message} />
                            <DiagnosticReferences references={message.diagnosticData.references || []} />
                            <DiagnosticVisualAids visualAids={message.diagnosticData.visualAids || []} />
                        </>
                    )}

                    {/* Action buttons - only show for user messages on hover */}
                    {role === 'user' && onEdit && onDelete && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 mb-2">
                            <ButtonTooltip
                                variant="ghost"
                                icon={<Pencil size={14} strokeWidth={1.5} />}
                                onClick={
                                    isBeingEdited || isAfterEditedMessage ? onCancelEdit : () => onEdit(id)
                                }
                                className="text-gray-400 hover:text-white p-1 rounded mr-2"
                                aria-label={
                                    isBeingEdited || isAfterEditedMessage ? 'Cancel editing' : 'Edit message'
                                }
                                tooltip={{
                                    content: {
                                        side: 'bottom',
                                        text: isBeingEdited || isAfterEditedMessage ? 'Cancel editing' : 'Edit message',
                                    },
                                }}
                            />

                            <ButtonTooltip
                                variant="ghost"
                                icon={<Trash2 size={14} strokeWidth={1.5} />}
                                tooltip={{ content: { side: 'bottom', text: 'Delete message' } }}
                                onClick={() => {
                                    onDelete(id)
                                    toast.success('Message deleted successfully')
                                }}
                                className="text-gray-400 hover:text-white p-1 rounded"
                                title="Delete message"
                                aria-label="Delete message"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export const MemoizedDiagnosticMessage = memo(DiagnosticMessageComponent)
MemoizedDiagnosticMessage.displayName = 'MemoizedDiagnosticMessage'