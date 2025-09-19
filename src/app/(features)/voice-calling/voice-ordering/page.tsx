'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, PhoneCall, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function VoiceOrderingPage() {
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [lastCallId, setLastCallId] = useState<string | null>(null)

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

    const formatPhoneNumber = (value: string) => {
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
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value)
        setPhoneNumber(formatted)
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d] p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        AI Parts Ordering System
                    </h1>
                    <p className="text-gray-400">
                        Alex, your AI agent for automated automotive parts procurement
                    </p>
                </div>

                {/* Main Call Interface */}
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <PhoneCall className="h-5 w-5" />
                            Call Automotive Supplier
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
                                Enter the automotive parts supplier's phone number
                            </p>
                        </div>

                        {/* Call Button */}
                        <Button
                            onClick={handleStartCall}
                            disabled={isLoading || !phoneNumber.trim()}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                            size="lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Calling Supplier...
                                </>
                            ) : (
                                <>
                                    <PhoneCall className="h-4 w-4 mr-2" />
                                    Call Supplier to Order Parts
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
                    <CardHeader>
                        <CardTitle className="text-white text-lg">
                            System Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
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
                    <CardHeader>
                        <CardTitle className="text-white text-lg">
                            How it Works
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
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
    )
}
