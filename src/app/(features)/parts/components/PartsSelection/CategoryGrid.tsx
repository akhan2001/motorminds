'use client'

import React from 'react'
import { PartsCategory } from '../../hooks/usePartsData'

interface CategoryGridProps {
    categories: PartsCategory[]
    selectedCategory: PartsCategory | null
    onCategoryChange: (categoryId: string) => void
    isLoading: boolean
}

export const CategoryGrid: React.FC<CategoryGridProps> = React.memo(({
    categories,
    selectedCategory,
    onCategoryChange,
    isLoading
}) => {
    if (isLoading) {
        return (
            <div className="text-center py-8 text-[#979797]">
                Loading categories...
            </div>
        )
    }

    if (categories.length === 0) {
        return (
            <div className="text-center py-8 text-[#979797]">
                No categories available for this engine
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {categories.map(category => (
                    <button 
                        key={category.categoryId}
                        onClick={() => onCategoryChange(category.categoryId.toString())}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                            selectedCategory?.categoryId === category.categoryId
                                ? 'bg-[#b22222] text-white'
                                : 'bg-[#3a3a3a] text-[#979797] hover:bg-[#4a4a4a] hover:text-white'
                        }`}
                    >
                        {category.categoryName}
                    </button>
                ))}
            </div>

            {/* Show selected category status */}
            {selectedCategory && (
                <div className="mt-4 p-3 bg-[#b22222]/10 border border-[#b22222]/20 rounded-lg">
                    <div className="text-sm text-[#b22222] font-medium">
                        Selected: {selectedCategory.categoryName}
                    </div>
                    <div className="text-xs text-[#979797] mt-1">
                        Parts will load automatically below
                    </div>
                </div>
            )}
        </div>
    )
})
