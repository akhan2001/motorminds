'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { AlertCircle, AlertTriangle, CheckCircle2, Gauge, Disc, ThermometerSun, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface VehicleStatus {
    id: string
    vehicle_id: string
    rpm: number
    engine_temp: number
    fuel_level: number
    dtc_codes: string[]
    status: 'healthy' | 'warning' | 'critical'
}

// Mock vehicle ID for demo
const DEMO_VEHICLE_ID = 'demo-vehicle-1'

const VEHICLES = [
    {
        id: 'ford',
        name: '2023 Ford Escape',
        image: '/car-images/ford-escape.png',
        description: 'SUV with EcoBoost engine'
    },
    {
        id: 'toyota',
        name: '2023 Toyota Camry',
        image: '/car-images/toyota-camry.png',
        description: 'Midsize sedan with hybrid option'
    },
    {
        id: 'tesla',
        name: '2023 Tesla Model 3',
        image: '/car-images/tesla-model3.png',
        description: 'Electric performance sedan'
    }
]

export default function VehicleSelectionPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-2">Select Your Vehicle</h1>
                <p className="text-gray-600 mb-8">Choose your vehicle to schedule service or check status</p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {VEHICLES.map((vehicle) => (
                        <Link key={vehicle.id} href={`/customer/vehicle/${vehicle.id}`}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    <CardTitle>{vehicle.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative aspect-video w-full mb-4">
                                        <Image
                                            src={vehicle.image}
                                            alt={vehicle.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <p className="text-gray-600">{vehicle.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
} 