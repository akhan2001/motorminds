'use client'

import { Nav } from '@/app/components/nav'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Car, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import LoadingPage from '@/components/loading'
import { checkUser } from '@/utils/supabase/supabase-auth'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { sendMessageToMia } from './utils/mia-utils'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface VehicleContext {
    year?: number
    make?: string
    model?: string
    vin?: string
}

// Vehicle data for dropdowns
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

const MAKES = [
    'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 
    'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 
    'Kia', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 
    'Nissan', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
]

const MODELS_BY_MAKE: Record<string, string[]> = {
    'Honda': ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey', 'Fit', 'HR-V', 'Passport', 'Ridgeline'],
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Tacoma', 'Sienna', 'Tundra', '4Runner'],
    'Ford': ['F-150', 'Escape', 'Explorer', 'Mustang', 'Edge', 'Expedition', 'Ranger', 'Bronco', 'Transit'],
    'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Suburban', 'Camaro', 'Traverse', 'Colorado'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'X1', '7 Series', 'X7', '4 Series', '2 Series'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class', 'S-Class', 'GLS', 'CLA', 'GLB'],
    'Audi': ['A4', 'Q5', 'A6', 'Q7', 'A3', 'Q3', 'A8', 'Q8', 'A5'],
    'Nissan': ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Murano', 'Frontier', 'Titan', 'Versa', 'Armada'],
    'Hyundai': ['Elantra', 'Tucson', 'Santa Fe', 'Sonata', 'Palisade', 'Kona', 'Accent', 'Veloster', 'Genesis'],
    'Jeep': ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Grand Wagoneer'],
    'Volkswagen': ['Jetta', 'Tiguan', 'Passat', 'Atlas', 'Golf', 'Beetle', 'Arteon', 'ID.4'],
    'Subaru': ['Outback', 'Forester', 'Crosstrek', 'Impreza', 'Legacy', 'Ascent', 'WRX', 'BRZ'],
    'Kia': ['Forte', 'Sportage', 'Sorento', 'Optima', 'Soul', 'Telluride', 'Rio', 'Stinger', 'Carnival'],
    'Mazda': ['CX-5', 'Mazda3', 'CX-9', 'CX-30', 'Mazda6', 'MX-5 Miata', 'CX-50'],
    'Lexus': ['RX', 'ES', 'NX', 'GX', 'LX', 'IS', 'LS', 'UX', 'RC'],
    'Acura': ['MDX', 'TLX', 'RDX', 'ILX', 'NSX', 'TLX Type S', 'MDX Type S'],
    'Infiniti': ['Q50', 'QX60', 'QX80', 'Q60', 'QX50', 'Q70'],
    'Cadillac': ['Escalade', 'XT5', 'XT4', 'CT5', 'XT6', 'CT4', 'Lyriq'],
    'Lincoln': ['Navigator', 'Aviator', 'Corsair', 'Nautilus', 'Continental', 'MKZ'],
    'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
    'Volvo': ['XC90', 'XC60', 'S60', 'XC40', 'S90', 'V60', 'V90']
}

