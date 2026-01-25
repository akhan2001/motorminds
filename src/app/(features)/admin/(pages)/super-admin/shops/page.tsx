'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Search, Edit, Filter } from 'lucide-react'
//import { Nav } from '@/components/navigation/nav'
import Link from 'next/link'
import AdminNav from '../../../components/AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Shop {
    id: string
    shop_name: string
    shop_email?: string
    shop_phone?: string
    shop_city?: string
    shop_province?: string
    organization_id?: string
    organization_name?: string
    status?: string
    created_at: string
}

export default function SuperAdminShopsPage() {
    const [shops, setShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [organizationFilter, setOrganizationFilter] = useState<string>('all')

    useEffect(() => {
        fetchShops()
    }, [])

    const fetchShops = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/shops?super_admin=true')
            const data = await response.json()

            if (response.ok) {
                setShops(data.shops || [])
            } else {
                console.error('Error fetching shops:', data.error)
            }
        } catch (error) {
            console.error('Error fetching shops:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredShops = shops.filter(shop => {
        const matchesSearch = searchTerm === '' ||
            shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.shop_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.shop_city?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || shop.status === statusFilter
        const matchesOrg = organizationFilter === 'all' || shop.organization_id === organizationFilter

        return matchesSearch && matchesStatus && matchesOrg
    })

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* <Nav /> */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Breadcrumb */}
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                                            Admin
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="text-muted-foreground" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-foreground">
                                        Shops
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-foreground mb-2">
                                All Shops
                            </h1>
                            <p className="text-muted-foreground">
                                View and manage all shops across the platform
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search shops..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Organizations</SelectItem>
                                    {/* Add organization options dynamically */}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Shops List */}
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading shops...</p>
                            </div>
                        ) : filteredShops.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-foreground mb-2">
                                        No shops found
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm ? 'Try adjusting your search' : 'No shops available'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredShops.map((shop) => (
                                    <Card key={shop.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                                        <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-foreground">{shop.shop_name}</h3>
                                                        <p className="text-sm text-muted-foreground">{shop.shop_email}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {shop.shop_city && shop.shop_province && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {shop.shop_city}, {shop.shop_province}
                                                                </span>
                                                            )}
                                                            {shop.organization_name && (
                                                                <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                                                                    {shop.organization_name}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link href={`/admin/super-admin/shops/${shop.id}`}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

