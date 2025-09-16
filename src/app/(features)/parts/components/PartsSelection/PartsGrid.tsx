'use client'

import React from 'react'
import { Part } from '../../hooks/usePartsData'
import { PartCard } from './PartCard'

interface PartsGridProps {
    parts: Part[]
    isLoading: boolean
    error: string | null
    onAddToCart: (part: Part) => void
}

export const PartsGrid: React.FC<PartsGridProps> = ({
    parts,
    isLoading,
    error,
    onAddToCart
}) => {
    if (isLoading) {
        return (
            <div className="text-center py-8 text-[#979797]">
                Loading parts...
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-400">
                Error: {error}
            </div>
        )
    }

    if (parts.length === 0) {
        return (
            <div className="text-center py-8 text-[#979797]">
                No parts available for this category
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-[#979797] mb-4">
                Found {parts.length} parts
            </div>
            {parts.map((part) => (
                <PartCard
                    key={part.id}
                    part={part}
                    onAddToCart={onAddToCart}
                />
            ))}
        </div>
    )
}
