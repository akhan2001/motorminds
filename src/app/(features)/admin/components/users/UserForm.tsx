'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserFormData {
    email: string
    password?: string
    full_name: string
    role: string
    status: string
    plan?: string
    phone?: string
}

interface UserFormProps {
    initialData?: Partial<UserFormData>
    onSubmit: (data: UserFormData) => void
    onCancel?: () => void
    isLoading?: boolean
    adminType?: 'super-admin' | 'organization-admin' | 'shop-admin'
    availableRoles?: string[]
}

export function UserForm({ 
    initialData, 
    onSubmit, 
    onCancel,
    isLoading = false,
    adminType = 'super-admin',
    availableRoles
}: UserFormProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState<UserFormData>({
        email: initialData?.email || '',
        password: initialData?.password || '',
        full_name: initialData?.full_name || '',
        role: initialData?.role || 'customer',
        status: initialData?.status || 'active',
        plan: initialData?.plan || 'DEFAULT',
        phone: initialData?.phone || ''
    })

    // Determine available roles based on admin type
    const getAvailableRoles = () => {
        if (availableRoles) return availableRoles
        
        switch (adminType) {
            case 'super-admin':
                return ['customer', 'mechanic', 'shop_owner', 'admin', 'super-admin']
            case 'organization-admin':
                return ['customer', 'mechanic', 'shop_owner']
            case 'shop-admin':
                return ['customer', 'mechanic', 'shop_owner']
            default:
                return ['customer', 'mechanic', 'shop_owner']
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    const roles = getAvailableRoles()
    const isEditMode = !!initialData?.email && !initialData?.password

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                                disabled={isEditMode}
                            />
                        </div>
                        {!isEditMode && (
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-foreground">
                                    Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
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
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {role.split('_').map(word => 
                                                word.charAt(0).toUpperCase() + word.slice(1)
                                            ).join(' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {adminType === 'shop-admin' && (
                                <p className="text-xs text-muted-foreground">
                                    Shop admins cannot create admin roles
                                </p>
                            )}
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
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {adminType === 'super-admin' && (
                        <div className="space-y-2">
                            <Label htmlFor="plan" className="text-foreground">
                                Plan
                            </Label>
                            <Select
                                value={formData.plan}
                                onValueChange={(value) => setFormData({ ...formData, plan: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DEFAULT">Default</SelectItem>
                                    <SelectItem value="PREMIUM">Premium</SelectItem>
                                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isLoading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
                        </Button>
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

