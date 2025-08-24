"use client"

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useMiaSidebar } from '@/contexts/MiaSidebarContext'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MiaButtonProps {
	className?: string
}

export function MiaButton({ className }: MiaButtonProps) {
	const { toggleSidebar, currentPage, isOpen } = useMiaSidebar() as any

	// Only show button on supported pages
	if (!currentPage) return null

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						aria-pressed={isOpen}
						onClick={toggleSidebar}
						className={cn(
							// Background highlight only; persistent when open
							isOpen ? "bg-[#b22222]/30" : "bg-transparent hover:bg-[#b22222]/30 active:bg-[#b22222]/40",
							"transition-colors duration-150",
							// No focus ring
							"focus:outline-none",
							// Size for logo only - circular (left-rounded to merge with group)
							"p-2 w-10 h-10 rounded-l-full",
							className
						)}
						size="sm"
					>
						<Image
							src="/red-motorminds-logo-svg.svg"
							alt="MotorMinds AI"
							width={24}
							height={24}
							className="w-6 h-6"
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom" align="start" className="bg-[#0d0d0d] border-[#1f1f1f] text-white">
					<div className="flex items-center gap-2">
						<span className="text-sm">Mia AI Assistant</span>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}