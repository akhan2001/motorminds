'use client'

import React from 'react'
import { ChatMessage, MiaProduct } from '../../hooks/useChat'

interface ChatMessagesProps {
    messages: ChatMessage[]
    isLoading: boolean
    scrollRef: React.RefObject<HTMLDivElement>
    onAddToCart: (product: MiaProduct) => void
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages,
    isLoading,
    scrollRef,
    onAddToCart
}) => {
    return (
        <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
        >
            {messages.map(message => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${
                        message.role === 'user' 
                            ? 'bg-[#b22222] text-white' 
                            : 'bg-[#2a2a2a] text-white'
                    } rounded-lg p-3`}>
                        <div className="text-sm">{message.content}</div>
                        
                        {/* Product recommendations */}
                        {message.products && message.products.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {message.products.map((product, index) => (
                                    <div key={index} className="bg-[#3a3a3a] rounded-lg p-3 border border-[#4a4a4a]">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-white text-sm">{product.partName}</h4>
                                            <span className="text-[#b22222] font-semibold text-sm">{product.price}</span>
                                        </div>
                                        <div className="text-xs text-[#979797] space-y-1">
                                            <div>Part #: {product.partNumber}</div>
                                            <div>Compatible: {product.compatible}</div>
                                            {product.supplier && (
                                                <div>Supplier: {product.supplier}</div>
                                            )}
                                            {product.availability && (
                                                <div className={`font-medium ${
                                                    product.availability.toLowerCase().includes('in stock') ? 'text-green-400' :
                                                    product.availability.toLowerCase().includes('out of stock') ? 'text-red-400' :
                                                    'text-yellow-400'
                                                }`}>
                                                    {product.availability}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            <button
                                                onClick={() => onAddToCart(product)}
                                                className="flex-1 px-3 py-1 bg-[#b22222] hover:bg-[#a01e1e] text-white text-xs rounded transition-colors"
                                            >
                                                Add to Cart
                                            </button>
                                            {product.link && (
                                                <a
                                                    href={product.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1 bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white text-xs rounded transition-colors"
                                                >
                                                    View
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sources and references */}
                        {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 border-t border-[#4a4a4a] pt-2">
                                <div className="text-xs text-[#979797] font-medium mb-2">Sources & References:</div>
                                <div className="space-y-1">
                                    {message.sources.slice(0, 3).map((source, index) => (
                                        <div key={index} className="text-xs">
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 underline"
                                            >
                                                {source.title}
                                            </a>
                                            {source.description && (
                                                <div className="text-[#979797] mt-0.5">{source.description.slice(0, 100)}...</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="text-xs text-gray-400 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-[#2a2a2a] rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-[#b22222] rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-[#b22222] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-[#b22222] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-[#979797] text-sm">Mia is thinking...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
