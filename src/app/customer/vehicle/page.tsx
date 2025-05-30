'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Car, Gauge, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

const VEHICLES = [
    {
        id: 'ford-escape',
        name: '2023 Ford Escape',
        image: '/cars-images/ford-escape.png',
        description: 'SUV with EcoBoost engine',
        specs: {
            engine: '2.0L EcoBoost',
            transmission: '8-Speed Automatic'
        }
    },
    {
        id: 'chevrolet-camaro',
        name: '2015 Chevrolet Camaro',
        image: '/cars-images/chevy-camaro.png',
        description: 'Sports car with V8 engine',
        specs: {
            engine: '6.2L V8',
            transmission: '6-Speed Manual'
        }
    },
    {
        id: 'audi-a4',
        name: '2016 Audi A4',
        image: '/cars-images/audi-a4.png',
        description: 'Luxury sedan with quattro AWD',
        specs: {
            engine: '2.0T TFSI',
            transmission: '8-Speed Tiptronic'
        }
    }
]

export default function VehicleSelectionPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-2">
                    <Car className="h-8 w-8 text-blue-600" />
                    <h1 className="text-3xl font-bold">Your Vehicles</h1>
                </div>
                <p className="text-gray-600 mb-8">Select a vehicle to view status or schedule service</p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {VEHICLES.map((vehicle) => (
                        <Link key={vehicle.id} href={`/customer/vehicle/${vehicle.id}`}>
                            <Card className="hover:shadow-lg transition-all duration-300 hover:border-blue-200 cursor-pointer h-full">
                                <CardHeader>
                                    <CardTitle className="text-xl text-blue-900">{vehicle.name}</CardTitle>
                                    <CardDescription>{vehicle.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-50">
                                        <Image
                                            src={vehicle.image}
                                            alt={vehicle.name}
                                            fill
                                            className="object-contain p-2"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Gauge className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-600">{vehicle.specs.engine}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Wrench className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-600">{vehicle.specs.transmission}</span>
                                        </div>
                                    </div>

                                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                        View Details
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
} 