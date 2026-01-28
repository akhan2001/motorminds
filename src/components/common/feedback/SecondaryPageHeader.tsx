'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SecondaryPageHeaderProps {
	/** Page title */
	title: string
	/** Page description/subtitle */
	description?: string
	/** Back navigation URL - if not provided, uses router.back() */
	backHref?: string
	/** Actions to render on the right side */
	actions?: React.ReactNode
	/** Additional className for the container */
	className?: string
}

/**
 * Consistent header for secondary/detail pages with back navigation.
 * Used for pages like Archived Work Orders, Archived Invoices, Suppliers, etc.
 */
export function SecondaryPageHeader({
	title,
	description,
	backHref,
	actions,
	className,
}: SecondaryPageHeaderProps) {
	const router = useRouter()

	const handleBack = () => {
		if (backHref) {
			router.push(backHref)
		} else {
			router.back()
		}
	}

	return (
		<div className={cn("bg-background border-b border-border flex-shrink-0", className)}>
			<div className="px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleBack}
							className="h-9 w-9 -ml-2"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div>
							<h1 className="text-2xl font-semibold text-foreground">{title}</h1>
							{description && (
								<p className="text-sm text-muted-foreground mt-1">
									{description}
								</p>
							)}
						</div>
					</div>
					{actions && (
						<div className="flex items-center gap-3">
							{actions}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
