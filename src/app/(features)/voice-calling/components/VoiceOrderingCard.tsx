'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, Package, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function VoiceOrderingCard() {
    return (
        <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-400" />
                    AI Parts Ordering
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Call suppliers automatically to request parts quotes and availability
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Features */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Package className="h-4 w-4 text-green-400" />
                        Automated parts quote requests
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="h-4 w-4 text-yellow-400" />
                        Real-time pricing and availability
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Phone className="h-4 w-4 text-blue-400" />
                        Multi-supplier calling support
                    </div>
                </div>

                {/* Call to Action */}
                <div className="pt-4">
                    <Link href="/voice-calling/requests">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Start Parts Ordering
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
