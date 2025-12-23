"use client"

import { OEM_COPYRIGHTS, OEM_COMPLIANCE_URL, OEMBrand } from '@/lib/integrations/motor-daas/constants/oem-copyrights'
import { cn } from '@/lib/utils'

interface OEMCopyrightPrintProps {
    oems: OEMBrand[]
    className?: string
}

/**
 * Print-only component that displays OEM copyright notices.
 * Hidden by default, visible only when printing.
 * 
 * @example
 * ```tsx
 * <OEMCopyrightPrint oems={['honda', 'toyota']} />
 * ```
 */
export function OEMCopyrightPrint({ oems, className }: OEMCopyrightPrintProps) {
    if (oems.length === 0) return null

    return (
        <div 
            className={cn(
                "hidden print:block mt-4 pt-4 border-t border-border",
                "text-xs text-muted-foreground space-y-2",
                "page-break-inside-avoid",
                className
            )}
        >
            {oems.map((oem) => (
                <p key={oem} className="leading-relaxed">
                    {OEM_COPYRIGHTS[oem]}
                </p>
            ))}
            <p className="pt-2">
                For more information, see{' '}
                <a 
                    href={OEM_COMPLIANCE_URL} 
                    className="underline hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    OEM Compliance Requirements
                </a>
            </p>
        </div>
    )
}

