'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshCw, Car } from 'lucide-react'
import { useStagingVehicles } from '../hooks/use-migrations-data'
import { StagingFilters } from '../lib/migrations-service'

export default function StagingVehiclesTable() {
    const filters: StagingFilters = {
        limit: 100
    }

    const { data: vehicles, isLoading, error, refetch } = useStagingVehicles(filters)

    const getStatusBadge = (status: string | null) => {
        const statusMap = {
            pending: { label: 'Pending', color: 'bg-gray-600' },
            matched: { label: 'Matched', color: 'bg-green-600' },
            invalid: { label: 'Invalid', color: 'bg-red-600' },
            migrated: { label: 'Migrated', color: 'bg-blue-600' }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap] || { label: 'Unknown', color: 'bg-gray-600' }
        return (
            <Badge className={`${statusInfo.color} text-white text-xs`}>
                {statusInfo.label}
            </Badge>
        )
    }

    if (isLoading) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Car className="h-5 w-5 mr-2" />
                        Staging Vehicles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-gray-700 rounded animate-pulse"></div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Car className="h-5 w-5 mr-2" />
                        Staging Vehicles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-red-400 mb-4">Error loading vehicles</p>
                        <Button onClick={() => refetch()} variant="outline" className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Staging Vehicles ({vehicles?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Table */}
                {vehicles && vehicles.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-[#2a2a2a]">
                                    <TableHead className="text-gray-300">Year</TableHead>
                                    <TableHead className="text-gray-300">Make</TableHead>
                                    <TableHead className="text-gray-300">Model</TableHead>
                                    <TableHead className="text-gray-300">VIN</TableHead>
                                    <TableHead className="text-gray-300">Plate</TableHead>
                                    <TableHead className="text-gray-300">Status</TableHead>
                                    <TableHead className="text-gray-300">Batch ID</TableHead>
                                    <TableHead className="text-gray-300">Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vehicles.map((vehicle) => (
                                    <TableRow key={vehicle.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                                        <TableCell className="text-white">
                                            {vehicle.year || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {vehicle.make || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {vehicle.model || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300 font-mono text-sm">
                                            {vehicle.vin || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {vehicle.license_plate || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(vehicle.import_status)}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-sm">
                                            {vehicle.import_batch_id || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-sm">
                                            {vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Car className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No staging vehicles found</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
