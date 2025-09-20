'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, PhoneCall, Loader2, Slash } from 'lucide-react'
import { toast } from 'sonner'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import Link from 'next/link'

function VoiceOrderingContent() {
    const searchParams = useSearchParams()
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [lastCallId, setLastCallId] = useState<string | null>(null)
    const [supplierName, setSupplierName] = useState<string | null>(null)

    const formatPhoneNumber = useCallback((value: string) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '')
        
        // Format as (XXX) XXX-XXXX for US numbers
        if (digits.length <= 3) {
            return digits
        } else if (digits.length <= 6) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
        } else if (digits.length <= 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
        } else {
            return `+${digits.slice(0, -10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`
        }
    }, [])

    // Prefill phone number and supplier name from URL parameters
    useEffect(() => {
        if (!searchParams) return
        
        const phone = searchParams.get('phone')
        const supplier = searchParams.get('supplier')
        
        if (phone) {
            const formattedPhone = formatPhoneNumber(phone)
            setPhoneNumber(formattedPhone)
        }
        
        if (supplier) {
            setSupplierName(supplier)
            // toast.success(`Ready to call ${supplier}`)
        }
    }, [searchParams, formatPhoneNumber])

    const handleStartCall = async () => {
        if (!phoneNumber.trim()) {
            toast.error('Please enter a phone number')
            return
        }

        // Basic phone number validation
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
        if (!phoneRegex.test(phoneNumber)) {
            toast.error('Please enter a valid phone number')
            return
        }

        setIsLoading(true)
        
        try {
            const response = await fetch('/api/voice/start-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber.trim(),
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setLastCallId(data.callId)
                toast.success(`Call initiated! Call ID: ${data.callId}`)
            } else {
                toast.error(data.error || 'Failed to start call')
            }
        } catch (error) {
            console.error('Error starting call:', error)
            toast.error('Failed to start call')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value)
        setPhoneNumber(formatted)
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1">
                <div className="p-4 max-w-4xl mx-auto">
                    <div className="max-w-2xl mx-auto space-y-4">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/voice-calling" className="text-gray-400 hover:text-gray-300">
                                            Voice Calling
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="h-4 w-4" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">
                                        Ordering
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Header */}
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white mb-2">
                                AI Parts Ordering System
                            </h1>
                            <p className="text-gray-400">
                                {supplierName 
                                    ? `Ready to call ${supplierName} for automotive parts`
                                    : 'Alex, your AI agent for automated automotive parts procurement'
                                }
                            </p>
                        </div>

                        {/* Main Call Interface */}
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <PhoneCall className="h-5 w-5" />
                                    {supplierName ? `Call ${supplierName}` : 'Call Automotive Supplier'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Phone Number Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-gray-300">
                                        Phone Number
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={handlePhoneChange}
                                            placeholder="+1 (555) 123-4567"
                                            className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {supplierName 
                                            ? `Phone number for ${supplierName} - ready to call`
                                            : 'Enter the automotive parts supplier\'s phone number'
                                        }
                                    </p>
                                </div>

                                {/* Call Button */}
                                <Button
                                    onClick={handleStartCall}
                                    disabled={isLoading || !phoneNumber.trim()}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    size="default"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Calling Supplier...
                                        </>
                                    ) : (
                                        <>
                                            <PhoneCall className="h-4 w-4 mr-2" />
                                            {supplierName ? `Call ${supplierName} to Order Parts` : 'Call Supplier to Order Parts'}
                                        </>
                                    )}
                                </Button>

                                {/* Last Call Info */}
                                {lastCallId && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                        <p className="text-blue-400 text-sm">
                                            Last call ID: <span className="font-mono">{lastCallId}</span>
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status Card */}
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-white text-base">
                                    System Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Vapi Connection</span>
                                        <span className="text-green-400 text-sm">Connected</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Voice Provider</span>
                                        <span className="text-blue-400 text-sm">Vapi AI</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Ready to Call</span>
                                        <span className="text-green-400 text-sm">Yes</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Instructions */}
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-white text-base">
                                    How it Works
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                                    <li>Enter supplier's phone number above</li>
                                    <li>Click "Call Supplier to Order Parts"</li>
                                    <li>Alex introduces MotorMinds (10 seconds)</li>
                                    <li>AI collects: part number, price, availability, delivery date (30 sec/part)</li>
                                    <li>Order confirmation with PO# and supplier reference numbers</li>
                                    <li>Complete parts order in under 3 minutes per part</li>
                                </ol>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function VoiceOrderingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading voice ordering...</p>
                    </div>
                </div>
            </div>
        }>
            <VoiceOrderingContent />
        </Suspense>
    )
}
