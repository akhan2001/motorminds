'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import AdminNav from '../../../components/AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Organization {
    id: string
    name: string
    organization_type: string
    billing_email?: string
    status: string
    created_at: string
    shop_count?: number
}

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/super-admin/organizations')
            const data = await response.json()
            
            if (response.ok) {
                setOrganizations(data.organizations)
            } else {
                console.error('Error fetching organizations:', data.error)
            }
        } catch (error) {
            console.error('Error fetching organizations:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredOrganizations = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                                        Organizations
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
                                    Organizations
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage all MSOs and organizations
                                </p>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Organization
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search organizations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Organizations List */}
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading organizations...</p>
                            </div>
                        ) : filteredOrganizations.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-foreground mb-2">
                                        No organizations found
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        {searchTerm ? 'Try adjusting your search' : 'Create your first organization to get started'}
                                    </p>
                                    {!searchTerm && (
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Organization
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredOrganizations.map((org) => (
                                    <Card key={org.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                                        <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-foreground">{org.name}</h3>
                                                        <p className="text-sm text-muted-foreground">{org.billing_email}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                                                                {org.organization_type}
                                                            </Badge>
                                                            <Badge variant="outline" className={
                                                                org.status === 'active' 
                                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                                                                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
                                                            }>
                                                                {org.status}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {org.shop_count || 0} shops
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link href={`/admin/super-admin/organizations/${org.id}`}>
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

