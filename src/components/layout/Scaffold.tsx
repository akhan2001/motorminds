"use client"

import { forwardRef, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

// Padding classes used across scaffold components
const PADDING_CLASSES = "px-4 md:px-6 xl:px-10"

/**
 * ScaffoldContainer - Main container with max-width and responsive padding.
 *
 * @param size - Container max-width: 'small' (768px), 'default' (1200px), 'large' (1600px), 'full' (none)
 * @param bottomPadding - Add bottom padding (useful for forms)
 */
export const ScaffoldContainer = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement> & {
		size?: "small" | "default" | "large" | "full"
		bottomPadding?: boolean
	}
>(({ className, size = "default", bottomPadding, ...props }, ref) => {
	const maxWidthClass = {
		small: "max-w-[768px]",
		default: "max-w-[1200px]",
		large: "max-w-[1600px]",
		full: "max-w-none",
	}[size]

	return (
		<div
			ref={ref}
			{...props}
			className={cn(
				"mx-auto w-full",
				maxWidthClass,
				PADDING_CLASSES,
				bottomPadding && "pb-16",
				className
			)}
		/>
	)
})
ScaffoldContainer.displayName = "ScaffoldContainer"

/**
 * ScaffoldHeader - Page header section.
 * Use with ScaffoldTitle and ScaffoldDescription.
 */
export const ScaffoldHeader = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement> & {
		isCompact?: boolean
	}
>(({ className, isCompact, ...props }, ref) => (
	<div
		ref={ref}
		{...props}
		className={cn(
			"flex flex-col gap-1",
			isCompact ? "py-4" : "py-6 md:py-8",
			className
		)}
	/>
))
ScaffoldHeader.displayName = "ScaffoldHeader"

/**
 * ScaffoldTitle - Main page title.
 */
export const ScaffoldTitle = forwardRef<
	HTMLHeadingElement,
	HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h1
		ref={ref}
		{...props}
		className={cn(
			"text-2xl md:text-3xl font-bold text-foreground",
			className
		)}
	/>
))
ScaffoldTitle.displayName = "ScaffoldTitle"

/**
 * ScaffoldDescription - Page subtitle/description.
 */
export const ScaffoldDescription = forwardRef<
	HTMLParagraphElement,
	HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		{...props}
		className={cn("text-sm text-muted-foreground", className)}
	/>
))
ScaffoldDescription.displayName = "ScaffoldDescription"

/**
 * ScaffoldSection - Two-column layout for settings-style pages.
 * Contains ScaffoldSectionDetail (left) and ScaffoldSectionContent (right).
 */
export const ScaffoldSection = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		{...props}
		className={cn(
			"flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-6",
			className
		)}
	/>
))
ScaffoldSection.displayName = "ScaffoldSection"

/**
 * ScaffoldSectionDetail - Left column in ScaffoldSection.
 * Contains title and description for the section.
 */
export const ScaffoldSectionDetail = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		{...props}
		className={cn("col-span-12 md:col-span-4 xl:col-span-5", className)}
	/>
))
ScaffoldSectionDetail.displayName = "ScaffoldSectionDetail"

/**
 * ScaffoldSectionContent - Right column in ScaffoldSection.
 * Contains the main content (forms, cards, etc.).
 */
export const ScaffoldSectionContent = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		{...props}
		className={cn("col-span-12 md:col-span-8 xl:col-span-7", className)}
	/>
))
ScaffoldSectionContent.displayName = "ScaffoldSectionContent"

/**
 * ScaffoldDivider - Horizontal separator between sections.
 */
export const ScaffoldDivider = forwardRef<
	HTMLHRElement,
	HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
	<hr
		ref={ref}
		{...props}
		className={cn("border-t border-border my-6", className)}
	/>
))
ScaffoldDivider.displayName = "ScaffoldDivider"

/**
 * ScaffoldActionsBar - Sticky actions bar at the bottom of a section.
 * Useful for form submit buttons.
 */
export const ScaffoldActionsBar = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		{...props}
		className={cn(
			"sticky bottom-0 bg-background border-t border-border py-4 mt-6",
			PADDING_CLASSES,
			className
		)}
	/>
))
ScaffoldActionsBar.displayName = "ScaffoldActionsBar"

/**
 * ScaffoldContent - General content area with consistent spacing.
 */
export const ScaffoldContent = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		{...props}
		className={cn("flex flex-col gap-6", className)}
	/>
))
ScaffoldContent.displayName = "ScaffoldContent"
