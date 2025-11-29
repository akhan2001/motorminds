'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
    Users, 
    Search, 
    RefreshCw,
    User,
    Ban
} from 'lucide-react'
import { Nav } from '@/components/navigation/nav'
import Link from 'next/link'
import AdminNav from '../../../components/AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { useAdminContext } from '../../../components/admin-context/useAdminContext'
import { toast } from 'sonner'

interface ShopUser {
    id: string
    email: string
    full_name: string
    role: string
    status: string
    plan: string
    created_at: string
}

export default function ShopUsersPage() {
    const { shopId } = useAdminContext()
    const [users, setUsers] = useState<ShopUser[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (shopId) {
            fetchUsers()
        }
    }, [shopId])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/shop/users')
            const data = await response.json()
            
            if (response.ok) {
                setUsers(data.users || [])
            } else {
                console.error('Error fetching users:', data.error)
                toast.error(data.error || 'Failed to fetch users')
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const updateUserStatus = async (userId: string, status: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (response.ok) {
                toast.success(`User status updated to ${status}`)
                fetchUsers()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to update status')
            }
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('Failed to update status')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
            case 'inactive': return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
            case 'suspended': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'shop_owner': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
            case 'mechanic': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
            case 'customer': return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesFilter = filter === 'all' || user.status === filter
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        const matchesSearch = searchTerm === '' || 
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        
        return matchesFilter && matchesRole && matchesSearch
    })

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
                                        Users
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
                                    Shop Users
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage users in your shop
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                                    <Link href="/admin/shop/create-user">
                                        Create User
                                    </Link>
                                </Button>
                                <Button
                                    onClick={fetchUsers}
                                    variant="outline"
                                    size="sm"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users, emails..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="shop_owner">Shop Owner</SelectItem>
                                    <SelectItem value="mechanic">Mechanic</SelectItem>
                                    <SelectItem value="customer">Customer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Users List */}
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading users...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-foreground mb-2">
                                        No users found
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm ? 'Try adjusting your search' : 'No users in your shop'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredUsers.map((user) => (
                                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-foreground flex items-center gap-2">
                                                    <User className="h-5 w-5" />
                                                    {user.full_name || user.email}
                                                </CardTitle>
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className={getStatusColor(user.status)}>
                                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                    </Badge>
                                                    <Badge variant="outline" className={getRoleColor(user.role)}>
                                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="bg-muted/50 p-3 rounded-lg">
                                                <div className="text-sm text-muted-foreground space-y-1">
                                                    <div><strong className="text-foreground">Email:</strong> {user.email || 'N/A'}</div>
                                                    <div><strong className="text-foreground">Full Name:</strong> {user.full_name || 'N/A'}</div>
                                                    <div><strong className="text-foreground">User ID:</strong> {user.id}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 pt-2 border-t">
                                                {user.status === 'active' && (
                                                    <Button
                                                        onClick={() => updateUserStatus(user.id, 'suspended')}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <Ban className="h-4 w-4 mr-2" />
                                                        Suspend
                                                    </Button>
                                                )}
                                                {user.status === 'suspended' && (
                                                    <Button
                                                        onClick={() => updateUserStatus(user.id, 'active')}
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        Activate
                                                    </Button>
                                                )}
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

