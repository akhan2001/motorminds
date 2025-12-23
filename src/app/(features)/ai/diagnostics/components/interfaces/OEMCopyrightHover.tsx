"use client"

import { HelpCircle, ExternalLink } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { OEM_COPYRIGHTS, OEM_COMPLIANCE_URL, OEMBrand } from '@/lib/integrations/motor-daas/constants/oem-copyrights'
import { cn } from '@/lib/utils'

interface OEMCopyrightHoverProps {
    oems: OEMBrand[]
    className?: string
    iconSize?: number
}

/**
 * Hover card component that displays OEM copyright notices on hover.
 * Shows a help icon that reveals copyright information when hovered.
 * 
 * @example
 * ```tsx
 * <OEMCopyrightHover oems={['honda', 'toyota']} />
 * ```
 */
export function OEMCopyrightHover({ 
    oems, 
    className,
    iconSize = 16
}: OEMCopyrightHoverProps) {
    if (oems.length === 0) return null

    return (
        <HoverCard openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
                <button
                    className={cn(
                        "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm",
                        className
                    )}
                    aria-label="OEM Copyright Information"
                    type="button"
                >
                    <HelpCircle size={iconSize} strokeWidth={1.5} />
                </button>
            </HoverCardTrigger>
            <HoverCardContent 
                className="w-96 max-h-96 overflow-y-auto" 
                side="top" 
                align="start"
                sideOffset={8}
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <HelpCircle size={18} className="text-foreground" />
                        <h4 className="font-semibold text-sm">OEM Copyright Notices</h4>
                    </div>
                    
                    <div className="space-y-3 border-t border-border pt-3">
                        {oems.map((oem) => (
                            <div key={oem} className="text-xs text-muted-foreground leading-relaxed">
                                <p>{OEM_COPYRIGHTS[oem]}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-border pt-3">
                        <a
                            href={OEM_COMPLIANCE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
                        >
                            <ExternalLink size={12} />
                            <span>OEM Compliance Requirements</span>
                        </a>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    )
}

