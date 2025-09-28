'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table'
import { Phone, CheckCircle, Eye, Clock, Package, PhoneCall } from 'lucide-react'
import Link from 'next/link'
import type { VoiceCall, VoiceCallStatus, VoiceCallPurpose } from '../types/voice-call'
import { getStatusColor, getPurposeColor, formatStatusLabel } from '@/lib/utils/formatting'
import { formatPhoneNumber } from '@/utils/format-phone'
import CallForm from './CallForm'

interface VoiceCallTableProps {
    calls: VoiceCall[]
    loading?: boolean
}

interface PartsRequest {
    id: string
    parts_requested: any[]
    vehicle_info: any
    status: string
    quote_provided?: any
}

export default function VoiceCallTable({ calls, loading = false }: VoiceCallTableProps) {

    const formatPartsRequested = (call: VoiceCall) => {
        // First check if we have parts_request data from the call
        if (call.parts_request?.parts_requested && Array.isArray(call.parts_request.parts_requested)) {
            const parts = call.parts_request.parts_requested
            if (parts.length > 0) {
                if (parts.length === 1) {
                    return `${parts[0].name || parts[0].part_name || 'Unknown'} (${parts[0].quantity || 1}x)`
                } else if (parts.length <= 3) {
                    return parts.map(part => 
                        `${part.name || part.part_name || 'Unknown'} (${part.quantity || 1}x)`
                    ).join(', ')
                } else {
                    return `${parts.length} parts requested`
                }
            }
        }
        
        // Check if we have parts information from the call analysis
        if (call.quote_received?.structuredData?.parts_info) {
            const parts = call.quote_received.structuredData.parts_info
            if (Array.isArray(parts) && parts.length > 0) {
                if (parts.length === 1) {
                    return `${parts[0].part_name || parts[0].name || 'Unknown'} (${parts[0].quantity || 1}x)`
                } else if (parts.length <= 3) {
                    return parts.map(part => 
                        `${part.part_name || part.name || 'Unknown'} (${part.quantity || 1}x)`
                    ).join(', ')
                } else {
                    return `${parts.length} parts requested`
                }
            }
        }
        
        // Check parts_discussed field as fallback
        if (call.parts_discussed && Array.isArray(call.parts_discussed) && call.parts_discussed.length > 0) {
            if (call.parts_discussed.length === 1) {
                return `${call.parts_discussed[0].name || call.parts_discussed[0].part_name || 'Unknown'} (${call.parts_discussed[0].quantity || 1}x)`
            } else if (call.parts_discussed.length <= 3) {
                return call.parts_discussed.map((part: any) => 
                    `${part.name || part.part_name || 'Unknown'} (${part.quantity || 1}x)`
                ).join(', ')
            } else {
                return `${call.parts_discussed.length} parts requested`
            }
        }
        
        return 'No parts specified'
    }


    if (loading) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <Clock className="h-6 w-6 animate-spin text-blue-500 mr-3" />
                        <span className="text-gray-400">Loading voice calls...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (calls.length === 0) {
        return (
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                        No voice calls found
                    </h3>
                    <p className="text-gray-400 mb-4">
                        No voice calls available at this time
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Voice Call Logs
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-[#2a2a2a]">
                                <TableHead className="text-gray-300">Phone Number</TableHead>
                                <TableHead className="text-gray-300">Status</TableHead>
                                <TableHead className="text-gray-300">Purpose</TableHead>
                                <TableHead className="text-gray-300">Parts Requested</TableHead>
                                <TableHead className="text-gray-300">Supplier</TableHead>
                                <TableHead className="text-gray-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {calls.map((call) => (
                                <TableRow key={call.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                                    <TableCell className="text-white">
                                        <div className="flex items-center gap-2">
                                            {/* <Phone className="h-4 w-4 text-gray-400" /> */}
                                            {formatPhoneNumber(call.phone_number)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(call.status)}>
                                            {formatStatusLabel(call.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`${getPurposeColor(call.purpose)} border-0`}>
                                            {formatStatusLabel(call.purpose)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        {call.parts_request_id ? (
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                                            >
                                                <Link href={`/voice-calling/parts/${call.parts_request_id}`}>
                                                    <Package className="h-3 w-3 mr-2 flex-shrink-0" />
                                                    <span className="truncate" title={formatPartsRequested(call)}>
                                                        {formatPartsRequested(call)}
                                                    </span>
                                                </Link>
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Package className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate">No parts request</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-300">
                                        {call.supplier?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <CallForm
                                                trigger={
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={
                                                            call.status === 'ready_to_order'
                                                                ? "bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600"
                                                                : "border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                                                        }
                                                    >
                                                        <PhoneCall className="h-3 w-3 mr-1" />
                                                        Call
                                                    </Button>
                                                }
                                                prefillData={{
                                                    phone: call.phone_number,
                                                    supplier: call.supplier_id
                                                }}
                                            />
                                            {call.status === 'completed' && call.quote_received && (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <Link href={`/parts-quote`}>
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        View Quote
                                                    </Link>
                                                </Button>
                                            )}
                                            {/* <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                                            >
                                                <Link href={`/voice-calling/requests/${call.id}`}>
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Details
                                                </Link>
                                            </Button> */}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
