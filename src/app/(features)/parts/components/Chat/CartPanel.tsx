'use client'

import React from 'react'
import { Part } from '../../hooks/usePartsData'

interface CartPanelProps {
    cart: Part[]
    visible: boolean
    customerNotes: string
    setCustomerNotes: (notes: string) => void
    isSubmitting: boolean
    submissionSuccess: string | null
    submissionError: string | null
    onRemoveItem: (itemId: string) => void
    onSubmitCart: () => void
}

export const CartPanel: React.FC<CartPanelProps> = ({
    cart,
    visible,
    customerNotes,
    setCustomerNotes,
    isSubmitting,
    submissionSuccess,
    submissionError,
    onRemoveItem,
    onSubmitCart
}) => {
    if (!visible) return null

    return (
        <>
            {/* Cart Items Panel */}
            <div className="border-b border-[#2a2a2a] bg-[#0d0d0d] max-h-48 overflow-y-auto">
                <div className="p-3">
                    <h4 className="text-white font-medium text-sm mb-2">Cart Items</h4>
                    {cart.length === 0 ? (
                        <p className="text-[#979797] text-xs">No items in cart</p>
                    ) : (
                        <div className="space-y-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-start bg-[#2a2a2a] p-2 rounded text-xs">
                                    <div className="flex-1">
                                        <div className="text-white font-medium">{item.name}</div>
                                        <div className="text-[#979797]">{item.partNumber}</div>
                                        <div className="text-[#979797]">{item.supplier}</div>
                                        {item.price > 0 && (
                                            <div className="text-[#b22222] font-semibold">${item.price.toFixed(2)}</div>
                                        )}
                                        {item.fullInfo?.link && (
                                            <a
                                                href={item.fullInfo.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 text-xs underline"
                                            >
                                                View at supplier
                                            </a>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onRemoveItem(item.id)}
                                        className="text-red-400 hover:text-red-300 ml-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Submission Section */}
            {cart.length > 0 && (
                <div className="border-b border-[#2a2a2a] bg-[#0d0d0d] p-3">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                value={customerNotes}
                                onChange={(e) => setCustomerNotes(e.target.value)}
                                placeholder="Any specific requirements, urgency notes, or questions..."
                                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded text-white text-sm resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs text-[#979797]">
                                Total Items: {cart.length} | 
                                Est. Total: ${cart.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)} CAD
                            </div>

                            <button
                                onClick={onSubmitCart}
                                disabled={isSubmitting || cart.length === 0}
                                className="w-full px-4 py-2 bg-[#b22222] hover:bg-[#cc2222] disabled:bg-[#666] disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Parts Request'}
                            </button>

                            {submissionSuccess && (
                                <div className="p-3 bg-green-900/20 border border-green-700 rounded text-green-300 text-xs">
                                    {submissionSuccess}
                                </div>
                            )}

                            {submissionError && (
                                <div className="p-3 bg-red-900/20 border border-red-700 rounded text-red-300 text-xs">
                                    {submissionError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
