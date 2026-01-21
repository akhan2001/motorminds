'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScaffoldContainer } from '@/components/layout'
import { LoadingSpinner } from './loading-states'

interface PageLoadingProps {
	title: string
	description?: string
	/** Spinner color class, e.g. "text-blue-500" or "text-red-500" */
	spinnerColor?: string
}

/**
 * Centered loading state for full-page loading
 */
export function PageLoading({ 
	title, 
	description = 'Please wait...', 
	spinnerColor = 'text-blue-500' 
}: PageLoadingProps) {
	return (
		<ScaffoldContainer size="full" className="h-full flex items-center justify-center">
			<Card className="bg-card border-border">
				<CardContent className="flex items-center gap-4 p-6">
					<LoadingSpinner size="md" className={spinnerColor} />
					<div>
						<p className="text-foreground font-medium">{title}</p>
						<p className="text-muted-foreground text-sm">{description}</p>
					</div>
				</CardContent>
			</Card>
		</ScaffoldContainer>
	)
}

interface PageErrorProps {
	title: string
	error?: Error | string | null
	/** Called when retry button is clicked */
	onRetry?: () => void
	retryLabel?: string
}

/**
 * Centered error state for page-level errors
 */
export function PageError({ 
	title, 
	error, 
	onRetry,
	retryLabel = 'Try Again'
}: PageErrorProps) {
	const errorMessage = error 
		? (typeof error === 'string' ? error : error.message) 
		: 'Unknown error occurred'

	return (
		<ScaffoldContainer size="full" className="h-full flex items-center justify-center">
			<Card className="bg-card border-border">
				<CardContent className="flex items-center gap-4 p-6">
					<AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
					<div>
						<p className="text-foreground font-medium">{title}</p>
						<p className="text-muted-foreground text-sm mb-3">{errorMessage}</p>
						{onRetry && (
							<Button 
								onClick={onRetry}
								className="bg-red-600 hover:bg-red-700 text-white"
								size="sm"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								{retryLabel}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</ScaffoldContainer>
	)
}

interface PageAuthRequiredProps {
	/** What the user is trying to access */
	resource?: string
}

/**
 * Centered auth required state
 */
export function PageAuthRequired({ resource = 'this page' }: PageAuthRequiredProps) {
	return (
		<ScaffoldContainer size="full" className="h-full flex items-center justify-center">
			<Card className="bg-card border-border">
				<CardContent className="flex items-center gap-4 p-6">
					<AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
					<div>
						<p className="text-foreground font-medium">Authentication Required</p>
						<p className="text-muted-foreground text-sm">
							Unable to access {resource}. Please ensure you are logged in.
						</p>
					</div>
				</CardContent>
			</Card>
		</ScaffoldContainer>
	)
}

interface PageStateGuardProps {
	/** Is the page loading? */
	isLoading: boolean
	/** Loading state title */
	loadingTitle: string
	/** Loading state description */
	loadingDescription?: string
	/** Error object or message */
	error?: Error | string | null
	/** Error state title */
	errorTitle?: string
	/** Retry handler for error state */
	onRetry?: () => void
	/** Is user authenticated with required data? */
	isAuthenticated: boolean
	/** Resource name for auth error message */
	authResource?: string
	/** Children to render when all checks pass */
	children: React.ReactNode
}

/**
 * Compound component that handles loading, error, and auth states
 * Renders children only when all checks pass
 */
export function PageStateGuard({
	isLoading,
	loadingTitle,
	loadingDescription,
	error,
	errorTitle,
	onRetry,
	isAuthenticated,
	authResource,
	children
}: PageStateGuardProps) {
	if (isLoading) {
		return <PageLoading title={loadingTitle} description={loadingDescription} />
	}

	if (error) {
		return <PageError title={errorTitle || 'Failed to Load'} error={error} onRetry={onRetry} />
	}

	if (!isAuthenticated) {
		return <PageAuthRequired resource={authResource} />
	}

	return <>{children}</>
}
