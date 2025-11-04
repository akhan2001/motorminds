'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
    AlertTriangle, 
    CheckCircle, 
    Info, 
    ExternalLink, 
    Wrench, 
    DollarSign,
    Clock,
    AlertCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DiagnosticMessageCardProps {
    message: {
        id: string
        role: 'user' | 'assistant' | 'system'
        content: string
        metadata?: {
            citations?: Array<{
                url: string
                title?: string
            }>
            searchResults?: Array<{
                url: string
                title: string
                snippet: string
            }>
            diagnosticMode?: string
            vehicleInfo?: any
        }
    }
    isLoading?: boolean
}

export default function DiagnosticMessageCard({ message, isLoading }: DiagnosticMessageCardProps) {
    if (message.role === 'user') {
        return (
            <div className="flex justify-end mb-4">
                <Card className="max-w-2xl bg-red-600 border-red-500">
                    <CardContent className="p-4">
                        <p className="text-white">{message.content}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (message.role === 'system') {
        // Don't render system messages in the UI
        return null
    }

    // Parse assistant message content for better formatting
    const sections = parseAssistantMessage(message.content)
    
    return (
        <div className="flex justify-start mb-6">
            <div className="max-w-4xl w-full space-y-4">
                {/* Main Response Card */}
                <Card className="bg-slate-50 dark:bg-card border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-red-600" />
                            MIA Diagnostic Analysis
                            {message.metadata?.diagnosticMode && (
                                <Badge variant="outline" className="text-xs border-border">
                                    {message.metadata.diagnosticMode}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sections.map((section, index) => (
                            <DiagnosticSection key={index} section={section} />
                        ))}
                    </CardContent>
                </Card>

                {/* Citations Card */}
                {message.metadata?.citations && message.metadata.citations.filter(citation => {
                    // Only show citations with valid URLs
                    return citation.url && 
                        (citation.url.startsWith('http://') || citation.url.startsWith('https://'))
                }).length > 0 && (
                    <Card className="bg-slate-50 dark:bg-card border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-foreground flex items-center gap-2 text-sm">
                                <ExternalLink className="h-4 w-4 text-green-600 dark:text-green-400" />
                                Sources & References
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {message.metadata.citations
                                    .filter(citation => {
                                        // Only show citations with valid URLs
                                        return citation.url && 
                                            (citation.url.startsWith('http://') || citation.url.startsWith('https://'))
                                    })
                                    .map((citation, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="justify-start h-auto p-2 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                            onClick={() => window.open(citation.url, '_blank')}
                                        >
                                            <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0" />
                                            <span className="text-xs truncate">
                                                {citation.title || citation.url}
                                            </span>
                                        </Button>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Search Results Card */}
                {message.metadata?.searchResults && message.metadata.searchResults.filter(result => {
                    // Only show search results with valid URLs
                    return result.url && 
                        (result.url.startsWith('http://') || result.url.startsWith('https://'))
                }).length > 0 && (
                    <Card className="bg-slate-50 dark:bg-card border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-foreground flex items-center gap-2 text-sm">
                                <Info className="h-4 w-4 text-red-600 dark:text-blue-400" />
                                Additional Resources
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {message.metadata.searchResults
                                    .filter(result => {
                                        // Only show search results with valid URLs
                                        return result.url && 
                                            (result.url.startsWith('http://') || result.url.startsWith('https://'))
                                    })
                                    .slice(0, 3)
                                    .map((result, index) => (
                                        <div 
                                            key={index}
                                            className="p-3 border border-border rounded-lg hover:border-red-300 dark:hover:border-red-500 transition-colors cursor-pointer bg-white dark:bg-background"
                                            onClick={() => window.open(result.url, '_blank')}
                                        >
                                            <div className="flex items-start gap-2">
                                                <ExternalLink className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-foreground truncate">
                                                        {result.title}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {result.snippet}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

interface DiagnosticSection {
    title: string
    content: string
    type: 'analysis' | 'causes' | 'actions' | 'cost' | 'safety' | 'resources' | 'default'
}

function DiagnosticSection({ section }: { section: DiagnosticSection }) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'analysis': return <CheckCircle className="h-4 w-4 text-green-400" />
            case 'causes': return <AlertCircle className="h-4 w-4 text-yellow-400" />
            case 'actions': return <Wrench className="h-4 w-4 text-blue-400" />
            case 'cost': return <DollarSign className="h-4 w-4 text-green-400" />
            case 'safety': return <AlertTriangle className="h-4 w-4 text-red-400" />
            case 'resources': return <ExternalLink className="h-4 w-4 text-purple-400" />
            default: return <Info className="h-4 w-4 text-gray-400" />
        }
    }

    const getBorderColor = (type: string) => {
        switch (type) {
            case 'analysis': return 'border-l-green-600 dark:border-l-green-400'
            case 'causes': return 'border-l-yellow-600 dark:border-l-yellow-400'
            case 'actions': return 'border-l-red-600 dark:border-l-blue-400'
            case 'cost': return 'border-l-green-600 dark:border-l-green-400'
            case 'safety': return 'border-l-red-600 dark:border-l-red-400'
            case 'resources': return 'border-l-purple-600 dark:border-l-purple-400'
            default: return 'border-l-gray-600 dark:border-l-gray-400'
        }
    }

    return (
        <div className={`border-l-4 ${getBorderColor(section.type)} pl-4 py-2`}>
            <div className="flex items-center gap-2 mb-2">
                {getIcon(section.type)}
                <h3 className="text-foreground font-medium text-sm">{section.title}</h3>
            </div>
            <div className="text-muted-foreground text-sm prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                </ReactMarkdown>
            </div>
        </div>
    )
}

function parseAssistantMessage(content: string): DiagnosticSection[] {
    const sections: DiagnosticSection[] = []
    
    // Split by markdown headers and sections
    const lines = content.split('\n')
    let currentSection: DiagnosticSection | null = null
    
    for (const line of lines) {
        // Check for section headers
        if (line.match(/^#+\s*/)) {
            // Save previous section
            if (currentSection) {
                sections.push(currentSection)
            }
            
            // Start new section
            const title = line.replace(/^#+\s*/, '').trim()
            const type = categorizeSection(title)
            currentSection = {
                title,
                content: '',
                type
            }
        } else if (line.match(/^\*\*.*\*\*:?/)) {
            // Bold text headers (alternative format)
            if (currentSection) {
                sections.push(currentSection)
            }
            
            const title = line.replace(/^\*\*(.*?)\*\*:?/, '$1').trim()
            const type = categorizeSection(title)
            currentSection = {
                title,
                content: '',
                type
            }
        } else if (currentSection) {
            // Add content to current section
            if (line.trim()) {
                currentSection.content += (currentSection.content ? '\n' : '') + line
            }
        } else if (line.trim()) {
            // Content without a section header
            if (!currentSection) {
                currentSection = {
                    title: 'Analysis',
                    content: line,
                    type: 'analysis'
                }
            } else {
                // Add content to existing section - we know currentSection is not null here
                const section = currentSection as DiagnosticSection
                section.content += (section.content ? '\n' : '') + line
            }
        }
    }
    
    // Add the last section
    if (currentSection) {
        sections.push(currentSection)
    }
    
    // If no sections were found, create a default one
    if (sections.length === 0) {
        sections.push({
            title: 'Diagnostic Response',
            content,
            type: 'default'
        })
    }
    
    return sections
}

function categorizeSection(title: string): DiagnosticSection['type'] {
    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes('diagnostic') || lowerTitle.includes('analysis') || lowerTitle.includes('summary')) {
        return 'analysis'
    } else if (lowerTitle.includes('cause') || lowerTitle.includes('reason') || lowerTitle.includes('problem')) {
        return 'causes'
    } else if (lowerTitle.includes('action') || lowerTitle.includes('step') || lowerTitle.includes('repair') || lowerTitle.includes('fix')) {
        return 'actions'
    } else if (lowerTitle.includes('cost') || lowerTitle.includes('price') || lowerTitle.includes('part')) {
        return 'cost'
    } else if (lowerTitle.includes('safety') || lowerTitle.includes('warning') || lowerTitle.includes('danger')) {
        return 'safety'
    } else if (lowerTitle.includes('resource') || lowerTitle.includes('reference') || lowerTitle.includes('additional')) {
        return 'resources'
    }
    
    return 'default'
}
