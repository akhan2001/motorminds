'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Database,
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Play,
    Clock,
    BarChart3,
    Server,
    Activity,
    X
} from 'lucide-react'
import { useStagingHealth, useStagingTables, useStagingVerification } from '../hooks/use-staging-verification'
import { StagingVerificationRequest } from '../types/migrations'

export function StagingVerificationComponent() {
    const { health, loading: healthLoading, error: healthError, refetch: refetchHealth } = useStagingHealth()
    const { tables, loading: tablesLoading, error: tablesError, refetch: refetchTables } = useStagingTables()
    const { verifications, loading: verificationsLoading, running, runVerification, refreshStagingData } = useStagingVerification()

    const [selectedTables, setSelectedTables] = useState<string[]>([])
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['schema', 'data', 'integrity', 'ai_analysis'])
    const [duplicateResults, setDuplicateResults] = useState<any>(null)
    const [checkingDuplicates, setCheckingDuplicates] = useState(false)

    const handleRunVerification = async () => {
        const request: StagingVerificationRequest = {
            table_names: selectedTables.length > 0 ? selectedTables : undefined,
            verification_types: selectedTypes,
            force_refresh: true
        }

        try {
            await runVerification(request)
        } catch (error) {
            console.error('Verification failed:', error)
        }
    }

    const handleRefreshData = async () => {
        try {
            await refreshStagingData()
            await refetchHealth()
            await refetchTables()
        } catch (error) {
            console.error('Refresh failed:', error)
        }
    }

    const handleCheckDuplicates = async () => {
        try {
            setCheckingDuplicates(true)
            const response = await fetch('/api/admin/migrations/staging?action=duplicates', {
                method: 'GET'
            })
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const results = await response.json()
            setDuplicateResults(results)
        } catch (error) {
            console.error('Duplicate check failed:', error)
            setDuplicateResults({ error: error instanceof Error ? error.message : 'Failed to check duplicates' })
        } finally {
            setCheckingDuplicates(false)
        }
    }

    const handleClearDuplicates = () => {
        setDuplicateResults(null)
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="h-4 w-4 text-green-400" />
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-400" />
            case 'error':
                return <XCircle className="h-4 w-4 text-red-400" />
            default:
                return <Clock className="h-4 w-4 text-gray-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-600/20 text-green-400 border-green-600'
            case 'warning':
                return 'bg-yellow-600/20 text-yellow-400 border-yellow-600'
            case 'error':
                return 'bg-red-600/20 text-red-400 border-red-600'
            default:
                return 'bg-gray-600/20 text-gray-400 border-gray-600'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Staging Table Verification</h2>
                    <p className="text-gray-400">Verify and monitor staging database tables</p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        onClick={handleRefreshData}
                        variant="outline"
                        size="sm"
                        disabled={running}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </Button>
                    <Button
                        onClick={handleRunVerification}
                        disabled={running}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Run Verification
                    </Button>
                </div>
            </div>

            {/* Health Overview */}
            {health && (
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <Activity className="h-5 w-5 mr-2" />
                            Staging Health Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center space-x-3">
                                {getStatusIcon(health.overall_status)}
                                <div>
                                    <p className="text-sm text-gray-400">Overall Status</p>
                                    <p className="text-lg font-semibold text-white capitalize">{health.overall_status}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Database className="h-5 w-5 text-blue-400" />
                                <div>
                                    <p className="text-sm text-gray-400">Tables</p>
                                    <p className="text-lg font-semibold text-white">{health.tables.length}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                <div>
                                    <p className="text-sm text-gray-400">Issues</p>
                                    <p className="text-lg font-semibold text-white">{health.issues_count}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tables Status */}
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Server className="h-5 w-5 mr-2" />
                        Staging Tables
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {tablesLoading ? (
                        <div className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">Loading tables...</p>
                    </div>
                    ) : tablesError ? (
                        <div className="text-center py-8">
                        <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                        <p className="text-red-400">Error loading tables: {tablesError}</p>
                    </div>
                    ) : (
                        <div className="space-y-3">
                        {tables.map((table) => (
                            <div key={table.name} className="flex items-center justify-between p-4 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(table.status)}
                                        <div>
                                            <p className="font-medium text-white">{table.name}</p>
                                            <p className="text-sm text-gray-400">{table.schema}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Rows</p>
                                        <p className="font-medium text-white">{table.row_count.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Size</p>
                                        <p className="font-medium text-white">{table.size_mb.toFixed(2)} MB</p>
                                    </div>
                                    <Badge className={getStatusColor(table.status)}>
                                        {table.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                    
                    {/* Duplicate Check Button */}
                    <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-white">Duplicate Detection</h3>
                                <p className="text-sm text-gray-400">Check for duplicate customers and vehicles</p>
                            </div>
                            <Button
                                onClick={handleCheckDuplicates}
                                disabled={checkingDuplicates}
                                className="bg-orange-600 hover:bg-orange-700"
                            >
                                {checkingDuplicates ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                )}
                                Check for Duplicates
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Verifications */}
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Recent Verifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {verificationsLoading ? (
                        <div className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">Loading verifications...</p>
                    </div>
                    ) : (
                        <div className="space-y-3">
                        {verifications.length > 0 ? (
                            verifications.slice(0, 5).map((verification) => (
                                <div key={verification.id} className="flex items-center justify-between p-4 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
                                    <div className="flex items-center space-x-4">
                                        {getStatusIcon(verification.status)}
                                        <div>
                                            <p className="font-medium text-white">{verification.table_name}</p>
                                            <p className="text-sm text-gray-400">{verification.verification_type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-400">Duration</p>
                                            <p className="font-medium text-white">
                                                {verification.duration_ms ? `${verification.duration_ms}ms` : 'N/A'}
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(verification.status)}>
                                            {verification.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                            <Database className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-400">No verifications found</p>
                        </div>
                        )}
                    </div>
                    )}
                </CardContent>
            </Card>

            {/* Duplicate Results */}
            {duplicateResults && (
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                Duplicate Analysis Results
                            </CardTitle>
                            <Button
                                onClick={handleClearDuplicates}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white hover:bg-gray-800"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {duplicateResults.error ? (
                            <div className="text-center py-8">
                                <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                                <p className="text-red-400">Error: {duplicateResults.error}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Customer Duplicates */}
                                {duplicateResults.customer_duplicates && (
                                    <div className="p-4 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
                                        <h4 className="text-lg font-medium text-white mb-3">Customer Duplicates</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-orange-400">{duplicateResults.customer_duplicates.duplicate_emails}</p>
                                                <p className="text-sm text-gray-400">Duplicate Emails</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-orange-400">{duplicateResults.customer_duplicates.duplicate_phones}</p>
                                                <p className="text-sm text-gray-400">Duplicate Phones</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-orange-400">{duplicateResults.customer_duplicates.total_duplicates}</p>
                                                <p className="text-sm text-gray-400">Total Duplicates</p>
                                            </div>
                                        </div>
                                        {duplicateResults.customer_duplicates.examples && duplicateResults.customer_duplicates.examples.length > 0 && (
                                            <div>
                                                <p className="text-sm text-gray-400 mb-2">Examples:</p>
                                                <div className="space-y-2">
                                                    {duplicateResults.customer_duplicates.examples.slice(0, 3).map((example: any, index: number) => (
                                                        <div key={index} className="text-sm text-gray-300 bg-[#1a1a1a] p-2 rounded">
                                                            {example.email || example.phone} ({example.count} occurrences)
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Vehicle Duplicates */}
                                {duplicateResults.vehicle_duplicates && (
                                    <div className="p-4 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
                                        <h4 className="text-lg font-medium text-white mb-3">Vehicle Duplicates</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-orange-400">{duplicateResults.vehicle_duplicates.duplicate_vins}</p>
                                                <p className="text-sm text-gray-400">Duplicate VINs</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-orange-400">{duplicateResults.vehicle_duplicates.duplicate_plates}</p>
                                                <p className="text-sm text-gray-400">Duplicate Plates</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-orange-400">{duplicateResults.vehicle_duplicates.total_duplicates}</p>
                                                <p className="text-sm text-gray-400">Total Duplicates</p>
                                            </div>
                                        </div>
                                        {duplicateResults.vehicle_duplicates.examples && duplicateResults.vehicle_duplicates.examples.length > 0 && (
                                            <div>
                                                <p className="text-sm text-gray-400 mb-2">Examples:</p>
                                                <div className="space-y-2">
                                                    {duplicateResults.vehicle_duplicates.examples.slice(0, 3).map((example: any, index: number) => (
                                                        <div key={index} className="text-sm text-gray-300 bg-[#1a1a1a] p-2 rounded">
                                                            {example.vin || example.license_plate} ({example.count} occurrences)
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Summary */}
                                <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <CheckCircle className="h-5 w-5 text-blue-400" />
                                        <div>
                                            <h4 className="font-medium text-blue-400">Analysis Complete</h4>
                                            <p className="text-sm text-blue-300">
                                                Found {duplicateResults.total_duplicates || 0} total duplicate records across all tables
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            {health && health.recommendations.length > 0 && (
                <Card className="bg-orange-600/10 border-orange-600/30">
                    <CardHeader>
                        <CardTitle className="text-orange-400 flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {health.recommendations.map((recommendation, index) => (
                                <li key={index} className="text-orange-300 text-sm">
                                    • {recommendation}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
