import { useState, useCallback } from 'react'
import { Part } from './usePartsData'
import { MiaProduct, ChatMessage } from './useChat'
import { sendPartsRequestEmail } from '@/lib/parts-request/parts-request-email-service'

export const useCart = () => {
    const [cart, setCart] = useState<Part[]>([])
    const [cartVisible, setCartVisible] = useState(false)
    
    // Cart submission state
    const [isSubmittingCart, setIsSubmittingCart] = useState(false)
    const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null)
    const [submissionError, setSubmissionError] = useState<string | null>(null)
    const [customerNotes, setCustomerNotes] = useState('')

    const addToCartFromMia = useCallback((product: MiaProduct, onAddMessage?: (message: ChatMessage) => void) => {
        setCart(prev => {
            // Check if this part number already exists in cart
            const existingItem = prev.find(item => 
                item.partNumber === product.partNumber && 
                item.supplier === (product.supplier || 'Online Supplier')
            )

            if (existingItem) {
                // Add message indicating item already exists
                if (onAddMessage) {
                    const alreadyExistsMessage: ChatMessage = {
                        id: (Date.now() + 2).toString(),
                        role: 'mia',
                        content: `ℹ️ "${product.partName}" (${product.partNumber}) is already in your cart!`,
                        timestamp: new Date()
                    }
                    onAddMessage(alreadyExistsMessage)
                }
                return prev // Don't add duplicate
            }

            const cartItem: Part = {
                id: `mia-${Date.now()}`,
                articleId: product.partNumber,
                articleNo: product.partNumber,
                name: product.partName,
                description: `${product.supplier ? `From ${product.supplier} - ` : ''}${product.compatible}`,
                supplier: product.supplier || 'Online Supplier',
                supplierId: 0,
                price: parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0,
                availability: product.availability || 'Available',
                partNumber: product.partNumber,
                brandName: product.supplier || 'Various',
                fullInfo: product
            }

            // Add confirmation message to chat if callback provided
            if (onAddMessage) {
                const confirmationMessage: ChatMessage = {
                    id: (Date.now() + 2).toString(),
                    role: 'mia',
                    content: `✅ Added "${product.partName}" (${product.partNumber}) from ${product.supplier || 'supplier'} to your cart!${product.link ? ` View details at supplier website.` : ''}`,
                    timestamp: new Date()
                }
                onAddMessage(confirmationMessage)
            }

            return [...prev, cartItem]
        })
    }, [])

    const addToCartFromCatalog = useCallback((part: Part) => {
        setCart(prev => {
            // Check if this part number already exists in cart
            const existingItem = prev.find(item => 
                item.partNumber === part.partNumber && 
                item.supplier === part.supplier
            )

            if (existingItem) {
                // Part already exists, don't add duplicate
                // You could add a toast notification here if needed
                console.log(`Part ${part.partNumber} from ${part.supplier} is already in cart`)
                return prev
            }

            return [...prev, part]
        })
    }, [])

    const removeFromCart = useCallback((itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId))
    }, [])

    const submitCart = useCallback(async (vehicleInfo: any) => {
        if (cart.length === 0) {
            setSubmissionError('Cart is empty. Please add items before submitting.')
            return null
        }

        setIsSubmittingCart(true)
        setSubmissionError(null)
        setSubmissionSuccess(null)

        try {
            const response = await fetch('/api/parts-requests/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parts: cart,
                    vehicleInfo,
                    customerNotes: customerNotes.trim() || undefined,
                    priority: 'normal'
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit parts request')
            }

            if (data.success) {
                // Send email notification following feedback pattern
                try {
                    const emailResult = await sendPartsRequestEmail({
                        partsRequestId: data.data.id,
                        shopId: '', // Will be retrieved from user context in service
                        vehicleInfo: vehicleInfo,
                        partsRequested: cart,
                        customerNotes: customerNotes.trim() || undefined,
                        totalEstimatedPrice: data.data.totalEstimatedPrice,
                        priority: 'normal'
                    })

                    if (!emailResult.success) {
                        console.error('Failed to send parts request email:', emailResult.error)
                        // Don't fail the submission if email fails
                    }
                } catch (emailError) {
                    console.error('Email notification error:', emailError)
                    // Don't fail the submission if email fails
                }

                setSubmissionSuccess(`Parts request submitted successfully! Request ID: ${data.requestId}. An email has been sent to info@motorminds.ca.`)
                setCart([]) // Clear cart after successful submission
                setCustomerNotes('')
                return data
            }

        } catch (error) {
            console.error('Cart submission error:', error)
            setSubmissionError(error instanceof Error ? error.message : 'Failed to submit parts request. Please try again.')
            return null
        } finally {
            setIsSubmittingCart(false)
        }
    }, [cart, customerNotes])

    const clearCart = useCallback(() => {
        setCart([])
        setCustomerNotes('')
        setSubmissionSuccess(null)
        setSubmissionError(null)
    }, [])

    const toggleCartVisibility = useCallback(() => {
        setCartVisible(prev => !prev)
    }, [])

    return {
        cart,
        cartVisible,
        setCartVisible,
        toggleCartVisibility,
        isSubmittingCart,
        submissionSuccess,
        submissionError,
        customerNotes,
        setCustomerNotes,
        addToCartFromMia,
        addToCartFromCatalog,
        removeFromCart,
        submitCart,
        clearCart
    }
}
