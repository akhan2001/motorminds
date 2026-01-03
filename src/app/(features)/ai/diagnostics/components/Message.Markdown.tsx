'use client'

import { memo, ReactNode, useMemo, isValidElement, type ReactElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

// =============================================================================
// CUSTOM MARKDOWN COMPONENTS
// =============================================================================

export const Heading1 = memo(({ children }: { children?: ReactNode }) => (
	<h1 className="text-xl font-bold mt-5 mb-3 text-foreground">{children}</h1>
))
Heading1.displayName = 'Heading1'

export const Heading2 = memo(({ children }: { children?: ReactNode }) => (
	<h2 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h2>
))
Heading2.displayName = 'Heading2'

export const Heading3 = memo(({ children }: { children?: ReactNode }) => (
	<h3 className="text-base font-semibold mt-3 mb-2 text-foreground">{children}</h3>
))
Heading3.displayName = 'Heading3'

export const Heading4 = memo(({ children }: { children?: ReactNode }) => (
	<h4 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h4>
))
Heading4.displayName = 'Heading4'

export const Paragraph = memo(({ children }: { children?: ReactNode }) => (
	<p className="text-sm text-foreground/90 leading-relaxed my-2">{children}</p>
))
Paragraph.displayName = 'Paragraph'

export const Strong = memo(({ children }: { children?: ReactNode }) => (
	<strong className="font-semibold text-foreground">{children}</strong>
))
Strong.displayName = 'Strong'

export const Emphasis = memo(({ children }: { children?: ReactNode }) => (
	<em className="italic text-foreground/90">{children}</em>
))
Emphasis.displayName = 'Emphasis'

export const OrderedList = memo(({ children }: { children?: ReactNode }) => (
	<ol className="list-decimal list-outside ml-5 my-2 space-y-1 text-sm text-foreground/90">{children}</ol>
))
OrderedList.displayName = 'OrderedList'

export const UnorderedList = memo(({ children }: { children?: ReactNode }) => (
	<ul className="list-disc list-outside ml-5 my-2 space-y-1 text-sm text-foreground/90">{children}</ul>
))
UnorderedList.displayName = 'UnorderedList'

export const ListItem = memo(({ children }: { children?: ReactNode }) => (
	<li className="leading-relaxed [&>pre]:mt-2">{children}</li>
))
ListItem.displayName = 'ListItem'

export const InlineCode = memo(({ className, children }: { className?: string; children?: ReactNode }) => (
	<code className={cn('text-xs bg-muted px-1.5 py-0.5 rounded font-mono', className)}>{children}</code>
))
InlineCode.displayName = 'InlineCode'

export const Blockquote = memo(({ children }: { children?: ReactNode }) => (
	<blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-3 italic text-foreground/80">
		{children}
	</blockquote>
))
Blockquote.displayName = 'Blockquote'

export const HorizontalRule = memo(() => <hr className="border-border my-4" />)
HorizontalRule.displayName = 'HorizontalRule'

export const Image = memo(({ src, alt }: { src?: string; alt?: string }) => (
	<span className="text-muted-foreground font-mono text-xs">[Image: {alt || src}]</span>
))
Image.displayName = 'Image'

// =============================================================================
// HYPERLINK WITH VERIFICATION DIALOG
// =============================================================================

function isInternalUrl(href: string): boolean {
	if (!href) return false
	// Add your internal domain patterns here
	return href.startsWith('/') || href.startsWith('#')
}

function sanitizeUrl(url: string): string {
	if (!url) return ''
	try {
		const parsed = new URL(url, window.location.origin)
		// Only allow http, https protocols
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			return ''
		}
		return parsed.href
	} catch {
		// If URL parsing fails, check if it's a relative path
		if (url.startsWith('/') || url.startsWith('#')) {
			return url
		}
		return ''
	}
}

