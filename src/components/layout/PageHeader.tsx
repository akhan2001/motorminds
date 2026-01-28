"use client"

import { forwardRef, HTMLAttributes } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export interface BreadcrumbItemType {
	label: string
	href?: string
}

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
	/** Page title */
	title: string
	/** Page subtitle/description */
	subtitle?: string
	/** Icon to display before title */
	icon?: React.ReactNode
	/** Breadcrumb navigation items */
	breadcrumbs?: BreadcrumbItemType[]
	/** Primary action buttons (right side) */
	primaryActions?: React.ReactNode
	/** Secondary action buttons (left of primary) */
	secondaryActions?: React.ReactNode
	/** Compact mode with less padding */
	isCompact?: boolean
}

/**
 * PageHeader - Standardized page header component.
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Work Orders"
 *   subtitle="Manage and track work orders for your auto shop"
 *   breadcrumbs={[
 *     { label: "Operations", href: "/operations" },
 *     { label: "Work Orders" }
 *   ]}
 *   primaryActions={
 *     <Button>
 *       <Plus className="h-4 w-4 mr-2" />
 *       New Work Order
 *     </Button>
 *   }
 * />
 * ```
 */
export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
	(
		{
			title,
			subtitle,
			icon,
			breadcrumbs = [],
			primaryActions,
			secondaryActions,
			isCompact = false,
			className,
			...props
		},
		ref
	) => {
		return (
			<div
				ref={ref}
				className={cn(
					"flex flex-col gap-3",
					isCompact ? "py-4" : "py-6 md:py-8",
					className
				)}
				{...props}
			>
				{/* Breadcrumbs */}
				{breadcrumbs.length > 0 && (
					<Breadcrumb>
						<BreadcrumbList>
							{breadcrumbs.map((item, index) => (
								<BreadcrumbItem key={index}>
									{index > 0 && (
										<BreadcrumbSeparator>
											<ChevronRight className="h-3.5 w-3.5" />
										</BreadcrumbSeparator>
									)}
									{item.href ? (
										<BreadcrumbLink asChild>
											<Link
												href={item.href}
												className="text-muted-foreground hover:text-foreground transition-colors"
											>
												{item.label}
											</Link>
										</BreadcrumbLink>
									) : (
										<BreadcrumbPage className="text-foreground font-medium">
											{item.label}
										</BreadcrumbPage>
									)}
								</BreadcrumbItem>
							))}
						</BreadcrumbList>
					</Breadcrumb>
				)}

				{/* Title row */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						{icon && (
							<div className="flex-shrink-0 text-muted-foreground">
								{icon}
							</div>
						)}
						<div className="min-w-0">
							<h1
								className={cn(
									"font-bold text-foreground truncate",
									isCompact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
								)}
							>
								{title}
							</h1>
							{subtitle && (
								<p className="text-sm text-muted-foreground mt-1">
									{subtitle}
								</p>
							)}
						</div>
					</div>

					{/* Actions */}
					{(primaryActions || secondaryActions) && (
						<div className="flex items-center gap-3 flex-shrink-0">
							{secondaryActions}
							{primaryActions}
						</div>
					)}
				</div>
			</div>
		)
	}
)
PageHeader.displayName = "PageHeader"

/**
 * PageHeaderActions - Container for action buttons in PageHeader.
 * Use when you need to group multiple buttons.
 */
export const PageHeaderActions = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		{...props}
		className={cn("flex items-center gap-2", className)}
	/>
))
PageHeaderActions.displayName = "PageHeaderActions"
