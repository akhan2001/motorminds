'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, AlertTriangle, Gauge, ThermometerSun, Disc } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VehicleWarningProps {
    vehicleId: string
}

interface OBDData {
    id: string
    vehicle_id: string
    rpm: number
    engine_temp: number
    fuel_level: number
    dtc_codes: string[]
    status: 'healthy' | 'warning' | 'critical'
    timestamp: string
}

const DTC_DESCRIPTIONS: Record<string, string> = {
    'P0302': 'Cylinder 2 Misfire Detected',
    'P0303': 'Cylinder 3 Misfire Detected',
    'P0304': 'Cylinder 4 Misfire Detected',
    'C0121': 'Brake System Warning',
    'C0122': 'ABS System Warning',
    'P0700': 'Transmission Control System Malfunction',
    'P0730': 'Incorrect Gear Ratio'
}

export function VehicleWarning({ vehicleId }: VehicleWarningProps) {
    const [obdData, setObdData] = useState<OBDData | null>(null)

    useEffect(() => {
        // Initial fetch
        const fetchOBDData = async () => {
            const { data, error } = await supabase
                .from('vehicle_obd_data')
                .select('*')
                .eq('vehicle_id', vehicleId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single()

            if (!error && data) {
                setObdData(data as OBDData)
            }
        }

        fetchOBDData()

        // Subscribe to changes
        const subscription = supabase
            .channel('vehicle_obd_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'vehicle_obd_data',
                filter: `vehicle_id=eq.${vehicleId}`
            }, payload => {
                setObdData(payload.new as OBDData)
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [vehicleId])

    if (!obdData || obdData.status === 'healthy') {
        return null
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'warning':
                return 'bg-yellow-900/20 border-yellow-900/50 text-yellow-500'
            case 'critical':
                return 'bg-red-900/20 border-red-900/50 text-red-500'
            default:
                return ''
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'warning':
                return <AlertTriangle className="h-5 w-5" />
            case 'critical':
                return <AlertCircle className="h-5 w-5" />
            default:
                return null
        }
    }

    return (
        <div className="space-y-4 mb-6">
            <Alert className={getStatusColor(obdData.status)}>
                <div className="flex items-center gap-2">
                    {getStatusIcon(obdData.status)}
                    <AlertTitle className="capitalize">
                        {obdData.status} Alert
                    </AlertTitle>
                </div>
                <AlertDescription>
                    <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <Gauge className="h-4 w-4" />
                                <span>RPM: {obdData.rpm}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ThermometerSun className="h-4 w-4" />
                                <span>Temp: {obdData.engine_temp}°C</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Disc className="h-4 w-4" />
                                <span>Fuel: {obdData.fuel_level}%</span>
                            </div>
                        </div>
                        {obdData.dtc_codes && obdData.dtc_codes.length > 0 && (
                            <div className="mt-3">
                                <div className="text-sm font-medium mb-1">Diagnostic Codes:</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {obdData.dtc_codes.map(code => (
                                        <div
                                            key={code}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <span className="font-mono">{code}</span>
                                            <span className="text-gray-400">
                                                {DTC_DESCRIPTIONS[code] || 'Unknown Code'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="text-sm text-gray-400 mt-2">
                            Last updated: {new Date(obdData.timestamp).toLocaleString()}
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    )
} 