'use client'

import React from 'react'
import { ChatHeader } from './ChatHeader'
import { CartPanel } from './CartPanel'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { usePartsOrderingContext } from '../../context/PartsOrderingContext'

export const ChatPanel: React.FC = () => {
    const { chatData, cartData, vehicleData, vinData } = usePartsOrderingContext()

    const vehicleContext = {
        year: vehicleData.selection.year,
        make: vehicleData.selection.make,
        model: vehicleData.selection.model,
        engine: vehicleData.selectedEngine?.engineName
    }

    return (
        <div className="h-full bg-black flex flex-col">
            {/* Chat Header */}
            <ChatHeader
                cartCount={cartData.cart.length}
                cartVisible={cartData.cartVisible}
                onToggleCart={cartData.toggleCartVisibility}
            />

            {/* Cart Panel */}
            <CartPanel
                cart={cartData.cart}
                visible={cartData.cartVisible}
                customerNotes={cartData.customerNotes}
                setCustomerNotes={cartData.setCustomerNotes}
                isSubmitting={cartData.isSubmittingCart}
                submissionSuccess={cartData.submissionSuccess}
                submissionError={cartData.submissionError}
                onRemoveItem={cartData.removeFromCart}
                onSubmitCart={cartData.submitCart}
            />

            {/* Chat Messages */}
            <ChatMessages
                messages={chatData.chatMessages}
                isLoading={chatData.chatLoading}
                scrollRef={chatData.chatScrollRef}
                onAddToCart={cartData.addToCartFromMia}
            />

            {/* Chat Input */}
            <ChatInput
                chatInput={chatData.chatInput}
                setChatInput={chatData.setChatInput}
                isLoading={chatData.chatLoading}
                onSendMessage={chatData.sendChatMessage}
                onClearSession={chatData.clearChatSession}
                vehicleContext={vehicleContext}
                vinDecodeSuccess={vinData.vinDecodeSuccess}
            />
        </div>
    )
}
