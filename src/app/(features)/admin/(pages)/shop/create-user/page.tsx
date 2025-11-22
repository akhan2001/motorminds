'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, ArrowLeft, UserPlus } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import AdminNav from '../../../components/AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { useAdminContext } from '../../../components/admin-context/useAdminContext'
import { UserLimitIndicator } from '../../../components/shared/UserLimitIndicator'
import { toast } from 'sonner'

interface UserLimit {
    limit: number
    maxTotal: number
    current: number
    remaining: number
    canCreate: boolean
}

export default function ShopCreateUserPage() {
    const { shopId } = useAdminContext()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [userLimit, setUserLimit] = useState<UserLimit | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'customer',
        status: 'active'
    })

    useEffect(() => {
        if (shopId) {
            fetchUserLimit()
        }
    }, [shopId])

    const fetchUserLimit = async () => {
        try {
            const response = await fetch('/api/admin/shop/user-limit')
            const data = await response.json()
            
            if (response.ok) {
                setUserLimit(data)
            } else {
                console.error('Error fetching user limit:', data.error)
            }
        } catch (error) {
            console.error('Error fetching user limit:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!userLimit?.canCreate) {
            toast.error(`You have reached the maximum limit of ${userLimit?.maxTotal} users (${userLimit?.limit} additional users).`)
            return
        }

        if (!formData.email || !formData.password || !formData.full_name) {
            toast.error('Please fill in all required fields')
            return
        }

        // Shop admins cannot create admin roles
        if (formData.role === 'admin' || formData.role === 'super-admin') {
            toast.error('Shop admins cannot create admin roles')
            return
        }

        try {
            setSubmitting(true)
            const response = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    shop_id: shopId,
                    admin_type: 'shop-admin'
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('User created successfully')
                // Reset form
                setFormData({
                    email: '',
                    password: '',
                    full_name: '',
                    role: 'customer',
                    status: 'active'
                })
                // Refresh user limit
                fetchUserLimit()
            } else {
                toast.error(data.error || 'Failed to create user')
            }
        } catch (error) {
            console.error('Error creating user:', error)
            toast.error('Failed to create user')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-4xl mx-auto w-full">
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
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin/shop/users" className="text-muted-foreground hover:text-foreground">
                                            Users
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="text-muted-foreground" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-foreground">
                                        Create User
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/admin/shop/users">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    Create User
                                </h1>
                                <p className="text-muted-foreground">
                                    Add a new user to your shop (Max {userLimit?.maxTotal} users total: shop admin + {userLimit?.limit} additional)
                                </p>
                            </div>
                        </div>

                        {/* User Limit Indicator */}
                        {userLimit && (
                            <div className="mb-6">
                                <UserLimitIndicator
                                    limit={userLimit.limit}
                                    current={userLimit.current}
                                    remaining={userLimit.remaining}
                                    canCreate={userLimit.canCreate}
                                />
                            </div>
                        )}

                        {/* Create User Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-foreground">User Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-foreground">
                                                Email <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="user@example.com"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-foreground">
                                                Password <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="••••••••"
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="full_name" className="text-foreground">
                                            Full Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-foreground">
                                                Role <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="customer">Customer</SelectItem>
                                                    <SelectItem value="mechanic">Mechanic</SelectItem>
                                                    <SelectItem value="shop_owner">Shop Owner</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Shop admins cannot create admin roles
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="text-foreground">
                                                Status <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {!userLimit?.canCreate && (
                                        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-red-700 dark:text-red-300">
                                                <p className="font-medium mb-1">User Limit Reached</p>
                                                <p>
                                                    You have reached the maximum limit of {userLimit?.maxTotal} users (shop admin + {userLimit?.limit} additional). 
                                                    Please contact support to increase your limit.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={!userLimit?.canCreate || submitting}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            {submitting ? 'Creating...' : 'Create User'}
                                        </Button>
                                        <Button asChild variant="outline" type="button">
                                            <Link href="/admin/shop/users">Cancel</Link>
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

