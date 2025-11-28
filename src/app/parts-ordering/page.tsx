"use client"

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Nav } from "../components/nav"
import { useState, useEffect, useRef } from "react"
import MakeModelSelector, { MakeModelSelection } from "@/components/ui/make-model-selector"
import { decodeVin } from "@/app/(features)/customers/vehicles/lib/vin-decode"

interface VehicleEngine {
    vehicleId: number
    engineType: string
    engineName: string
    capacityLt: string
    numberOfCylinders: number | string
    displacement: string
    power: string
    fuelType: string
    engineCodes?: string
    bodyType?: string
    constructionPeriod?: string
    uniqueKey?: string
}

interface PartsCategory {
    categoryId: number
    categoryName: string
    level: number
    levelId?: number
}

interface Part {
    id: string
    articleId: string  // For detailed API calls
    articleNo: string  // For article number searches
    name: string
    description: string
    supplier: string
    supplierId: number
    price: number
    availability: string
    imageUrl?: string
    partNumber: string // Additional part identification
    brandName: string // Brand/manufacturer name
    productId?: number // Product category ID
    mediaType?: string // Image media type (JPEG, GIF, etc.)
    mediaFileName?: string // Original media file name
    fullInfo?: any    // Original API data for debugging
}

interface ChatMessage {
    id: string
    role: 'user' | 'mia'
    content: string
    products?: MiaProduct[]
    sources?: Source[]
    timestamp: Date
}

interface MiaProduct {
    partName: string
    partNumber: string
    compatible: string
    price: string
    supplier?: string
    availability?: string
    link?: string
}

interface Source {
    title: string
    url: string
    description: string
}

