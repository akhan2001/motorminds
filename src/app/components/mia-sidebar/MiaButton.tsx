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
    const { toggleSidebar, currentPage } = useMiaSidebar()

    // Only show button on supported pages
    if (!currentPage) return null

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={toggleSidebar}
                        className={cn(
                            // Transparent base; red overlay on hover
                            "bg-transparent hover:bg-[#b22222]/30",
                            "transition-colors duration-150",
                            // Size for logo only - circular
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