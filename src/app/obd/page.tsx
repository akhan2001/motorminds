'use client'

import { Nav } from '@/app/components/nav'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import LoadingPage from '@/components/loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, CheckCircle2, Gauge, TableIcon, LayoutGrid, MessageSquare, ThermometerSun, Disc } from 'lucide-react'
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
    status: 'pending' | 'resolved'
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
            try {
                // Fetch OBD data
                const { data: obdData, error: obdError } = await supabase
                    .from('vehicle_obd_data')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(50)

                if (obdError) {
                    console.error('Error fetching OBD data:', obdError)
                    toast.error('Failed to fetch vehicle data')
                } else {
                    setObdData(obdData as OBDData[])
                }

                // Fetch contact requests with proper error handling
                const { data: contactData, error: contactError } = await supabase
                    .from('shop_contact_requests')
                    .select('id, vehicle_id, message, status, created_at')
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })

                if (contactError) {
                    console.error('Error fetching contact requests:', contactError)
                    toast.error('Failed to fetch contact requests')
                } else {
                    setContactRequests(contactData || [])
                }
            } catch (error) {
                console.error('Error in fetchData:', error)
                toast.error('An error occurred while fetching data')
            } finally {
                setIsLoading(false)
            }
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

        // Subscribe to contact requests with proper channel name and error handling
        const contactSubscription = supabase
            .channel('shop_contact_requests_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'shop_contact_requests',
                filter: 'status=eq.pending'
            }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    setContactRequests(prev => [payload.new as ContactRequest, ...prev])
                    toast.info('New contact request!', {
                        description: `Vehicle ${payload.new.vehicle_id} needs assistance.`
                    })
                } else if (payload.eventType === 'UPDATE' && payload.new.status === 'resolved') {
                    setContactRequests(prev => prev.filter(r => r.id !== payload.new.id))
                }
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
        // Generate UUIDs for demo vehicles if they don't exist
        const demoVehicles = {
            'chevrolet-camaro-1': '550e8400-e29b-41d4-a716-446655440000',
            'audi-a4-1': '550e8400-e29b-41d4-a716-446655440001',
            'ford-escape-1': '550e8400-e29b-41d4-a716-446655440002'
        }

        const mockData: Record<typeof type, {
            vehicle_id: string,
            rpm: number,
            engine_temp: number,
            fuel_level: number,
            dtc_codes: string[],
            status: 'healthy' | 'warning' | 'critical'
        }> = {
            'engine-failure': {
                vehicle_id: demoVehicles['chevrolet-camaro-1'],
                rpm: 4800,
                engine_temp: 115,
                fuel_level: 45,
                dtc_codes: ['P0302', 'P0303', 'P0304'],
                status: 'critical'
            },
            'brake-warning': {
                vehicle_id: demoVehicles['audi-a4-1'],
                rpm: 1200,
                engine_temp: 85,
                fuel_level: 65,
                dtc_codes: ['C0121', 'C0122'],
                status: 'warning'
            },
            'transmission': {
                vehicle_id: demoVehicles['ford-escape-1'],
                rpm: 3200,
                engine_temp: 95,
                fuel_level: 55,
                dtc_codes: ['P0700', 'P0730'],
                status: 'warning'
            }
        }

        try {
            const { data, error } = await supabase
                .from('vehicle_obd_data')
                .insert(mockData[type])
                .select()
                .single()

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            if (!data) {
                throw new Error('No data returned from insert')
            }

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
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-zinc-800 border-zinc-800">
                        <TableHead className="text-zinc-100">Vehicle ID</TableHead>
                        <TableHead className="text-zinc-100">Status</TableHead>
                        <TableHead className="text-zinc-100">RPM</TableHead>
                        <TableHead className="text-zinc-100">Engine Temp</TableHead>
                        <TableHead className="text-zinc-100">Fuel Level</TableHead>
                        <TableHead className="text-zinc-100">DTC Codes</TableHead>
                        <TableHead className="text-zinc-100">Last Updated</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((data) => (
                        <TableRow key={data.id} className="hover:bg-zinc-800 border-zinc-800">
                            <TableCell className="font-medium text-zinc-100">{data.vehicle_id}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(data.status)}
                                    <span className={getStatusColor(data.status)}>
                                        {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-zinc-100">{data.rpm}</TableCell>
                            <TableCell className="text-zinc-100">{data.engine_temp}°C</TableCell>
                            <TableCell className="text-zinc-100">{data.fuel_level}%</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {data.dtc_codes && data.dtc_codes.map((code) => (
                                        <span 
                                            key={code}
                                            className="px-2 py-0.5 text-xs rounded-full bg-red-900/50 text-red-100 font-medium"
                                        >
                                            {code}
                                        </span>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-zinc-300">{new Date(data.timestamp).toLocaleString()}</TableCell>
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
                            <CardTitle className="text-lg text-zinc-100">
                                Vehicle ID: {data.vehicle_id}
                            </CardTitle>
                            <CardDescription className="text-zinc-300">
                                {new Date(data.timestamp).toLocaleString()}
                            </CardDescription>
                        </div>
                        {getStatusIcon(data.status)}
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-blue-300" />
                                <div>
                                    <p className="text-sm text-zinc-300">RPM</p>
                                    <p className="font-medium text-zinc-100">{data.rpm}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <ThermometerSun className="h-4 w-4 text-blue-300" />
                                <div>
                                    <p className="text-sm text-zinc-300">Engine Temp</p>
                                    <p className="font-medium text-zinc-100">{data.engine_temp}°C</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Disc className="h-4 w-4 text-blue-300" />
                                <div>
                                    <p className="text-sm text-zinc-300">Fuel Level</p>
                                    <p className="font-medium text-zinc-100">{data.fuel_level}%</p>
                                </div>
                            </div>
                            {data.dtc_codes && data.dtc_codes.length > 0 && (
                                <div className="col-span-2">
                                    <p className="text-sm text-zinc-300 mb-2">DTC Codes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {data.dtc_codes.map((code) => (
                                            <span 
                                                key={code}
                                                className="px-2 py-1 text-xs rounded-full bg-red-900/50 text-red-100 font-medium"
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
        <div className="flex flex-col min-h-screen bg-black">
            <Nav activeLink="OBD" />
            
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Gauge className="h-8 w-8 text-blue-300" />
                        <h1 className="text-2xl font-bold text-zinc-100">Vehicle Diagnostics</h1>
                    </div>
                    <div className="flex gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-100">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="all" className="text-zinc-100">All Statuses</SelectItem>
                                <SelectItem value="healthy" className="text-zinc-100">Healthy</SelectItem>
                                <SelectItem value="warning" className="text-zinc-100">Warning</SelectItem>
                                <SelectItem value="critical" className="text-zinc-100">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <div className="flex rounded-lg overflow-hidden border border-zinc-800">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`rounded-none ${viewMode === 'table' ? 'bg-zinc-800 text-blue-300' : 'bg-zinc-900 text-zinc-300'}`}
                                onClick={() => setViewMode('table')}
                            >
                                <TableIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`rounded-none ${viewMode === 'grid' ? 'bg-zinc-800 text-blue-300' : 'bg-zinc-900 text-zinc-300'}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Simulation Controls */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-zinc-100">Simulation Controls</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                            className="bg-red-900 hover:bg-red-800 text-red-100"
                            onClick={() => simulateSpecificIssue('engine-failure')}
                        >
                            Simulate Engine Failure
                        </Button>
                        <Button 
                            className="bg-yellow-900 hover:bg-yellow-800 text-yellow-100"
                            onClick={() => simulateSpecificIssue('brake-warning')}
                        >
                            Simulate Brake Warning
                        </Button>
                        <Button 
                            className="bg-orange-900 hover:bg-orange-800 text-orange-100"
                            onClick={() => simulateSpecificIssue('transmission')}
                        >
                            Simulate Transmission Issue
                        </Button>
                    </div>
                </div>

                {/* Contact Requests Section */}
                {contactRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-100">
                            <MessageSquare className="h-5 w-5 text-blue-300" />
                            Contact Requests
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contactRequests.map((request) => (
                                <Card key={request.id} className="bg-zinc-900 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-zinc-100">
                                            Vehicle: {request.vehicle_id}
                                        </CardTitle>
                                        <CardDescription className="text-zinc-300">
                                            {new Date(request.created_at).toLocaleString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-zinc-100 mb-4">{request.message}</p>
                                        <Button
                                            className="w-full bg-blue-900 hover:bg-blue-800 text-blue-100"
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