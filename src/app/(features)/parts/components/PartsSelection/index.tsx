'use client'

import React from 'react'
import { CategoryGrid } from './CategoryGrid'
import { PartsGrid } from './PartsGrid'
import { usePartsOrderingContext } from '../../context/PartsOrderingContext'

export const PartsSelection: React.FC = () => {
    const { vehicleData, partsData, cartData } = usePartsOrderingContext()

    // Only show if an engine is selected
    if (!vehicleData.selectedEngine) {
        return null
    }

    return (
        <div className="space-y-6">
            {/* Step 3: Category Selection */}
            <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-[#b22222] mb-4">
                    Step 3: Select Parts Category
                </h2>
                
                <CategoryGrid
                    categories={partsData.categories}
                    selectedCategory={partsData.selectedCategory}
                    onCategoryChange={partsData.setSelectedCategory}
                    isLoading={partsData.categoriesLoading}
                />
            </div>

            {/* Step 4: Parts Display */}
            {partsData.selectedCategory && (
                <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-[#b22222] mb-4">
                        Step 4: Available Parts
                    </h2>
                    
                    <PartsGrid
                        parts={partsData.parts}
                        isLoading={partsData.partsLoading}
                        error={partsData.partsError}
                        onAddToCart={cartData.addToCartFromCatalog}
                    />
                </div>
            )}
        </div>
    )
}
