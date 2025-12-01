'use client'

import React, { memo } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    isSearching?: boolean
    onClear?: () => void
    autoFocus?: boolean
}

/**
 * Optimized search input component with debouncing support
 * Follows engineering standards for component modularity
 */
export const SearchInput = memo<SearchInputProps>(({
    value,
    onChange,
    placeholder = "Search...",
    className,
    disabled = false,
    isSearching = false,
    onClear,
    autoFocus = false
}) => {
    const handleClear = () => {
        onChange('')
        onClear?.()
    }

    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-10 pr-10"
                disabled={disabled}
                autoFocus={autoFocus}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {isSearching && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {value && !disabled && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        tabIndex={-1}
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </Button>
                )}
            </div>
        </div>
    )
})

SearchInput.displayName = 'SearchInput'
