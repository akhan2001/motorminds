'use client'

import { Nav } from '@/app/components/nav'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import LoadingPage from '@/components/loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, CheckCircle2, Gauge, TableIcon, LayoutGrid, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface OBDData {
    id: string
    vehicle_id: string
    timestamp: string
    rpm: number
    engine_temp: number
    fuel_level: number
    dtc_codes: string[]
    status: 'healthy' | 'warning' | 'critical'
}

interface ContactRequest {
    id: string
    vehicle_id: string
    message: string
    status: string
    created_at: string
}

export default function OBDPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [obdData, setObdData] = useState<OBDData[]>([])
    const [contactRequests, setContactRequests] = useState<ContactRequest[]>([])
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            // Fetch OBD data
            const { data: obdData, error: obdError } = await supabase
                .from('vehicle_obd_data')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50)

            if (obdError) {
                console.error('Error fetching OBD data:', obdError)
            } else {
                setObdData(obdData as OBDData[])
            }

            // Fetch contact requests
            const { data: contactData, error: contactError } = await supabase
                .from('shop_contact_requests')
                .select('*')
                .order('created_at', { ascending: false })

            if (contactError) {
                console.error('Error fetching contact requests:', contactError)
            } else {
                setContactRequests(contactData as ContactRequest[])
            }

            setIsLoading(false)
        }

        fetchData()

        // Set up real-time subscriptions
        const obdSubscription = supabase
            .channel('vehicle_obd_data_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'vehicle_obd_data'
            }, async (payload) => {
                setObdData(prev => [payload.new as OBDData, ...prev.slice(0, 49)])
                if (payload.new.status === 'critical') {
                    toast.error('Critical vehicle alert!', {
                        description: `Vehicle ${payload.new.vehicle_id} needs immediate attention.`
                    })
                }
            })
            .subscribe()

        // Subscribe to contact requests
        const contactSubscription = supabase
            .channel('shop_contact_requests_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'shop_contact_requests'
            }, async (payload) => {
                setContactRequests(prev => [payload.new as ContactRequest, ...prev])
                toast.info('New contact request!', {
                    description: `Vehicle ${payload.new.vehicle_id} needs assistance.`
                })
            })
            .subscribe()

        return () => {
            obdSubscription.unsubscribe()
            contactSubscription.unsubscribe()
        }
    }, [])

    const simulateData = async () => {
        try {
            const response = await fetch('/api/simulate-obd', {
                method: 'POST'
            })
            if (!response.ok) throw new Error('Failed to simulate data')
            toast.success('Simulated new OBD data')
        } catch (error) {
            console.error('Error simulating data:', error)
            toast.error('Failed to simulate data')
        }
    }

    const simulateSpecificIssue = async (type: 'engine-failure' | 'brake-warning' | 'transmission') => {
        const mockData: Record<typeof type, {
            rpm: number,
            engine_temp: number,
            fuel_level: number,
            dtc_codes: string[],
            status: 'healthy' | 'warning' | 'critical'
        }> = {
            'engine-failure': {
                rpm: 4800,
                engine_temp: 115,
                fuel_level: 45,
                dtc_codes: ['P0302', 'P0303', 'P0304'],
                status: 'critical'
            },
            'brake-warning': {
                rpm: 1200,
                engine_temp: 85,
                fuel_level: 65,
                dtc_codes: ['C0121', 'C0122'],
                status: 'warning'
            },
            'transmission': {
                rpm: 3200,
                engine_temp: 95,
                fuel_level: 55,
                dtc_codes: ['P0700', 'P0730'],
                status: 'warning'
            }
        }

        try {
            const { error } = await supabase
                .from('vehicle_obd_data')
                .insert({
                    vehicle_id: 'demo-vehicle-1',
                    ...mockData[type]
                })

            if (error) throw error
            toast.success(`Simulated ${type.replace('-', ' ')} scenario`)
        } catch (error) {
            console.error('Error simulating data:', error)
            toast.error('Failed to simulate data')
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            case 'critical':
                return <AlertCircle className="h-5 w-5 text-red-500" />
            default:
                return null
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-500'
            case 'warning':
                return 'text-yellow-500'
            case 'critical':
                return 'text-red-500'
            default:
                return ''
        }
    }

    const filteredData = statusFilter === 'all' 
        ? obdData 
        : obdData.filter(d => d.status === statusFilter)

    if (isLoading) {
        return <LoadingPage page="OBD Dashboard" />
    }

    const TableView = () => (
        <div className="rounded-md border border-zinc-800">
            <Table>
                <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-900">
                        <TableHead>Vehicle ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>RPM</TableHead>
                        <TableHead>Engine Temp</TableHead>
                        <TableHead>Fuel Level</TableHead>
                        <TableHead>DTC Codes</TableHead>
                        <TableHead>Last Updated</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((data) => (
                        <TableRow key={data.id} className="border-zinc-800 hover:bg-zinc-900">
                            <TableCell className="font-medium">{data.vehicle_id}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(data.status)}
                                    <span className={getStatusColor(data.status)}>
                                        {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>{data.rpm}</TableCell>
                            <TableCell>{data.engine_temp}°C</TableCell>
                            <TableCell>{data.fuel_level}%</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {data.dtc_codes && data.dtc_codes.map((code) => (
                                        <span 
                                            key={code}
                                            className="px-2 py-0.5 text-xs rounded-full bg-red-900/50 text-red-200"
                                        >
                                            {code}
                                        </span>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>{new Date(data.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )

    const GridView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((data) => (
                <Card key={data.id} className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle className="text-lg">
                                Vehicle ID: {data.vehicle_id}
                            </CardTitle>
                            <CardDescription>
                                {new Date(data.timestamp).toLocaleString()}
                            </CardDescription>
                        </div>
                        {getStatusIcon(data.status)}
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-400">RPM</p>
                                    <p>{data.rpm}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Engine Temp</p>
                                <p>{data.engine_temp}°C</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Fuel Level</p>
                                <p>{data.fuel_level}%</p>
                            </div>
                            {data.dtc_codes && data.dtc_codes.length > 0 && (
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-400">DTC Codes</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {data.dtc_codes.map((code) => (
                                            <span 
                                                key={code}
                                                className="px-2 py-1 text-xs rounded-full bg-red-900/50 text-red-200"
                                            >
                                                {code}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="OBD" />
            
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Vehicle Diagnostics</h1>
                    <div className="flex gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="healthy">Healthy</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <div className="flex rounded-lg overflow-hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`rounded-none ${viewMode === 'table' ? 'bg-zinc-800' : ''}`}
                                onClick={() => setViewMode('table')}
                            >
                                <TableIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`rounded-none ${viewMode === 'grid' ? 'bg-zinc-800' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Simulation Controls */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Simulation Controls</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => simulateSpecificIssue('engine-failure')}
                        >
                            Simulate Engine Failure
                        </Button>
                        <Button 
                            className="bg-yellow-600 hover:bg-yellow-700"
                            onClick={() => simulateSpecificIssue('brake-warning')}
                        >
                            Simulate Brake Warning
                        </Button>
                        <Button 
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => simulateSpecificIssue('transmission')}
                        >
                            Simulate Transmission Issue
                        </Button>
                    </div>
                </div>

                {/* Contact Requests Section */}
                {contactRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Contact Requests
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contactRequests.map((request) => (
                                <Card key={request.id} className="bg-zinc-900 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Vehicle: {request.vehicle_id}</CardTitle>
                                        <CardDescription>
                                            {new Date(request.created_at).toLocaleString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-300">{request.message}</p>
                                        <div className="mt-4">
                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                                onClick={async () => {
                                                    try {
                                                        const { error } = await supabase
                                                            .from('shop_contact_requests')
                                                            .update({ status: 'resolved' })
                                                            .eq('id', request.id)
                                                        
                                                        if (error) throw error
                                                        
                                                        setContactRequests(prev => 
                                                            prev.filter(r => r.id !== request.id)
                                                        )
                                                        toast.success('Request marked as resolved')
                                                    } catch (error) {
                                                        console.error('Error resolving request:', error)
                                                        toast.error('Failed to resolve request')
                                                    }
                                                }}
                                            >
                                                Mark as Resolved
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {viewMode === 'table' ? <TableView /> : <GridView />}
            </div>
        </div>
    )
}