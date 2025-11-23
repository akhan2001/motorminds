'use client'

import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function SearchBar({ 
    value, 
    onChange, 
    placeholder = 'Search...',
    className = '' 
}: SearchBarProps) {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-10 pr-10"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange('')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}

