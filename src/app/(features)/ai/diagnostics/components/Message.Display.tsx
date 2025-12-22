'use client'

import React from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

interface MessageDisplayContainerProps {
	children: React.ReactNode
	isUser: boolean
	className?: string
}

export function MessageDisplayContainer({ children, isUser, className }: MessageDisplayContainerProps) {
	return (
		<div className={cn('flex gap-3 mb-6', isUser && 'justify-end', className)}>
			{children}
		</div>
	)
}

interface MessageDisplayMainAreaProps {
	children: React.ReactNode
	isUser: boolean
	className?: string
}

export function MessageDisplayMainArea({ children, isUser, className }: MessageDisplayMainAreaProps) {
	return (
		<div className={cn('flex gap-3 items-start', className)}>
			{children}
		</div>
	)
}

interface MessageDisplayContentProps {
	children: React.ReactNode
	isUser: boolean
	className?: string
}

export function MessageDisplayContent({ children, isUser, className }: MessageDisplayContentProps) {
	return (
		<div
			className={cn(
				'rounded-lg px-4 max-w-[80%]',
				isUser
					? 'bg-red-600 dark:bg-red-500 text-white py-3'
					: 'text-gray-900 dark:text-gray-100 py-0',
				className
			)}
		>
			{children}
		</div>
	)
}

interface MessageDisplayProfileImageProps {
	isUser: boolean
	className?: string
}

export function MessageDisplayProfileImage({ isUser, className }: MessageDisplayProfileImageProps) {
	return (
		!isUser && (
			<div className={cn('flex-shrink-0', className)}>
				<div className="w-8 h-8 rounded-full bg-white dark:bg-black flex items-center justify-center border border-gray-200 dark:border-gray-700">
					<Image src="/red-motorminds-logo-svg.svg" alt="Motorminds Logo" width={18} height={18} />
				</div>
			</div>
		)
	)
}

