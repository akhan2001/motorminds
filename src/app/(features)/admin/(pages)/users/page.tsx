'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Users,
    Building2,
    Calendar,
    CheckCircle,
    Edit,
    Search,
    RefreshCw,
    User,
    Shield,
    Ban,
    AlertCircle,
    Plus
} from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import { toast } from 'sonner'
import AdminNav from '../../components/AdminNav'
import { User as AdminUser, AdminStats } from '../../types/admin'

// Extended User interface for the admin page
interface ExtendedUser extends AdminUser {
    email: string
    full_name: string
    shop_name?: string
    last_login?: string
    phone?: string
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<ExtendedUser[]>([])
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editForm, setEditForm] = useState({
        full_name: '',
        email: '',
        role: 'customer' as string,
        status: 'active' as string,
        phone: '',
        plan: 'DEFAULT' as string
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchUsers()
        fetchStats()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            console.log('Fetching admin users...')

            const response = await fetch(`/api/admin/users?t=${Date.now()}`)
            console.log('Response status:', response.status)

            const data = await response.json()
            console.log('Response data:', data)

            if (response.ok) {
                console.log('Raw API response:', data)
                setUsers(data.users || [])
                console.log('Loaded users:', data.users?.length || 0)
            } else {
                console.error('API error:', data)
                toast.error(data.error || 'Failed to fetch users')
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/admin/users/stats?t=${Date.now()}`)
            const data = await response.json()

            if (response.ok) {
                setStats(data.stats)
            } else {
                console.error('Failed to fetch stats:', data)
                // Set default stats on error
                setStats({
                    totalUsers: 0,
                    activeUsers: 0,
                    inactiveUsers: 0,
                    suspendedUsers: 0,
                    totalShops: 0,
                    planDistribution: {
                        DEFAULT: 0,
                        PREMIUM: 0,
                        ENTERPRISE: 0
                    }
                })
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
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
                fetchUsers() // Refresh the list
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to update status')
            }
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('Failed to update status')
        }
    }

    const openEditModal = (user: ExtendedUser) => {
        setSelectedUser(user)
        setEditForm({
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            status: user.status,
            phone: user.phone || '',
            plan: user.plan || 'FREE'
        })
        setIsEditModalOpen(true)
    }

    const submitEdit = async () => {
        if (!selectedUser) return

        try {
            setIsSubmitting(true)

            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })

            if (response.ok) {
                toast.success('User updated successfully')
                setIsEditModalOpen(false)
                setSelectedUser(null)
                fetchUsers() // Refresh the list
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to update user')
            }
        } catch (error) {
            console.error('Error updating user:', error)
            toast.error('Failed to update user')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-600'
            case 'inactive': return 'bg-gray-600'
            case 'suspended': return 'bg-red-600'
            default: return 'bg-gray-600'
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-600'
            case 'shop_owner': return 'bg-blue-600'
            case 'mechanic': return 'bg-orange-600'
            case 'customer': return 'bg-gray-600'
            default: return 'bg-gray-600'
        }
    }

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'FREE': return 'bg-gray-600'
            case 'PREMIUM': return 'bg-blue-600'
            case 'ENTERPRISE': return 'bg-purple-600'
            default: return 'bg-gray-600'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const filteredUsers = users.filter(user => {
        const matchesFilter = filter === 'all' || user.status === filter
        const matchesSearch = searchTerm === '' ||
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.shop_name?.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesFilter && matchesSearch
    })

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Breadcrumb Navigation */}
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
                                    User Management
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage all users across the platform
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                    <Link href="/admin/create-user">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create User
                                    </Link>
                                </Button>
                                <Button
                                    onClick={fetchUsers}
                                    variant="outline"
                                    className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
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
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search users, emails, shops..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {(['all', 'active', 'inactive', 'suspended'] as const).map((status) => (
                                    <Button
                                        key={status}
                                        onClick={() => setFilter(status)}
                                        variant={filter === status ? 'default' : 'outline'}
                                        className={
                                            filter === status
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]'
                                        }
                                        size="sm"
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-blue-400" />
                                            <div>
                                                <div className="text-sm text-gray-400">Total Users</div>
                                                <div className="text-xl font-bold text-white">{stats.totalUsers}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-400" />
                                            <div>
                                                <div className="text-sm text-gray-400">Active</div>
                                                <div className="text-xl font-bold text-white">{stats.activeUsers}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-blue-400" />
                                            <div>
                                                <div className="text-sm text-gray-400">Shops</div>
                                                <div className="text-xl font-bold text-white">{stats.totalShops}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-purple-400" />
                                            <div>
                                                <div className="text-sm text-gray-400">Premium</div>
                                                <div className="text-xl font-bold text-white">{stats.planDistribution.PREMIUM + stats.planDistribution.ENTERPRISE}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                            <div>
                                                <div className="text-sm text-gray-400">Suspended</div>
                                                <div className="text-xl font-bold text-white">{stats.suspendedUsers}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Users List */}
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="text-gray-400">Loading users...</div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="text-center py-8">
                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">
                                        No {filter === 'all' ? '' : filter} users found
                                    </h3>
                                    <p className="text-gray-400">
                                        {searchTerm ? 'Try adjusting your search terms' : 'No users available at this time'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {filteredUsers.map((user) => (
                                    <Card key={user.id} className="bg-[#111111] border-[#2a2a2a]">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-white flex items-center gap-2">
                                                    <User className="h-5 w-5" />
                                                    {user.full_name}
                                                </CardTitle>
                                                <div className="flex gap-2">
                                                    <Badge className={getStatusColor(user.status)}>
                                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                    </Badge>
                                                    <Badge variant="outline" className={`${getRoleColor(user.role)} border-0`}>
                                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                    </Badge>
                                                    {user.plan && (
                                                        <Badge variant="outline" className={`${getPlanColor(user.plan)} border-0`}>
                                                            {user.plan}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* User Information */}
                                            <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#2a2a2a]">
                                                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    User Information
                                                </h4>
                                                <div className="text-sm text-gray-300 space-y-1">
                                                    <div><strong>Email:</strong> {user.email || 'N/A'}</div>
                                                    <div><strong>Full Name:</strong> {user.full_name || 'N/A'}</div>
                                                    {user.phone && <div><strong>Phone:</strong> {user.phone}</div>}
                                                    <div><strong>User ID:</strong> {user.id}</div>
                                                </div>
                                            </div>

                                            {/* Shop Information */}
                                            {user.shop_name && (
                                                <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#2a2a2a]">
                                                    <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                                        <Building2 className="h-4 w-4" />
                                                        Shop Information
                                                    </h4>
                                                    <div className="text-sm text-gray-300">
                                                        <div><strong>Shop:</strong> {user.shop_name}</div>
                                                        {user.shop_id && <div><strong>Shop ID:</strong> {user.shop_id}</div>}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dates */}
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Joined {formatDate(user.created_at)}
                                                </div>
                                                {user.last_login && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Last login {formatDate(user.last_login)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Admin Actions */}
                                            <div className="flex gap-2 pt-2 border-t border-[#2a2a2a]">
                                                <Button
                                                    onClick={() => openEditModal(user)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-blue-500 text-blue-400 hover:bg-blue-900/20"
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit User
                                                </Button>
                                                {user.status === 'active' && (
                                                    <Button
                                                        onClick={() => updateUserStatus(user.id, 'suspended')}
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500 text-red-400 hover:bg-red-900/20"
                                                    >
                                                        <Ban className="h-4 w-4 mr-2" />
                                                        Suspend
                                                    </Button>
                                                )}
                                                {user.status === 'suspended' && (
                                                    <Button
                                                        onClick={() => updateUserStatus(user.id, 'active')}
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-2" />
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

            {/* Edit User Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d0d0d] border-[#2a2a2a]">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl">
                            Edit User
                        </DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-6 mt-4">
                            {/* User Summary */}
                            <div className="bg-[#1a1a1a] p-4 rounded-lg">
                                <h3 className="text-white font-medium mb-2">User Summary</h3>
                                <div className="text-sm text-gray-300">
                                    <div><strong>Name:</strong> {selectedUser.full_name}</div>
                                    <div><strong>Email:</strong> {selectedUser.email}</div>
                                    <div><strong>Current Role:</strong> {selectedUser.role}</div>
                                    <div><strong>Current Status:</strong> {selectedUser.status}</div>
                                </div>
                            </div>

                            {/* Edit Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-300">Full Name</Label>
                                    <Input
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-300">Email</Label>
                                    <Input
                                        value={editForm.email}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-300">Role</Label>
                                    <Select
                                        value={editForm.role}
                                        onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value as User['role'] }))}
                                    >
                                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="customer">Customer</SelectItem>
                                            <SelectItem value="mechanic">Mechanic</SelectItem>
                                            <SelectItem value="shop_owner">Shop Owner</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-gray-300">Status</Label>
                                    <Select
                                        value={editForm.status}
                                        onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as User['status'] }))}
                                    >
                                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-gray-300">Phone</Label>
                                    <Input
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-300">Plan</Label>
                                    <Select
                                        value={editForm.plan}
                                        onValueChange={(value) => setEditForm(prev => ({ ...prev, plan: value }))}
                                    >
                                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DEFAULT">Default</SelectItem>
                                            <SelectItem value="PREMIUM">Premium</SelectItem>
                                            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-[#2a2a2a]">
                                <Button
                                    onClick={() => setIsEditModalOpen(false)}
                                    variant="outline"
                                    className="flex-1 border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={submitEdit}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isSubmitting ? 'Updating...' : 'Update User'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}