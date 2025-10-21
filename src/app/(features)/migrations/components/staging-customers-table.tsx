'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshCw, Users } from 'lucide-react'
import { useStagingCustomers } from '../hooks/use-migrations-data'
import { StagingFilters } from '../lib/migrations-service'

export default function StagingCustomersTable() {
    const filters: StagingFilters = {
        limit: 100
    }

    const { data: customers, isLoading, error, refetch } = useStagingCustomers(filters)

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
                        <Users className="h-5 w-5 mr-2" />
                        Staging Customers
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
                        <Users className="h-5 w-5 mr-2" />
                        Staging Customers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-red-400 mb-4">Error loading customers</p>
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
                    <Users className="h-5 w-5 mr-2" />
                    Staging Customers ({customers?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Table */}
                {customers && customers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-[#2a2a2a]">
                                    <TableHead className="text-gray-300">Name</TableHead>
                                    <TableHead className="text-gray-300">Email</TableHead>
                                    <TableHead className="text-gray-300">Phone</TableHead>
                                    <TableHead className="text-gray-300">Status</TableHead>
                                    <TableHead className="text-gray-300">Batch ID</TableHead>
                                    <TableHead className="text-gray-300">Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                                        <TableCell className="text-white">
                                            {customer.customer_name || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {customer.customer_email || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            {customer.customer_phone || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(customer.import_status)}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-sm">
                                            {customer.import_batch_id || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-sm">
                                            {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No staging customers found</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
