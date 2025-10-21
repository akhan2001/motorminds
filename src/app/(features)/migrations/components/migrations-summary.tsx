'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Car, FileText, CheckCircle, AlertTriangle, Clock, Database } from 'lucide-react'
import { StagingSummary } from '../lib/migrations-service'

interface MigrationsSummaryProps {
    summary: StagingSummary | undefined
    loading: boolean
}

export default function MigrationsSummary({ summary, loading }: MigrationsSummaryProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-[#111111] border-[#2a2a2a]">
                        <CardHeader className="pb-3">
                            <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-gray-700 rounded animate-pulse mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!summary) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Customers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white mb-2">0</div>
                        <p className="text-gray-400 text-sm">No staging data found</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const getStatusBadges = (counts: any) => {
        const badges = []
        if (counts.pending > 0) badges.push({ label: 'Pending', count: counts.pending, color: 'bg-gray-600' })
        if (counts.matched > 0) badges.push({ label: 'Matched', count: counts.matched, color: 'bg-green-600' })
        if (counts.invalid > 0) badges.push({ label: 'Invalid', count: counts.invalid, color: 'bg-red-600' })
        if (counts.migrated > 0) badges.push({ label: 'Migrated', count: counts.migrated, color: 'bg-blue-600' })
        return badges
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Customers Summary */}
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Customers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white mb-2">{summary.customers.total}</div>
                    <div className="flex flex-wrap gap-1">
                        {getStatusBadges(summary.customers).map((badge, index) => (
                            <Badge key={index} className={`${badge.color} text-white text-xs`}>
                                {badge.label}: {badge.count}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Vehicles Summary */}
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center">
                        <Car className="h-5 w-5 mr-2" />
                        Vehicles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white mb-2">{summary.vehicles.total}</div>
                    <div className="flex flex-wrap gap-1">
                        {getStatusBadges(summary.vehicles).map((badge, index) => (
                            <Badge key={index} className={`${badge.color} text-white text-xs`}>
                                {badge.label}: {badge.count}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Invoices Summary */}
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white mb-2">{summary.invoices.total}</div>
                    <div className="flex flex-wrap gap-1">
                        {getStatusBadges(summary.invoices).map((badge, index) => (
                            <Badge key={index} className={`${badge.color} text-white text-xs`}>
                                {badge.label}: {badge.count}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