export default function PartsOrdering() {
    const [selection, setSelection] = useState<MakeModelSelection>({
        make: '',
        manufacturerId: null,
        model: '',
        modelId: null,
        year: ''
    })

    const [engines, setEngines] = useState<VehicleEngine[]>([])
    const [enginesLoading, setEnginesLoading] = useState(false)
    const [selectedEngine, setSelectedEngine] = useState<VehicleEngine | null>(null)

    const [categories, setCategories] = useState<PartsCategory[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<PartsCategory | null>(null)


    const [parts, setParts] = useState<Part[]>([])
    const [partsLoading, setPartsLoading] = useState(false)
    const [partsError, setPartsError] = useState<string | null>(null)

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [sessionInitialized, setSessionInitialized] = useState(false)
    const chatScrollRef = useRef<HTMLDivElement>(null)

    // Cart state (shared between catalog and AI)
    const [cart, setCart] = useState<Part[]>([])
    const [cartVisible, setCartVisible] = useState(false)
    
    // Cart submission state
    const [isSubmittingCart, setIsSubmittingCart] = useState(false)
    const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null)
    const [submissionError, setSubmissionError] = useState<string | null>(null)
    const [customerNotes, setCustomerNotes] = useState('')

    // VIN decode state
    const [vinInput, setVinInput] = useState('')
    const [vinDecoding, setVinDecoding] = useState(false)
    const [vinDecodeError, setVinDecodeError] = useState<string | null>(null)
    const [vinDecodeSuccess, setVinDecodeSuccess] = useState<string | null>(null)
    const [showVinInput, setShowVinInput] = useState(false)

    const handleSelectionChange = (newSelection: MakeModelSelection) => {
        setSelection(newSelection)
        
        // Reset downstream selections when vehicle changes
        setSelectedEngine(null)
        setSelectedCategory(null)
        setParts([])
        setEngines([])
        setCategories([])
        
        // Clear VIN success message if user manually changes selection
        if (vinDecodeSuccess) {
            setVinDecodeSuccess(null)
        }
    }

    // Fetch vehicle engines when make/model selection is complete
    useEffect(() => {
        if (selection.manufacturerId && selection.modelId) {
            fetchVehicleEngines()
        }
    }, [selection.manufacturerId, selection.modelId])

    // Auto-fetch parts when both engine and category are selected
    useEffect(() => {
        if (selectedEngine && selectedCategory) {
        fetchParts()
        }
    }, [selectedEngine, selectedCategory])

    // Update session context when vehicle selection changes
    useEffect(() => {
        if (sessionInitialized && (selection.year || selection.make || selection.model || selectedEngine)) {
            updateSessionContext({
                year: parseInt(selection.year) || undefined,
                make: selection.make || undefined,
                model: selection.model || undefined,
                manufacturer_id: selection.manufacturerId || undefined,
                vehicle_id: selectedEngine?.vehicleId || undefined,
                engine: selectedEngine?.engineName || undefined
            })
        }
    }, [sessionInitialized, selection.year, selection.make, selection.model, selectedEngine])

    // Initialize chat session and load message history
    useEffect(() => {
        initializeSession()
    }, [])

    const initializeSession = async (skipHistory = false) => {
        try {
            console.log('🔄 Initializing session, skipHistory:', skipHistory)
            // Get or create session
            const response = await fetch('/api/mia/session')
            const data = await response.json()
            
            if (data.session) {
                console.log('✅ Got session:', data.session.session_id)
                setSessionId(data.session.session_id)
                
                if (!skipHistory) {
                    // Load message history
                    console.log('📜 Loading message history...')
                    const messagesResponse = await fetch(`/api/mia/messages?sessionId=${data.session.session_id}`)
                    const messagesData = await messagesResponse.json()
                    
                    if (messagesData.messages && messagesData.messages.length > 0) {
                        console.log('📝 Found', messagesData.messages.length, 'messages, restoring...')
                        // Convert stored messages to chat messages format
                        const convertedMessages = messagesData.messages.map((msg: any) => ({
                            id: msg.id,
                            role: msg.role === 'assistant' ? 'mia' : msg.role,
                            content: msg.content,
                            products: msg.metadata?.parts || [],
                            sources: msg.metadata?.sources || [],
                            timestamp: new Date(msg.created_at)
                        }))
                        setChatMessages(convertedMessages)
                    } else {
                        console.log('📝 No message history, showing welcome message')
                        // No message history, show welcome message
                        setChatMessages([{
                            id: '1',
                            role: 'mia',
                            content: "Hi! I'm Mia, your AI parts advisor. I can help you find the right parts for your vehicle. Just describe what you need!",
                            timestamp: new Date()
                        }])
                    }
                } else {
                    console.log('⏭️ Skipping history load, showing fresh welcome message')
                    // Skip history and show fresh welcome message
                    setChatMessages([{
                        id: '1',
                        role: 'mia',
                        content: "Hi! I'm Mia, your AI parts advisor. I can help you find the right parts for your vehicle. Just describe what you need!",
                        timestamp: new Date()
                    }])
                }
                
                // Update session with current vehicle context if any
                if (selection.year || selection.make || selection.model) {
                    await updateSessionContext({
                        year: parseInt(selection.year) || undefined,
                        make: selection.make || undefined,
                        model: selection.model || undefined,
                        manufacturer_id: selection.manufacturerId || undefined,
                        vehicle_id: selectedEngine?.vehicleId || undefined,
                        engine: selectedEngine?.engineName || undefined
                    })
                }
            }
            setSessionInitialized(true)
        } catch (error) {
            console.error('Failed to initialize session:', error)
            // Fallback to local welcome message
            setChatMessages([{
                id: '1',
                role: 'mia',
                content: "Hi! I'm Mia, your AI parts advisor. I can help you find the right parts for your vehicle. Just describe what you need!",
                timestamp: new Date()
            }])
            setSessionInitialized(true)
        }
    }

    const updateSessionContext = async (vehicleContext: any) => {
        if (!sessionId) return
        
        try {
            await fetch('/api/mia/session', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, vehicleContext })
            })
        } catch (error) {
            console.error('Failed to update session context:', error)
        }
    }

    const handleVinDecode = async () => {
        if (!vinInput.trim()) {
            setVinDecodeError('Please enter a VIN number')
            return
        }

        setVinDecoding(true)
        setVinDecodeError(null)
        setVinDecodeSuccess(null)

        try {
            const decodedVehicle = await decodeVin(vinInput.trim())
            
            if (decodedVehicle) {
                // Auto-populate the vehicle selection with decoded information
                setSelection({
                    make: decodedVehicle.make || '',
                    manufacturerId: null, // Will be resolved by MakeModelSelector
                    model: decodedVehicle.model || '',
                    modelId: null, // Will be resolved by MakeModelSelector
                    year: decodedVehicle.year || ''
                })

                // Reset downstream selections since we're changing the vehicle
                setSelectedEngine(null)
                setSelectedCategory(null)
                setParts([])
                setEngines([])
                setCategories([])

                setVinDecodeSuccess(`Successfully decoded VIN: ${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model}${decodedVehicle.engine ? ` (${decodedVehicle.engine})` : ''}`)
                
                // Clear VIN input and hide VIN section
                setVinInput('')
                setShowVinInput(false)

                // Update session context with VIN decode information
                if (sessionInitialized) {
                    await updateSessionContext({
                        year: parseInt(decodedVehicle.year) || undefined,
                        make: decodedVehicle.make || undefined,
                        model: decodedVehicle.model || undefined,
                        vin: vinInput.trim(),
                        vin_engine: decodedVehicle.engine || undefined,
                        vin_trim: decodedVehicle.trim || undefined,
                        vin_drivetrain: decodedVehicle.drivetrain || undefined
                    })
                }
            }
        } catch (error) {
            console.error('VIN decode error:', error)
            setVinDecodeError(error instanceof Error ? error.message : 'Failed to decode VIN. Please check the VIN and try again.')
        } finally {
            setVinDecoding(false)
        }
    }

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
        }
    }, [chatMessages])

    const fetchVehicleEngines = async () => {
        try {
            setEnginesLoading(true)
            const response = await fetch(`/api/parts-ordering/vehicle-engines?manufacturerId=${selection.manufacturerId}&modelId=${selection.modelId}`)
            const data = await response.json()
            
            if (data.success) {
                // Parse engine data based on API response structure
                const engineData = Array.isArray(data.data) ? data.data.map((engine: any, index: number) => ({
                    vehicleId: engine.vehicleId,
                    engineType: engine.engineType || engine.engineName,
                    engineName: engine.engineName || engine.engineType,
                    capacityLt: engine.capacityLt || '',
                    numberOfCylinders: engine.numberOfCylinders || '',
                    displacement: engine.displacement || '',
                    power: engine.power || '',
                    fuelType: engine.fuelType || '',
                    engineCodes: engine.engineCodes || '',
                    bodyType: engine.bodyType || '',
                    constructionPeriod: engine.constructionPeriod || '',
                    uniqueKey: `${engine.vehicleId}-${index}` // Add unique key for React rendering
                })) : []
                
                setEngines(engineData)
            } else {
                setEngines([])
            }
        } catch (err) {
            setEngines([])
        } finally {
            setEnginesLoading(false)
        }
    }

    const fetchCategories = async (vehicleId: number) => {
        try {
            setCategoriesLoading(true)
            
            // Call the Get Category v3 API endpoint with vehicleId only
            const response = await fetch(`/api/parts-ordering/categories?vehicleId=${vehicleId}`)
            const data = await response.json()
            
            if (data.success) {
                // Transform API response - only use main categories (level 1), ignore children
                const categoryArray: PartsCategory[] = Array.isArray(data.data) ? data.data
                    .filter((category: any) => category.level === 1) // Only main categories
                    .map((category: any) => ({
                        categoryId: category.categoryId,
                        categoryName: category.categoryName,
                        level: category.level,
                        levelId: category.categoryId
                    })) : []
                
                // Sort alphabetically by category name
                const sortedCategories = categoryArray.sort((a, b) => 
                    a.categoryName.localeCompare(b.categoryName)
                )
                
                setCategories(sortedCategories)
            } else {
                setCategories([])
            }
        } catch (err) {
            setCategories([])
        } finally {
            setCategoriesLoading(false)
        }
    }

    const fetchParts = async () => {
        if (!selectedEngine || !selectedCategory) return
        
        try {
            setPartsLoading(true)
            setPartsError(null)
            
            // Use categoryId as productGroupId for the API call
            const response = await fetch(`/api/parts-ordering/parts?vehicleId=${selectedEngine.vehicleId}&productGroupId=${selectedCategory.categoryId}`)
            const data = await response.json()
            
            if (data.success) {
                setParts(data.data || [])
            } else {
                setPartsError(data.message || 'Failed to fetch parts')
                setParts([])
            }
        } catch (err) {
            setPartsError('Error loading parts')
            setParts([])
        } finally {
            setPartsLoading(false)
        }
    }

    const handleEngineChange = (engineId: string) => {
        const engine = engines.find(e => e.vehicleId.toString() === engineId)
        setSelectedEngine(engine || null)
        setSelectedCategory(null)
        setParts([])
        
        if (engine) {
            fetchCategories(engine.vehicleId)
        }
    }

    const handleCategoryChange = (categoryId: string) => {
        const category = categories.find(c => c.categoryId.toString() === categoryId)
        setSelectedCategory(category || null)
        setParts([])
    }

    // Chat functions
    const sendChatMessage = async () => {
        if (!chatInput.trim() || chatLoading || !sessionId) return

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput.trim(),
            timestamp: new Date()
        }

        setChatMessages(prev => [...prev, userMessage])
        setChatInput('')
        setChatLoading(true)

        try {
            // Create vehicle context object
            const vehicleContext = {
                year: parseInt(selection.year) || undefined,
                make: selection.make || undefined,
                model: selection.model || undefined,
                manufacturer_id: selection.manufacturerId || undefined,
                vehicle_id: selectedEngine?.vehicleId || undefined,
                engine: selectedEngine?.engineName || undefined
            }

            const response = await fetch('/api/mia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    vehicleContext,
                    sessionId
                })
            })

            const data = await response.json()

            if (data.success) {
                const miaMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'mia',
                    content: data.message,
                    products: data.products || [],
                    sources: data.sources || [],
                    timestamp: new Date()
                }

                setChatMessages(prev => [...prev, miaMessage])
            } else {
                throw new Error(data.error || 'Failed to get response')
            }
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'mia',
                content: "I'm sorry, I'm having trouble processing your request. Please try again.",
                timestamp: new Date()
            }
            setChatMessages(prev => [...prev, errorMessage])
        } finally {
            setChatLoading(false)
        }
    }

    // Clear session function
    const clearChatSession = async () => {
        console.log('🔧 Clear button clicked!')
        console.log('Current sessionId:', sessionId)
        console.log('Current chatLoading:', chatLoading)
        
        if (!sessionId) {
            console.log('❌ No sessionId, returning early')
            return
        }
        
        try {
            console.log('🗑️ Calling DELETE /api/mia/session')
            const response = await fetch(`/api/mia/session?sessionId=${sessionId}`, {
                method: 'DELETE'
            })
            
            const result = await response.json()
            console.log('✅ Session delete response:', result)
            
            // Reset local state
            console.log('🔄 Resetting local state...')
            setSessionId(null)
            setSessionInitialized(false)
            setChatMessages([])
            
            // Reinitialize session (skip loading old history)
            console.log('🆕 Reinitializing session...')
            await initializeSession(true) // Skip history loading
            console.log('✅ Session cleared and reinitialized!')
        } catch (error) {
            console.error('❌ Failed to clear session:', error)
        }
    }

    const addToCartFromMia = (product: MiaProduct) => {
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

        setCart(prev => [...prev, cartItem])

        // Add confirmation message to chat
        const confirmationMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'mia',
            content: `✅ Added "${product.partName}" (${product.partNumber}) from ${product.supplier || 'supplier'} to your cart!${product.link ? ` View details at supplier website.` : ''}`,
            timestamp: new Date()
        }

        setChatMessages(prev => [...prev, confirmationMessage])
    }

    const addToCartFromCatalog = (part: Part) => {
        setCart(prev => [...prev, part])
        // Optional: Add success notification
    }

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId))
    }

    const submitCart = async () => {
        if (cart.length === 0) {
            setSubmissionError('Cart is empty. Please add items before submitting.')
            return
        }

        setIsSubmittingCart(true)
        setSubmissionError(null)
        setSubmissionSuccess(null)

        try {
            // Prepare vehicle information
            const vehicleInfo = {
                year: selection.year,
                make: selection.make,
                model: selection.model,
                engine: selectedEngine ? {
                    vehicleId: selectedEngine.vehicleId,
                    engineName: selectedEngine.engineName,
                    capacityLt: selectedEngine.capacityLt,
                    numberOfCylinders: selectedEngine.numberOfCylinders
                } : undefined
            }

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
                setSubmissionSuccess(`Parts request submitted successfully! Request ID: ${data.requestId}. Our team will review and contact you soon.`)
                setCart([]) // Clear cart after successful submission
                setCustomerNotes('')
                
                // Add success message to chat
                const successMessage: ChatMessage = {
                    id: (Date.now() + 3).toString(),
                    role: 'mia',
                    content: `✅ Your parts request has been submitted successfully! Request ID: ${data.requestId}. Our team will review your request and contact you with pricing and availability. You requested ${data.data.totalParts} items with an estimated total of $${data.data.totalEstimatedPrice.toFixed(2)} CAD.`,
                    timestamp: new Date()
                }
                setChatMessages(prev => [...prev, successMessage])
            }

        } catch (error) {
            console.error('Cart submission error:', error)
            setSubmissionError(error instanceof Error ? error.message : 'Failed to submit parts request. Please try again.')
        } finally {
            setIsSubmittingCart(false)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={60} minSize={55} maxSize={65}>
                        <div className="h-full bg-slate-50 dark:bg-card border-r border-border overflow-y-auto">
                            <div className="p-6">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-bold text-red-600 mb-2">Auto Parts Catalog</h1>
                                    <p className="text-muted-foreground">Find the right parts for your vehicle</p>
                            </div>

                                {/* VIN Decode Section */}
                                <div className="bg-white dark:bg-card border border-border rounded-lg p-6 mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-red-600">
                                            Quick Start with VIN
                                        </h2>
                                        <button
                                            onClick={() => setShowVinInput(!showVinInput)}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                                        >
                                            {showVinInput ? 'Hide VIN' : 'Use VIN'}
                                        </button>
                                    </div>
                                    
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Have your vehicle's VIN? We can automatically fill in your vehicle details.
                                    </p>

                                    {showVinInput && (
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={vinInput}
                                                    onChange={(e) => {
                                                        setVinInput(e.target.value.toUpperCase())
                                                        setVinDecodeError(null)
                                                        setVinDecodeSuccess(null)
                                                    }}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleVinDecode()}
                                                    placeholder="Enter VIN (17 characters)"
                                                    maxLength={17}
                                                    disabled={vinDecoding}
                                                    className="flex-1 px-3 py-2 bg-white dark:bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-red-600 transition-colors disabled:opacity-50"
                                                />
                                                <button
                                                    onClick={handleVinDecode}
                                                    disabled={vinDecoding || !vinInput.trim()}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-muted disabled:cursor-not-allowed text-white rounded transition-colors"
                                                >
                                                    {vinDecoding ? 'Decoding...' : 'Decode VIN'}
                                                </button>
                                            </div>

                                            {vinDecodeError && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-600 dark:text-red-300 text-sm">
                                                    {vinDecodeError}
                                                </div>
                                            )}

                                            {vinDecodeSuccess && (
                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded text-green-600 dark:text-green-300 text-sm">
                                                    {vinDecodeSuccess}
                                                </div>
                                            )}

                                            <div className="text-xs text-muted-foreground">
                                                <p>VIN should be 17 characters and contain both letters and numbers.</p>
                                                <p>VIN Decoding is only available for vehicles made in the North American region. If there is no match, please manually select your vehicle.</p>
                                            </div>
                                        </div>
                                    )}
                            </div>

                                {/* Step 1: Vehicle Selection */}
                                <div className="bg-white dark:bg-card border border-border rounded-lg p-6 mb-6">
                                    <h2 className="text-xl font-semibold text-red-600 mb-4">
                                        Step 1: Select Your Vehicle
                                    </h2>
                                    
                                    <MakeModelSelector
                                        value={selection}
                                        onChange={handleSelectionChange}
                                        showLabels={true}
                                        placeholder={{
                                            make: "Select a manufacturer",
                                            model: "Select a model",
                                            year: "Select a year"
                                        }}
                                    />
                                </div>

                                {/* Step 2: Engine Selection */}
                                {selection.make && selection.model && selection.year && (
                                    <div className="bg-white dark:bg-card border border-border rounded-lg p-6 mb-6">
                                        <h2 className="text-xl font-semibold text-red-600 mb-4">
                                            Step 2: Select Engine Type
                                        </h2>
                                        
                                        {enginesLoading ? (
                                            <div className="text-center py-8 text-muted-foreground">Loading engines...</div>
                                        ) : engines.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {engines.map((engine, index) => (
                                                    <div
                                                        key={engine.uniqueKey || `${engine.vehicleId}-${index}`}
                                                        onClick={() => handleEngineChange(engine.vehicleId.toString())}
                                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-red-600 ${
                                                            selectedEngine?.vehicleId === engine.vehicleId
                                                                ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                                                                : 'border-border hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <div className="font-semibold text-foreground mb-2">{engine.engineName}</div>
                                                        <div className="text-sm text-muted-foreground space-y-1">
                                                            <div>Displacement: {engine.capacityLt}L</div>
                                                            <div>Cylinders: {engine.numberOfCylinders}</div>
                                                            {engine.power && <div>Power: {engine.power}</div>}
                                                            {engine.fuelType && <div>Fuel: {engine.fuelType}</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">No engines available for this model</div>
                                        )}
                                </div>
                                )}

                                {/* Step 3: Category Selection */}
                                {selectedEngine && (
                                    <div className="bg-white dark:bg-card border border-border rounded-lg p-6 mb-6">
                                        <h2 className="text-xl font-semibold text-red-600 mb-4">
                                            Step 3: Select Parts Category
                                        </h2>
                                        
                                        {categoriesLoading ? (
                                            <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
                                        ) : categories.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                                                {categories.map(category => (
                                    <button 
                                                        key={category.categoryId}
                                                        onClick={() => handleCategoryChange(category.categoryId.toString())}
                                                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                                            selectedCategory?.categoryId === category.categoryId
                                                                ? 'bg-red-600 text-white'
                                                                : 'bg-slate-50 dark:bg-muted text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-500 border border-border'
                                                        }`}
                                                    >
                                                        {category.categoryName}
                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">No categories available for this engine</div>
                                        )}

                                        {/* Show selected category status */}
                                        {selectedCategory && (
                                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 rounded-lg">
                                                <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                                                    Selected: {selectedCategory.categoryName}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Parts will load automatically below
                                </div>
                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 4: Parts Display */}
                                {selectedCategory && (
                                    <div className="bg-white dark:bg-card border border-border rounded-lg p-6">
                                        <h2 className="text-xl font-semibold text-red-600 mb-4">
                                            Step 4: Available Parts
                                        </h2>
                                        
                                        {partsLoading ? (
                                            <div className="text-center py-8 text-muted-foreground">Loading parts...</div>
                                        ) : partsError ? (
                                            <div className="text-center py-8 text-red-600 dark:text-red-400">Error: {partsError}</div>
                                        ) : parts.length > 0 ? (
                                            <div className="space-y-4">
                                                <div className="text-sm text-muted-foreground mb-4">Found {parts.length} parts</div>
                                                {parts.map((part) => (
                                                    <div key={part.id} className="bg-slate-50 dark:bg-background border border-border rounded-lg p-4 hover:bg-muted/50 hover:border-red-300 dark:hover:border-red-500 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-start gap-4">
                                                                {part.imageUrl && (
                                                                    <img 
                                                                        src={part.imageUrl} 
                                                                        alt={part.name}
                                                                        className="w-16 h-16 object-cover rounded-lg bg-white p-1"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement
                                                                            target.style.display = 'none'
                                                                        }}
                                                                    />
                                                                )}
                                                                <div>
                                                                    <h3 className="font-semibold text-foreground text-lg">{part.name}</h3>
                                                                    <div className="text-sm text-muted-foreground">Article ID: {part.articleId}</div>
                                </div>
                                </div>
                                                            {part.price > 0 && (
                                                                <span className="text-red-600 font-bold text-lg">${part.price.toFixed(2)}</span>
                                                    )}
                                                </div>
                                                        
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                                                            <div>
                                                                <span className="font-medium text-foreground">Article No:</span>
                                                                <div>{part.articleNo}</div>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-foreground">Supplier:</span>
                                                                <div>{part.supplier}</div>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-foreground">Supplier ID:</span>
                                                                <div>{part.supplierId}</div>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-foreground">Availability:</span>
                                                                <div>{part.availability}</div>
                                                            </div>
                                                    </div>

                                                        <div className="flex justify-end">
                                                    <button 
                                                                onClick={() => addToCartFromCatalog(part)}
                                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                                                    >
                                                        Add to Cart
                                                    </button>
                                            </div>
                                        </div>
                                    ))}
                                            </div>
                                        ) : selectedCategory ? (
                                            <div className="text-center py-8 text-muted-foreground">No parts available for this category</div>
                                        ) : null}
                                </div>
                            )}
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={40} minSize={35} maxSize={45}>
                        <div className="h-full bg-slate-50 dark:bg-card flex flex-col">
                            {/* Chat Header */}
                            <div className="border-b border-border p-4 bg-white dark:bg-background">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-sm">M</span>
                                        </div>
                                        <div>
                                            <h3 className="text-foreground font-semibold">Mia AI</h3>
                                            <p className="text-muted-foreground text-xs">Parts Advisor</p>
                                        </div>
                                    </div>
                                    {cart.length > 0 && (
                                        <button
                                            onClick={() => setCartVisible(!cartVisible)}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                        >
                                            Cart ({cart.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Cart Panel */}
                            {cartVisible && (
                                <div className="border-b border-border bg-white dark:bg-background max-h-48 overflow-y-auto">
                                    <div className="p-3">
                                        <h4 className="text-foreground font-medium text-sm mb-2">Cart Items</h4>
                                        {cart.length === 0 ? (
                                            <p className="text-muted-foreground text-xs">No items in cart</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {cart.map(item => (
                                                    <div key={item.id} className="flex justify-between items-start bg-slate-50 dark:bg-card p-2 rounded text-xs border border-border">
                                                        <div className="flex-1">
                                                            <div className="text-foreground font-medium">{item.name}</div>
                                                            <div className="text-muted-foreground">{item.partNumber}</div>
                                                            <div className="text-muted-foreground">{item.supplier}</div>
                                                            {item.price > 0 && (
                                                                <div className="text-red-600 font-semibold">${item.price.toFixed(2)}</div>
                                                            )}
                                                            {item.fullInfo?.link && (
                                                                <a
                                                                    href={item.fullInfo.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs underline"
                                                                >
                                                                    View at supplier
                                                                </a>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cart Submission Section */}
                            {cart.length > 0 && (
                                <div className="border-b border-border bg-white dark:bg-background p-3">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-foreground text-sm font-medium mb-2">
                                                Additional Notes (Optional)
                                            </label>
                                            <textarea
                                                value={customerNotes}
                                                onChange={(e) => setCustomerNotes(e.target.value)}
                                                placeholder="Any specific requirements, urgency notes, or questions..."
                                                className="w-full px-3 py-2 bg-white dark:bg-background border border-border rounded text-foreground text-sm resize-none"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground">
                                                Total Items: {cart.length} | 
                                                Est. Total: ${cart.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)} CAD
                                            </div>

                                            <button
                                                onClick={submitCart}
                                                disabled={isSubmittingCart || cart.length === 0}
                                                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-muted disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                                            >
                                                {isSubmittingCart ? 'Submitting...' : 'Submit Parts Request'}
                                            </button>

                                            {submissionSuccess && (
                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded text-green-600 dark:text-green-300 text-xs">
                                                    {submissionSuccess}
                                                </div>
                                            )}

                                            {submissionError && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-600 dark:text-red-300 text-xs">
                                                    {submissionError}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chat Messages */}
                            <div 
                                ref={chatScrollRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-background"
                            >
                                {chatMessages.map(message => (
                                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] ${
                                            message.role === 'user' 
                                                ? 'bg-red-600 text-white' 
                                                : 'bg-white dark:bg-card text-foreground border border-border'
                                        } rounded-lg p-3`}>
                                            <div className="text-sm">{message.content}</div>
                                            
                                            {/* Product recommendations */}
                                            {message.products && message.products.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {message.products.map((product, index) => (
                                                        <div key={index} className="bg-slate-50 dark:bg-background rounded-lg p-3 border border-border">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-semibold text-foreground text-sm">{product.partName}</h4>
                                                                <span className="text-red-600 font-semibold text-sm">{product.price}</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground space-y-1">
                                                                <div>Part #: {product.partNumber}</div>
                                                                <div>Compatible: {product.compatible}</div>
                                                                {product.supplier && (
                                                                    <div>Supplier: {product.supplier}</div>
                                                                )}
                                                                {product.availability && (
                                                                    <div className={`font-medium ${
                                                                        product.availability.toLowerCase().includes('in stock') ? 'text-green-600 dark:text-green-400' :
                                                                        product.availability.toLowerCase().includes('out of stock') ? 'text-red-600 dark:text-red-400' :
                                                                        'text-yellow-600 dark:text-yellow-400'
                                                                    }`}>
                                                                        {product.availability}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 flex gap-2">
                                                                <button
                                                                    onClick={() => addToCartFromMia(product)}
                                                                    className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                                                >
                                                                    Add to Cart
                                                                </button>
                                                                {product.link && (
                                                                    <a
                                                                        href={product.link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded transition-colors border border-border"
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
                                                <div className="mt-3 border-t border-border pt-2">
                                                    <div className="text-xs text-muted-foreground font-medium mb-2">Sources & References:</div>
                                                    <div className="space-y-1">
                                                        {message.sources.slice(0, 3).map((source, index) => (
                                                            <div key={index} className="text-xs">
                                                                <a
                                                                    href={source.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                                                                >
                                                                    {source.title}
                                                                </a>
                                                                {source.description && (
                                                                    <div className="text-muted-foreground mt-0.5">{source.description.slice(0, 100)}...</div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="text-xs text-muted-foreground mt-2">
                                                {message.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-card rounded-lg p-3 border border-border">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                    <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                </div>
                                                <span className="text-muted-foreground text-sm">Mia is thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="border-t border-border p-4 bg-white dark:bg-background">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                                        placeholder="Ask Mia about parts..."
                                        disabled={chatLoading}
                                        className="flex-1 px-3 py-2 bg-white dark:bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-red-600 transition-colors disabled:opacity-50"
                                    />
                                    <button
                                        onClick={clearChatSession}
                                        disabled={chatLoading}
                                        className="px-3 py-2 bg-muted hover:bg-muted/80 disabled:bg-muted disabled:cursor-not-allowed text-foreground rounded-lg transition-colors text-sm border border-border"
                                        title="Clear chat and start over"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={sendChatMessage}
                                        disabled={!chatInput.trim() || chatLoading}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                                
                                {/* Current vehicle context */}
                                {(selection.year || selection.make || selection.model) && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Current vehicle: {selection.year && `${selection.year} `}{selection.make && `${selection.make} `}{selection.model && selection.model}{selectedEngine && ` (${selectedEngine.engineName})`}
                                        {vinDecodeSuccess && (
                                            <span className="text-green-600 dark:text-green-400 ml-2">✓ VIN Decoded</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}