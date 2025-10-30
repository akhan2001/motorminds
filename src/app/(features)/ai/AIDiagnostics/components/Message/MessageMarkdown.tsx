"use client"

import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface MessageMarkdownProps {
    children: string
    className?: string
    id?: string
    isLoading?: boolean
    readOnly?: boolean
}

/**
 * MessageMarkdown Component
 * 
 * Renders markdown content with Tailwind Typography classes.
 * Follows Supabase pattern for consistent markdown styling.
 */
export function MessageMarkdown({ 
    children, 
    className, 
    id, 
    isLoading, 
    readOnly 
}: MessageMarkdownProps) {
    return (
        <div className={cn('prose prose-sm max-w-none break-words', className)}>
            <ReactMarkdown
                components={{
                    // Typography components with white text, no backgrounds
                    h1: ({ children }) => (
                        <h1 className="text-xl font-medium text-white mt-6 mb-4 first:mt-0">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-lg font-medium text-white mt-4 mb-3">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-base font-medium text-white mt-3 mb-2">{children}</h3>
                    ),
                    p: ({ children }) => (
                        <p className="text-white mb-2 last:mb-0 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-4 space-y-1 text-white">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-4 space-y-3 text-white">{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-white my-0">{children}</li>
                    ),
                    code: ({ children }) => (
                        <code className="bg-[#1f1f1f] px-1.5 py-0.5 rounded text-sm text-red-400 font-mono">
                            {children}
                        </code>
                    ),
                    pre: ({ children }) => (
                        <pre className="bg-[#1f1f1f] p-3 rounded text-sm overflow-x-auto mb-4 border border-[#2a2a2a]">
                            {children}
                        </pre>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-medium text-white">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic text-white">{children}</em>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-gray-500 pl-4 italic text-gray-300 my-4">
                            {children}
                        </blockquote>
                    ),
                    a: ({ children, href }) => (
                        <a 
                            href={href} 
                            className="text-blue-400 hover:text-blue-300 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border border-[#2a2a2a] rounded">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-[#2a2a2a] px-3 py-2 bg-[#1f1f1f] text-white font-medium text-left">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-[#2a2a2a] px-3 py-2 text-white">
                            {children}
                        </td>
                    ),
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    )
}