export default function MiaPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content:
                "👋 Hello! I'm Mia, your automotive knowledge assistant. Ask me about diagnostic codes, repair procedures, parts, or any automotive question. You can also provide vehicle details for more specific help.",
        },
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [shopId, setShopId] = useState<string | null>(null)
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [vehicleContext, setVehicleContext] = useState<VehicleContext>({})
    const [showVehicleInput, setShowVehicleInput] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchUserData = async () => {
            setIsPageLoading(true)
            try {
                const user = await checkUser()
                if (user) {
                    const id = await getShopId(user.id)
                    setShopId(id)
                } else {
                    router.push('/login')
                }
            } catch (error) {
                console.error('Error fetching user data:', error)
                router.push('/login')
            } finally {
                setIsPageLoading(false)
            }
        }
        fetchUserData()
    }, [router])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading || !shopId) return

        const userMessage: Message = { role: 'user', content: input }
        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const assistantResponse = await sendMessageToMia(
                shopId,
                [...messages, userMessage],
                vehicleContext
            )
            const assistantMessage: Message = {
                role: 'assistant',
                content: assistantResponse,
            }
            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            console.error('Error in chat submission:', error)
            const errorMessage: Message = {
                role: 'assistant',
                content:
                    error instanceof Error
                        ? error.message
                        : 'Sorry, I encountered an error. Please try again.',
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    if (isPageLoading) {
        return <LoadingPage />
    }

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav />
            <div className="flex-grow flex flex-col items-center justify-center py-8 px-4">
                <div className="w-full max-w-4xl h-[70vh] flex flex-col bg-[#131313] border border-[#222] rounded-lg shadow-lg">
                    <div className="flex-grow p-6 overflow-y-auto">
                        <div className="space-y-6">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-4 ${
                                        message.role === 'user'
                                            ? 'justify-end'
                                            : ''
                                    }`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            M
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                                            message.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-[#222] text-gray-200'
                                        }`}
                                    >
                                        <div className="prose prose-sm prose-invert">
                                            <ReactMarkdown>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        M
                                    </div>
                                    <div className="bg-[#222] text-gray-200 rounded-lg px-4 py-3">
                                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    
                    {/* Vehicle Context Input */}
                    {showVehicleInput && (
                        <div className="p-4 border-t border-[#222] bg-[#1a1a1a]">
                            <Card className="bg-[#222] border-[#333]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-white text-sm flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Car className="h-4 w-4" />
                                            Vehicle Context
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowVehicleInput(false)}
                                            className="h-6 w-6 p-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <Select
                                            value={vehicleContext.year?.toString() || ''}
                                            onValueChange={(value) => setVehicleContext(prev => ({
                                                ...prev,
                                                year: parseInt(value) || undefined
                                            }))}
                                        >
                                            <SelectTrigger className="bg-[#131313] border-[#333]">
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#131313] border-[#333]">
                                                {YEARS.map(year => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={vehicleContext.make || ''}
                                            onValueChange={(value) => setVehicleContext(prev => ({
                                                ...prev,
                                                make: value,
                                                model: undefined // Reset model when make changes
                                            }))}
                                        >
                                            <SelectTrigger className="bg-[#131313] border-[#333]">
                                                <SelectValue placeholder="Make" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#131313] border-[#333]">
                                                {MAKES.map(make => (
                                                    <SelectItem key={make} value={make}>
                                                        {make}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={vehicleContext.model || ''}
                                            onValueChange={(value) => setVehicleContext(prev => ({
                                                ...prev,
                                                model: value
                                            }))}
                                            disabled={!vehicleContext.make}
                                        >
                                            <SelectTrigger className="bg-[#131313] border-[#333]">
                                                <SelectValue placeholder="Model" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#131313] border-[#333]">
                                                {vehicleContext.make && MODELS_BY_MAKE[vehicleContext.make] ? 
                                                    MODELS_BY_MAKE[vehicleContext.make].map(model => (
                                                        <SelectItem key={model} value={model}>
                                                            {model}
                                                        </SelectItem>
                                                    )) : 
                                                    <SelectItem value="other">Other</SelectItem>
                                                }
                                            </SelectContent>
                                        </Select>

                                        <Input
                                            placeholder="VIN (optional)"
                                            value={vehicleContext.vin || ''}
                                            onChange={(e) => setVehicleContext(prev => ({
                                                ...prev,
                                                vin: e.target.value
                                            }))}
                                            className="bg-[#131313] border-[#333]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-4 p-4 border-t border-[#222]"
                    >
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setShowVehicleInput(!showVehicleInput)}
                            className="border-[#333] hover:bg-[#333]"
                        >
                            <Car className="h-4 w-4" />
                        </Button>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask Mia about diagnostics, repairs, parts, or maintenance..."
                            className="flex-grow bg-[#131313] border border-[#333] focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}