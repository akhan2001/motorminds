'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, User, Mail, Phone, Shield, Crown } from 'lucide-react'
import { AdminUserFormData } from '../../types/user-creation'

interface UserFormProps {
    userForm: AdminUserFormData
    setUserForm: (form: AdminUserFormData) => void
    errors: string[]
}

export default function UserForm({ userForm, setUserForm, errors }: UserFormProps) {
    const [showPassword, setShowPassword] = useState(false)

    const handleInputChange = (field: keyof AdminUserFormData, value: string) => {
        setUserForm({
            ...userForm,
            [field]: value
        })
    }

    return (
        <Card className="bg-slate-50 dark:bg-card border-border">
            <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    User Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-muted-foreground">Full Name *</Label>
                        <Input
                            value={userForm.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                            placeholder="Enter full name"
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Email *</Label>
                        <Input
                            type="email"
                            value={userForm.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                            placeholder="Enter email address"
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Phone *</Label>
                        <Input
                            value={userForm.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                            placeholder="Enter phone number"
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Password *</Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={userForm.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500 pr-10"
                                placeholder="Enter password"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
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
                    <div>
                        <Label className="text-muted-foreground">Role *</Label>
                        <Select
                            value={userForm.role}
                            onValueChange={(value) => handleInputChange('role', value)}
                        >
                            <SelectTrigger className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-background border-border text-foreground">
                                <SelectItem value="user" className="hover:bg-muted">User</SelectItem>
                                <SelectItem value="mechanic" className="hover:bg-muted">Mechanic</SelectItem>
                                <SelectItem value="shop_owner" className="hover:bg-muted">Shop Owner</SelectItem>
                                <SelectItem value="admin" className="hover:bg-muted">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Plan *</Label>
                        <Select
                            value={userForm.plan}
                            onValueChange={(value) => handleInputChange('plan', value)}
                        >
                            <SelectTrigger className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-background border-border text-foreground">
                                <SelectItem value="DEFAULT" className="hover:bg-muted">Default</SelectItem>
                                <SelectItem value="PREMIUM" className="hover:bg-muted">Premium</SelectItem>
                                <SelectItem value="ENTERPRISE" className="hover:bg-muted">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Status *</Label>
                        <Select
                            value={userForm.status}
                            onValueChange={(value) => handleInputChange('status', value)}
                        >
                            <SelectTrigger className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-background border-border text-foreground">
                                <SelectItem value="active" className="hover:bg-muted">Active</SelectItem>
                                <SelectItem value="inactive" className="hover:bg-muted">Inactive</SelectItem>
                                <SelectItem value="suspended" className="hover:bg-muted">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                        <ul className="text-red-600 dark:text-red-400 text-sm space-y-1">
                            {errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
