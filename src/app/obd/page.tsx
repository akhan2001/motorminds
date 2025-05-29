'use client'

import { Nav } from '@/app/components/nav'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import LoadingPage from '@/components/loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, CheckCircle2, Gauge, TableIcon, LayoutGrid } from 'lucide-react'
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

export default function OBDPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [obdData, setObdData] = useState<OBDData[]>([])
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
    const router = useRouter()

    useEffect(() => {
        const fetchOBDData = async () => {
            // First, let's create the table if it doesn't exist
            const { error: createError } = await supabase.rpc('create_obd_table')
            if (createError) {
                console.log('Table might already exist or error:', createError)
            }

            // Now fetch the data
            const { data, error } = await supabase
                .from('vehicle_obd_data')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50)

            if (error) {
                console.error('Error fetching OBD data:', error)
                return
            }

            setObdData(data as OBDData[])
            setIsLoading(false)
        }

        fetchOBDData()

        // Set up real-time subscription
        const subscription = supabase
            .channel('vehicle_obd_data_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'vehicle_obd_data'
            }, async (payload) => {
                // For now, just add the new data directly
                setObdData(prev => [payload.new as OBDData, ...prev.slice(0, 49)])
                if (payload.new.status === 'critical') {
                    toast.error('Critical vehicle alert!', {
                        description: `Vehicle ${payload.new.vehicle_id} needs immediate attention.`
                    })
                }
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
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
                        <div className="flex rounded-md border border-zinc-800">
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
                        <Button onClick={simulateData}>
                            Simulate Data
                        </Button>
                    </div>
                </div>

                {viewMode === 'table' ? <TableView /> : <GridView />}
            </div>
        </div>
    )
}