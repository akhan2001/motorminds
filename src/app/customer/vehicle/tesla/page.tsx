'use client'

import { VehicleServiceForm } from '@/components/vehicle-service-form'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const TESLA_SERVICES = [
    'Annual Service',
    'Battery Health Check',
    'Tire Rotation',
    'Brake Service',
    'AC Service',
    'Software Update',
    'Charging System Check'
]

export default function TeslaModel3Page() {
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">2023 Tesla Model 3</h1>
                        <p className="text-gray-600 mb-6">Schedule service for your vehicle</p>
                        
                        <div className="relative aspect-video w-full mb-6">
                            <Image
                                src="/car-images/tesla-model3.png"
                                alt="Tesla Model 3"
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
                                        <dd className="font-medium">Model 3 Performance</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Year</dt>
                                        <dd className="font-medium">2023</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Battery</dt>
                                        <dd className="font-medium">82 kWh</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Range</dt>
                                        <dd className="font-medium">315 miles</dd>
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
                                    vehicleId="tesla-model3-1"
                                    vehicleName="Tesla Model 3 Performance"
                                    serviceTypes={TESLA_SERVICES}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
} 