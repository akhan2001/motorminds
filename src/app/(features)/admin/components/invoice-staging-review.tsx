'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Play,
    Database,
    Users,
    DollarSign,
    FileText,
    Search,
    Filter
} from 'lucide-react'
import { StagingInvoice } from '../types/migrations'

export function InvoiceStagingReviewComponent() {
    const [stagingInvoices, setStagingInvoices] = useState<StagingInvoice[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchStagingInvoices()
    }, [])

    const fetchStagingInvoices = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/migrations/invoices/staging')
            const data = await response.json()
            setStagingInvoices(data)
        } catch (error) {
            console.error('Error fetching staging invoices:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRunMatching = async () => {
        setProcessing(true)
        try {
            const response = await fetch('/api/admin/migrations/invoices/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch_id: 'current' })
            })
            const result = await response.json()
            if (result.success) {
                await fetchStagingInvoices()
            }
        } catch (error) {
            console.error('Error running matching:', error)
        } finally {
            setProcessing(false)
        }
    }

    const handleRunValidation = async () => {
        setProcessing(true)
        try {
            const response = await fetch('/api/admin/migrations/invoices/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch_id: 'current' })
            })
            const result = await response.json()
            if (result.success) {
                await fetchStagingInvoices()
            }
        } catch (error) {
            console.error('Error running validation:', error)
        } finally {
            setProcessing(false)
        }
    }

    const handleRunMigration = async () => {
        setProcessing(true)
        try {
            const response = await fetch('/api/admin/migrations/invoices/migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    batch_id: 'current',
                    migrate_all: selectedInvoices.length === 0,
                    selected_ids: selectedInvoices
                })
            })
            const result = await response.json()
            if (result.success) {
                await fetchStagingInvoices()
                setSelectedInvoices([])
            }
        } catch (error) {
            console.error('Error running migration:', error)
        } finally {
            setProcessing(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'matched':
            case 'validated':
            case 'migrated':
                return <CheckCircle className="h-4 w-4 text-green-400" />
            case 'unmatched':
            case 'invalid':
            case 'migration_failed':
                return <XCircle className="h-4 w-4 text-red-400" />
            case 'pending':
            default:
                return <AlertTriangle className="h-4 w-4 text-yellow-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'matched':
            case 'validated':
            case 'migrated':
                return 'bg-green-600/20 text-green-400 border-green-600'
            case 'unmatched':
            case 'invalid':
            case 'migration_failed':
                return 'bg-red-600/20 text-red-400 border-red-600'
            case 'pending':
            default:
                return 'bg-yellow-600/20 text-yellow-400 border-yellow-600'
        }
    }

    const filteredInvoices = stagingInvoices.filter(invoice => {
        const matchesFilter = filter === 'all' || invoice.import_status === filter
        const matchesSearch = searchTerm === '' || 
            invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customer_identifier?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const statusCounts = {
        pending: stagingInvoices.filter(i => i.import_status === 'pending').length,
        matched: stagingInvoices.filter(i => i.import_status === 'matched').length,
        validated: stagingInvoices.filter(i => i.import_status === 'validated').length,
        migrated: stagingInvoices.filter(i => i.import_status === 'migrated').length,
        unmatched: stagingInvoices.filter(i => i.import_status === 'unmatched').length,
        invalid: stagingInvoices.filter(i => i.import_status === 'invalid').length
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Staging Invoice Review</h2>
                    <p className="text-gray-400">Review and process imported invoices</p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        onClick={handleRunMatching}
                        disabled={processing}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Run Matching
                    </Button>
                    <Button
                        onClick={handleRunValidation}
                        disabled={processing}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validate
                    </Button>
                    <Button
                        onClick={handleRunMigration}
                        disabled={processing || statusCounts.validated === 0}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Migrate
                    </Button>
                </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-400">{statusCounts.pending}</p>
                        <p className="text-sm text-gray-400">Pending</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{statusCounts.matched}</p>
                        <p className="text-sm text-gray-400">Matched</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">{statusCounts.validated}</p>
                        <p className="text-sm text-gray-400">Validated</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-purple-400">{statusCounts.migrated}</p>
                        <p className="text-sm text-gray-400">Migrated</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-400">{statusCounts.unmatched}</p>
                        <p className="text-sm text-gray-400">Unmatched</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-[#2a2a2a]">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-orange-400">{statusCounts.invalid}</p>
                        <p className="text-sm text-gray-400">Invalid</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardContent className="p-4">
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search invoices..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-[#0d0d0d] border-[#2a2a2a] text-white"
                                />
                            </div>
                        </div>
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-48 bg-[#0d0d0d] border-[#2a2a2a] text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="matched">Matched</SelectItem>
                                <SelectItem value="validated">Validated</SelectItem>
                                <SelectItem value="migrated">Migrated</SelectItem>
                                <SelectItem value="unmatched">Unmatched</SelectItem>
                                <SelectItem value="invalid">Invalid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice List */}
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Staging Invoices ({filteredInvoices.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-400">Loading invoices...</p>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="text-center py-8">
                            <Database className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-400">No invoices found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredInvoices.map((invoice) => (
                                <div key={invoice.id} className="flex items-center justify-between p-4 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedInvoices.includes(invoice.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedInvoices([...selectedInvoices, invoice.id])
                                                } else {
                                                    setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id))
                                                }
                                            }}
                                            className="rounded border-gray-600"
                                        />
                                        <div className="flex items-center space-x-2">
                                            {getStatusIcon(invoice.import_status)}
                                            <div>
                                                <p className="font-medium text-white">{invoice.invoice_number}</p>
                                                <p className="text-sm text-gray-400">{invoice.customer_identifier}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-400">Amount</p>
                                            <p className="font-medium text-white">
                                                ${invoice.total_amount?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-400">Date</p>
                                            <p className="font-medium text-white">
                                                {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(invoice.import_status)}>
                                            {invoice.import_status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
