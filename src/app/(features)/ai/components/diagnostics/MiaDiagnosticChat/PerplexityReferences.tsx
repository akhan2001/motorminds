import { ExternalLink, Search, FileText } from 'lucide-react'
import { useState } from 'react'

interface PerplexityReference {
    title: string
    url: string
    date?: string
    last_updated?: string
    snippet?: string
}

interface PerplexityReferencesProps {
    citations?: string[]
    searchResults?: PerplexityReference[]
}

export const PerplexityReferences = ({ citations = [], searchResults = [] }: PerplexityReferencesProps) => {
    const [isExpanded, setIsExpanded] = useState(false)

    if (citations.length === 0 && searchResults.length === 0) return null

    return (
        <div className="mt-4 border border-[#444444] rounded-lg bg-[#1a1a1a]">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#2a2a2a] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Search size={16} className="text-[#f52f2f]" />
                    <span className="text-sm font-medium text-white">
                        References & Sources ({citations.length + searchResults.length})
                    </span>
                </div>
                <div className="text-xs text-gray-400">
                    {isExpanded ? 'Hide' : 'Show'}
                </div>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Citations */}
                    {citations.length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-1">
                                <FileText size={12} />
                                Citations
                            </h4>
                            <div className="space-y-2">
                                {citations.map((url, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <span className="text-xs text-gray-500 mt-0.5">[{index + 1}]</span>
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:text-blue-300 underline break-all"
                                        >
                                            {url}
                                        </a>
                                        <ExternalLink size={10} className="text-gray-500 mt-0.5 shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-1">
                                <Search size={12} />
                                Search Results
                            </h4>
                            <div className="space-y-3">
                                {searchResults.map((result, index) => (
                                    <div key={index} className="border border-[#333333] rounded p-3 bg-[#0f0f0f]">
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs text-gray-500 mt-0.5 shrink-0">[{index + 1}]</span>
                                            <div className="flex-1 min-w-0">
                                                <a
                                                    href={result.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-400 hover:text-blue-300 underline block mb-1"
                                                >
                                                    {result.title}
                                                </a>
                                                {result.snippet && (
                                                    <p className="text-xs text-gray-400 leading-relaxed mb-2">
                                                        {result.snippet}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{result.url}</span>
                                                    {result.date && (
                                                        <span>• {result.date}</span>
                                                    )}
                                                    {result.last_updated && (
                                                        <span>• Updated: {result.last_updated}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <ExternalLink size={12} className="text-gray-500 mt-0.5 shrink-0" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
