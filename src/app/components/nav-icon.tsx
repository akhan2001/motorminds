"use client"

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface NavIconProps {
    label: string
    onClick?: () => void
    className?: string
    children: React.ReactNode
    variant?: 'circleRed' | 'squareGrey'
    roundedRight?: boolean
    roundedLeft?: boolean
}

export function NavIcon({ label, onClick, className, children, variant = 'circleRed', roundedRight = false, roundedLeft = false }: NavIconProps) {
    let shapeClasses: string

    if (variant === 'squareGrey') {
        // Base: no rounding, then apply edge-specific rounding if requested
        const edgeRounding = roundedRight
            ? 'rounded-none rounded-tr-lg rounded-br-lg'
            : roundedLeft
            ? 'rounded-none rounded-tl-lg rounded-bl-lg'
            : 'rounded-md'

        shapeClasses = cn(edgeRounding, 'hover:bg-white/10')
    } else {
        shapeClasses = 'rounded-full hover:bg-[#b22222]/30'
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={onClick}
                        className={cn(
                            // Transparent base; color only on hover
                            'bg-transparent transition-colors duration-150',
                            'p-2 w-10 h-10',
                            shapeClasses,
                            className
                        )}
                        size="sm"
                    >
                        {children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center" className="bg-[#0d0d0d] border-[#1f1f1f] text-white">
                    <span className="text-sm">{label}</span>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
