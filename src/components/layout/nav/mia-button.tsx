"use client"

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'

interface MiaButtonProps {
	className?: string
}

export function MiaButton({ className }: MiaButtonProps) {
	const router = useRouter()
	// TODO: Integrate with useMiaSidebar hook when implementing full Mia sidebar
	const isOpen = false
	const toggleSidebar = () => {
		console.log('Mia sidebar toggle - to be implemented')
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						aria-pressed={isOpen}
						// onClick={toggleSidebar}
                        onClick={() => router.push("/mia")} 
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
							src="/red-motorminds-logo-png.png"
							alt="MotorMinds AI"
							width={24}
							height={24}
							className="w-6 h-6"
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom" align="start" className="bg-[#0d0d0d] border-[#1f1f1f] text-white">
					<div className="flex items-center gap-2">
						<span className="text-sm">Mia AI Assistant (BETA)</span>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}