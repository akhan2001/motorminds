'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { User, Sparkles } from 'lucide-react'

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
				'rounded-lg px-4 py-3 max-w-[80%]',
				isUser
					? 'bg-red-600 dark:bg-red-500 text-white'
					: 'bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-gray-100',
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
		<div className={cn('flex-shrink-0', className)}>
			{isUser ? (
				<div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
					<User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
				</div>
			) : (
				<div className="w-8 h-8 rounded-full bg-red-600 dark:bg-red-500 flex items-center justify-center">
					<Sparkles className="w-4 h-4 text-white" />
				</div>
			)}
		</div>
	)
}

