import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8', 
        lg: 'h-12 w-12'
    }

    return (
        <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
    )
}

interface FullPageLoadingProps {
    message?: string
}

export function FullPageLoading({ message = 'Loading...' }: FullPageLoadingProps) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d]">
            <div className="text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4 text-white" />
                <p className="text-gray-400">{message}</p>
            </div>
        </div>
    )
}

interface CardLoadingProps {
    rows?: number
    className?: string
}

export function CardLoading({ rows = 3, className = '' }: CardLoadingProps) {
    return (
        <div className={`animate-pulse ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded mb-2 last:mb-0" />
            ))}
        </div>
    )
}
