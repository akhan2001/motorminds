'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Plus, Search, MapPin, Phone, Mail } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import AdminNav from '../../../components/AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { useAdminContext } from '../../../components/admin-context/useAdminContext'

interface Shop {
    id: string
    shop_name: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    created_at: string
}

export default function OrganizationShopsPage() {
    const { organizationId } = useAdminContext()
    const [shops, setShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (organizationId) {
            fetchShops()
        }
    }, [organizationId])

    const fetchShops = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/organization/shops')
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

    const filteredShops = shops.filter(shop =>
        shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.shop_city?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
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
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    Organization Shops
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage all shops in your organization
                                </p>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Shop
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
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

                        {/* Shops Grid */}
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
                                    <p className="text-muted-foreground mb-4">
                                        {searchTerm ? 'Try adjusting your search' : 'Add your first shop to get started'}
                                    </p>
                                    {!searchTerm && (
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Shop
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredShops.map((shop) => (
                                    <Card key={shop.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground mb-2">{shop.shop_name}</h3>
                                            <div className="space-y-2 text-sm text-muted-foreground">
                                                {shop.shop_address && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{shop.shop_address}</span>
                                                    </div>
                                                )}
                                                {shop.shop_city && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{shop.shop_city}, {shop.shop_province}</span>
                                                    </div>
                                                )}
                                                {shop.shop_phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4" />
                                                        <span>{shop.shop_phone}</span>
                                                    </div>
                                                )}
                                                {shop.shop_email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        <span>{shop.shop_email}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                asChild
                                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                                                size="sm"
                                            >
                                                <Link href={`/admin/organization/shops/${shop.id}`}>
                                                    View Details
                                                </Link>
                                            </Button>
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

