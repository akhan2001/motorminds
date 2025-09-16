'use client'

import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { useVehicleSelection } from '../hooks/useVehicleSelection'
import { usePartsData } from '../hooks/usePartsData'
import { useChat } from '../hooks/useChat'
import { useCart } from '../hooks/useCart'
import { useVinDecoder } from '../hooks/useVinDecoder'
import { VehicleContext } from '../types'

interface PartsOrderingContextType {
    // Vehicle selection
    vehicleData: ReturnType<typeof useVehicleSelection>
    // Parts data
    partsData: ReturnType<typeof usePartsData>
    // Chat functionality
    chatData: ReturnType<typeof useChat>
    // Cart management
    cartData: ReturnType<typeof useCart>
    // VIN decoder
    vinData: ReturnType<typeof useVinDecoder>
}

const PartsOrderingContext = createContext<PartsOrderingContextType | undefined>(undefined)

export const usePartsOrderingContext = () => {
    const context = useContext(PartsOrderingContext)
    if (!context) {
        throw new Error('usePartsOrderingContext must be used within a PartsOrderingProvider')
    }
    return context
}

export const PartsOrderingProvider = ({ children }: { children: ReactNode }) => {
    const vehicleData = useVehicleSelection()
    const partsData = usePartsData(vehicleData.selectedEngine?.vehicleId)
    const chatData = useChat()
    const cartData = useCart()
    const vinData = useVinDecoder()

    // Update session context when vehicle selection changes
    useEffect(() => {
        if (chatData.sessionInitialized && (vehicleData.selection.year || vehicleData.selection.make || vehicleData.selection.model || vehicleData.selectedEngine)) {
            const vehicleContext: VehicleContext = {
                year: parseInt(vehicleData.selection.year) || undefined,
                make: vehicleData.selection.make || undefined,
                model: vehicleData.selection.model || undefined,
                manufacturer_id: vehicleData.selection.manufacturerId || undefined,
                vehicle_id: vehicleData.selectedEngine?.vehicleId || undefined,
                engine: vehicleData.selectedEngine?.engineName || undefined
            }
            chatData.updateSessionContext(vehicleContext)
        }
    }, [
        chatData.sessionInitialized, 
        chatData.updateSessionContext,
        vehicleData.selection.year, 
        vehicleData.selection.make, 
        vehicleData.selection.model, 
        vehicleData.selectedEngine
    ])

    // Handle VIN decode with proper integration
    const handleVinDecode = () => {
        vinData.handleVinDecode(
            (selection) => {
                vehicleData.setSelection(selection)
                // Clear VIN success if user manually changes selection later
                // This will be handled in the component
            },
            (context) => {
                if (chatData.sessionInitialized) {
                    chatData.updateSessionContext(context)
                }
            }
        )
    }

    // Clear VIN success when user manually changes vehicle selection
    useEffect(() => {
        if (vinData.vinDecodeSuccess && vehicleData.selection.make) {
            // User changed selection manually, clear VIN success
            const timer = setTimeout(() => {
                vinData.clearVinSuccess()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [vehicleData.selection, vinData.vinDecodeSuccess, vinData.clearVinSuccess])

    // Enhanced cart submission with chat integration
    const submitCartWithChatIntegration = async () => {
        const vehicleInfo = {
            year: vehicleData.selection.year,
            make: vehicleData.selection.make,
            model: vehicleData.selection.model,
            engine: vehicleData.selectedEngine ? {
                vehicleId: vehicleData.selectedEngine.vehicleId,
                engineName: vehicleData.selectedEngine.engineName,
                capacityLt: vehicleData.selectedEngine.capacityLt,
                numberOfCylinders: vehicleData.selectedEngine.numberOfCylinders
            } : undefined
        }

        const result = await cartData.submitCart(vehicleInfo)
        
        if (result) {
            // Add success message to chat
            const successMessage = {
                id: (Date.now() + 3).toString(),
                role: 'mia' as const,
                content: `✅ Your parts request has been submitted successfully! Request ID: ${result.requestId}. Our team will review your request and contact you with pricing and availability. You requested ${result.data.totalParts} items with an estimated total of $${result.data.totalEstimatedPrice.toFixed(2)} CAD.`,
                timestamp: new Date()
            }
            chatData.chatMessages.push(successMessage)
        }
        
        return result
    }

    // Enhanced add to cart from Mia with chat integration
    const addToCartFromMiaWithChat = (product: any) => {
        cartData.addToCartFromMia(product, (message) => {
            // Add the confirmation message to chat
            const currentMessages = [...chatData.chatMessages, message]
            // This will be handled by the chat hook itself
        })
    }

    const contextValue: PartsOrderingContextType = {
        vehicleData: {
            ...vehicleData,
            // Override VIN integration
            handleVinDecode
        },
        partsData,
        chatData: {
            ...chatData,
            // Override send message to include current vehicle context
            sendChatMessage: () => {
                const vehicleContext: VehicleContext = {
                    year: parseInt(vehicleData.selection.year) || undefined,
                    make: vehicleData.selection.make || undefined,
                    model: vehicleData.selection.model || undefined,
                    manufacturer_id: vehicleData.selection.manufacturerId || undefined,
                    vehicle_id: vehicleData.selectedEngine?.vehicleId || undefined,
                    engine: vehicleData.selectedEngine?.engineName || undefined
                }
                return chatData.sendChatMessage(vehicleContext)
            }
        },
        cartData: {
            ...cartData,
            // Override submit cart with chat integration
            submitCart: submitCartWithChatIntegration,
            // Override add from Mia with chat integration
            addToCartFromMia: addToCartFromMiaWithChat
        },
        vinData
    }

    return (
        <PartsOrderingContext.Provider value={contextValue}>
            {children}
        </PartsOrderingContext.Provider>
    )
}
