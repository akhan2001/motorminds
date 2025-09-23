"use client"

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface NavIconProps {
    children: React.ReactNode
    label: string
    onClick?: () => void
    variant?: 'squareGrey' | 'default'
    className?: string
}

export function NavIcon({ children, label, onClick, variant = 'default', className }: NavIconProps) {
    const baseClasses = "p-2 w-10 h-10 transition-colors duration-150 focus:outline-none"
    
    const variantClasses = {
        squareGrey: "bg-transparent hover:bg-[#2a2a2a]/50 text-[#979797] hover:text-white",
        default: "bg-transparent hover:bg-[#b22222]/30 text-[#979797] hover:text-white"
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    onClick={onClick}
                    className={cn(
                    baseClasses,
                    variantClasses[variant],
                    className
                    )}
                    size="sm"
                >
                    {children}
                </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-[#0d0d0d] border-[#1f1f1f] text-white">
                <span className="text-sm">{label}</span>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