export const Hyperlink = memo(({ href, children }: { href?: string; children?: ReactNode }) => {
	const safeUrl = sanitizeUrl(href ?? '')
	const isSafeUrl = safeUrl.length > 0
	const isInternal = isInternalUrl(href ?? '')

	if (!isSafeUrl) {
		return <span className="text-foreground">{children}</span>
	}

	// Internal links - render directly
	if (isInternal) {
		return (
			<a
				href={safeUrl}
				className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
			>
				{children}
			</a>
		)
	}

	// External links - show verification dialog
	return (
		<Dialog>
			<DialogTrigger asChild>
				<span
					className={cn(
						'text-primary cursor-pointer transition-colors inline-flex items-center gap-1',
						'underline underline-offset-2 hover:text-primary/80'
					)}
				>
					{children}
					<ExternalLink className="h-3 w-3" />
				</span>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>External Link</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-2 py-4">
					<p className="text-sm text-muted-foreground">This will open an external link:</p>
					<p className="text-sm font-mono bg-muted p-2 rounded break-all">{safeUrl}</p>
				</div>
				<DialogFooter className="flex gap-2">
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>
					<DialogClose asChild>
						<a
							href={safeUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center"
						>
							<Button>
								Open Link
								<ExternalLink className="ml-2 h-4 w-4" />
							</Button>
						</a>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
})
Hyperlink.displayName = 'Hyperlink'

// =============================================================================
// CODE BLOCK WITH COPY BUTTON
// =============================================================================

export const CodeBlock = memo(({ children, className }: { children?: ReactNode; className?: string }) => {
	const [copied, setCopied] = useState(false)

	// Extract text content from children
	const codeContent = useMemo(() => {
		if (typeof children === 'string') return children
		if (Array.isArray(children)) {
			return children.map((c) => (typeof c === 'string' ? c : '')).join('')
		}
		return ''
	}, [children])

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(codeContent)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}

	// Detect language from className (e.g., "language-typescript")
	const language = className?.replace('language-', '') || ''

	return (
		<div className="relative group my-3">
			<pre className="bg-muted border rounded-lg p-3 overflow-x-auto text-xs">
				<code className={cn('font-mono block', className)}>{children}</code>
			</pre>
			<button
				onClick={handleCopy}
				className={cn(
					'absolute top-2 right-2 p-1.5 rounded',
					'bg-background/80 hover:bg-background border',
					'opacity-0 group-hover:opacity-100 transition-opacity',
					'text-muted-foreground hover:text-foreground'
				)}
				title="Copy code"
			>
				{copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
			</button>
			{language && (
				<span className="absolute top-2 left-3 text-[10px] text-muted-foreground uppercase tracking-wide">
					{language}
				</span>
			)}
		</div>
	)
})
CodeBlock.displayName = 'CodeBlock'

// Pre wrapper that renders CodeBlock
const PreBlock = memo(({ children }: { children?: ReactNode }) => {
	// Find the code element
	const childArray = Array.isArray(children) ? children : [children]
	const codeElement = childArray.find((child): child is ReactElement => isValidElement(child))

	if (!codeElement) {
		return <pre className="w-auto overflow-x-auto my-4">{children}</pre>
	}

	const codeProps = (codeElement.props || {}) as { className?: string; children?: ReactNode }
	return <CodeBlock className={codeProps.className}>{codeProps.children}</CodeBlock>
})
PreBlock.displayName = 'PreBlock'

// =============================================================================
// TABLE COMPONENTS
// =============================================================================

export const Table = memo(({ children }: { children?: ReactNode }) => (
	<div className="overflow-x-auto my-3">
		<table className="min-w-full text-sm border-collapse">{children}</table>
	</div>
))
Table.displayName = 'Table'

export const TableHead = memo(({ children }: { children?: ReactNode }) => (
	<thead className="bg-muted">{children}</thead>
))
TableHead.displayName = 'TableHead'

export const TableBody = memo(({ children }: { children?: ReactNode }) => <tbody>{children}</tbody>)
TableBody.displayName = 'TableBody'

export const TableRow = memo(({ children }: { children?: ReactNode }) => (
	<tr className="border-b border-border">{children}</tr>
))
TableRow.displayName = 'TableRow'

export const TableHeader = memo(({ children }: { children?: ReactNode }) => (
	<th className="px-3 py-2 text-left font-semibold text-foreground">{children}</th>
))
TableHeader.displayName = 'TableHeader'

export const TableCell = memo(({ children }: { children?: ReactNode }) => (
	<td className="px-3 py-2 text-foreground/90">{children}</td>
))
TableCell.displayName = 'TableCell'

// =============================================================================
// MARKDOWN COMPONENTS MAP
// =============================================================================

export const markdownComponents = {
	h1: Heading1,
	h2: Heading2,
	h3: Heading3,
	h4: Heading4,
	p: Paragraph,
	strong: Strong,
	em: Emphasis,
	ol: OrderedList,
	ul: UnorderedList,
	li: ListItem,
	code: InlineCode,
	pre: PreBlock,
	blockquote: Blockquote,
	hr: HorizontalRule,
	a: Hyperlink,
	img: Image,
	table: Table,
	thead: TableHead,
	tbody: TableBody,
	tr: TableRow,
	th: TableHeader,
	td: TableCell,
}

// =============================================================================
// MAIN MESSAGE MARKDOWN COMPONENT
// =============================================================================

interface MessageMarkdownProps {
	id?: string
	isLoading?: boolean
	readOnly?: boolean
	className?: string
	children: ReactNode
}

export function MessageMarkdown({ id, isLoading, readOnly, className, children }: MessageMarkdownProps) {
	const markdownSource = useMemo(() => {
		if (typeof children === 'string') {
			return children
		}

		if (Array.isArray(children)) {
			return children.filter((child): child is string => typeof child === 'string').join('')
		}

		return ''
	}, [children])

	return (
		<div className={cn('w-full min-w-0 break-words', className)}>
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
				{markdownSource}
			</ReactMarkdown>
		</div>
	)
}

export default MessageMarkdown

