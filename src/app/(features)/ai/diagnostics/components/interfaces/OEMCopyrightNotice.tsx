import { OEM_COPYRIGHTS, OEM_COMPLIANCE_URL, OEMBrand } from "@/lib/integrations/motor-daas/constants/oem-copyrights"

import { cn } from '@/lib/utils'

interface OEMCopyrightNoticeProps {
    oems: OEMBrand[]
    className?: string
    variant?: 'default' | 'compact' | 'print'
}

export function OEMCopyrightNotice({
    oems,
    className,
    variant = 'default',
}: OEMCopyrightNoticeProps) {
    if (oems.length === 0) return null

    return (
        <div className={cn(
            'border-t border-border pt-4 mt-4',
            variant === 'compact' && 'text-xs',
            variant === 'print' && 'print:block hidden',
            className
        )}>
            <div className="space-y-2">
                {oems.map((oem) => (
                    <p key={oem} className="text-xs text-muted-foreground leading-relaxed">
                        {OEM_COPYRIGHTS[oem]}
                    </p>
                ))}
                <p className="text-xs text-muted-foreground/80">
                    For more information, see{' '}
                    <a
                        href={OEM_COMPLIANCE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary transition-colors"
                    >
                        OEM Compliance Requirements
                    </a>
                </p>
            </div>
        </div>
    )
}