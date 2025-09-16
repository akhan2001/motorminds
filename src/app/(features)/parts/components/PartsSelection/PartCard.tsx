'use client'

import React from 'react'
import { Part } from '../../hooks/usePartsData'

interface PartCardProps {
    part: Part
    onAddToCart: (part: Part) => void
}

export const PartCard: React.FC<PartCardProps> = React.memo(({ part, onAddToCart }) => {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement
        target.style.display = 'none'
    }

    return (
        <div className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg p-4 hover:bg-[#4a4a4a] transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-4">
                    {part.imageUrl && (
                        <img 
                            src={part.imageUrl} 
                            alt={part.name}
                            className="w-16 h-16 object-cover rounded-lg bg-white p-1"
                            onError={handleImageError}
                        />
                    )}
                    <div>
                        <h3 className="font-semibold text-white text-lg">{part.name}</h3>
                        <div className="text-sm text-[#979797]">Article ID: {part.articleId}</div>
                    </div>
                </div>
                {part.price > 0 && (
                    <span className="text-[#b22222] font-bold text-lg">
                        ${part.price.toFixed(2)}
                    </span>
                )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[#979797] mb-3">
                <div>
                    <span className="font-medium">Article No:</span>
                    <div>{part.articleNo}</div>
                </div>
                <div>
                    <span className="font-medium">Supplier:</span>
                    <div>{part.supplier}</div>
                </div>
                <div>
                    <span className="font-medium">Supplier ID:</span>
                    <div>{part.supplierId}</div>
                </div>
                <div>
                    <span className="font-medium">Availability:</span>
                    <div>{part.availability}</div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={() => onAddToCart(part)}
                    className="px-4 py-2 bg-[#b22222] hover:bg-[#a01e1e] text-white text-sm rounded transition-colors"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    )
})
