'use client'

import { VehicleServiceForm } from '@/components/vehicle-service-form'
import { VehicleWarning } from '@/components/vehicle-warning'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FORD_SERVICES = [
    'Oil Change',
    'Brake Service',
    'Transmission Service',
    'Engine Diagnostic',
    'Tire Rotation',
    'Battery Service'
]

export default function FordEscapePage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">2023 Ford Escape</h1>
                        <p className="text-gray-600 mb-6">Schedule service for your vehicle</p>
                        
                        <VehicleWarning vehicleId="550e8400-e29b-41d4-a716-446655440002" />
                        
                        <div className="relative aspect-video w-full mb-6">
                            <Image
                                src="/cars-images/ford-escape.png"
                                alt="Ford Escape"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Vehicle Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm text-gray-500">Model</dt>
                                        <dd className="font-medium">Escape SEL</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Year</dt>
                                        <dd className="font-medium">2023</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Engine</dt>
                                        <dd className="font-medium">2.0L EcoBoost</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Transmission</dt>
                                        <dd className="font-medium">8-Speed Automatic</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Schedule Service</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <VehicleServiceForm
                                    vehicleId="ford-escape-1"
                                    vehicleName="Ford Escape SEL"
                                    serviceTypes={FORD_SERVICES}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
} 