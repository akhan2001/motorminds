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
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-gray-300">Full Name *</Label>
                        <Input
                            value={userForm.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            placeholder="Enter full name"
                        />
                    </div>
                    <div>
                        <Label className="text-gray-300">Email *</Label>
                        <Input
                            type="email"
                            value={userForm.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            placeholder="Enter email address"
                        />
                    </div>
                    <div>
                        <Label className="text-gray-300">Phone *</Label>
                        <Input
                            value={userForm.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            placeholder="Enter phone number"
                        />
                    </div>
                    <div>
                        <Label className="text-gray-300">Password *</Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={userForm.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white pr-10"
                                placeholder="Enter password"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label className="text-gray-300">Role *</Label>
                        <Select
                            value={userForm.role}
                            onValueChange={(value) => handleInputChange('role', value)}
                        >
                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="mechanic">Mechanic</SelectItem>
                                <SelectItem value="shop_owner">Shop Owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-gray-300">Plan *</Label>
                        <Select
                            value={userForm.plan}
                            onValueChange={(value) => handleInputChange('plan', value)}
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
                    <div>
                        <Label className="text-gray-300">Status *</Label>
                        <Select
                            value={userForm.status}
                            onValueChange={(value) => handleInputChange('status', value)}
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
                </div>

                {errors.length > 0 && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                        <ul className="text-red-400 text-sm space-y-1">
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
