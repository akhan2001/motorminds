'use client'

import React from 'react'
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DocumentImageProps {
	/** URL to fetch the image from */
	src: string
	/** Alt text for accessibility */
	alt: string
	/** Optional caption displayed below the image */
	caption?: string
	/** Optional title displayed in header */
	title?: string
	/** Whether to show the header with title */
	showHeader?: boolean
	/** Additional class names */
	className?: string
	/** Max height for the image container */
	maxHeight?: number
}

/**
 * Reusable document image viewer component
 * Used for wiring diagrams, service procedure images, etc.
 * Supports zoom, rotate, download, and error handling
 */
export function DocumentImage({
	src,
	alt,
	caption,
	title,
	showHeader = false,
	className,
	maxHeight = 600,
}: DocumentImageProps) {
	const [isLoading, setIsLoading] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)
	const [zoom, setZoom] = React.useState(1)
	const [rotation, setRotation] = React.useState(0)

	const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
	const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
	const handleRotate = () => setRotation(prev => (prev + 90) % 360)

	const handleDownload = async () => {
		try {
			const response = await fetch(src)
			const blob = await response.blob()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = title || alt || 'image'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch {
			console.error('Failed to download image')
		}
	}

	if (error) {
		return (
			<div className={cn(
				"p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg",
				className
			)}>
				<div className="flex items-center gap-2">
					<AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				</div>
			</div>
		)
	}

	return (
		<div className={cn(
			"w-full bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden",
			className
		)}>
			{/* Header */}
			{showHeader && title && (
				<div className="p-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] flex items-center justify-between">
					<p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words flex-1 min-w-0">
						{title}
					</p>
					<div className="flex items-center gap-1 ml-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={handleZoomOut}
							disabled={zoom <= 0.5}
						>
							<ZoomOut className="h-4 w-4" />
						</Button>
						<span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={handleZoomIn}
							disabled={zoom >= 3}
						>
							<ZoomIn className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={handleRotate}
						>
							<RotateCw className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={handleDownload}
						>
							<Download className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Image container */}
			<div 
				className="p-4 overflow-auto flex items-center justify-center"
				style={{ maxHeight }}
			>
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a]">
						<Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
					</div>
				)}
				<img
					src={src}
					alt={alt}
					className="max-w-full h-auto rounded transition-transform duration-200"
					style={{
						transform: `scale(${zoom}) rotate(${rotation}deg)`,
						opacity: isLoading ? 0 : 1,
					}}
					onLoad={() => setIsLoading(false)}
					onError={() => {
						setIsLoading(false)
						setError('Failed to load image')
					}}
				/>
			</div>

			{/* Caption */}
			{caption && (
				<div className="px-4 pb-3">
					<p className="text-xs text-gray-500 dark:text-gray-400 italic text-center">
						{caption}
					</p>
				</div>
			)}
		</div>
	)
}

/**
 * Compact version for inline images (no controls, simpler UI)
 */
export function DocumentImageCompact({
	src,
	alt,
	caption,
	className,
}: {
	src: string
	alt: string
	caption?: string
	className?: string
}) {
	const [isLoading, setIsLoading] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)

	if (error) {
		return (
			<div className={cn(
				"p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-center",
				className
			)}>
				<p className="text-xs text-red-500 dark:text-red-400">Failed to load image</p>
			</div>
		)
	}

	return (
		<div className={cn("relative", className)}>
			{isLoading && (
				<div className="flex items-center justify-center p-4">
					<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
				</div>
			)}
			<img
				src={src}
				alt={alt}
				className={cn(
					"max-w-full h-auto rounded-md mx-auto",
					isLoading && "opacity-0 absolute"
				)}
				onLoad={() => setIsLoading(false)}
				onError={() => {
					setIsLoading(false)
					setError('Failed to load')
				}}
			/>
			{caption && !isLoading && (
				<p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center italic">
					{caption}
				</p>
			)}
		</div>
	)
}

