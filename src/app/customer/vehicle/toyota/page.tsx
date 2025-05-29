'use client'

import { VehicleServiceForm } from '@/components/vehicle-service-form'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const TOYOTA_SERVICES = [
    'Oil Change',
    'Brake Service',
    'Transmission Service',
    'Engine Diagnostic',
    'Tire Rotation',
    'Battery Service',
    'Hybrid System Check'
]

export default function ToyotaCamryPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">2023 Toyota Camry</h1>
                        <p className="text-gray-600 mb-6">Schedule service for your vehicle</p>
                        
                        <div className="relative aspect-video w-full mb-6">
                            <Image
                                src="/car-images/toyota-camry.png"
                                alt="Toyota Camry"
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
                                        <dd className="font-medium">Camry XSE</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Year</dt>
                                        <dd className="font-medium">2023</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Engine</dt>
                                        <dd className="font-medium">2.5L Dynamic Force</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Transmission</dt>
                                        <dd className="font-medium">8-Speed Direct Shift</dd>
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
                                    vehicleId="toyota-camry-1"
                                    vehicleName="Toyota Camry XSE"
                                    serviceTypes={TOYOTA_SERVICES}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
} 