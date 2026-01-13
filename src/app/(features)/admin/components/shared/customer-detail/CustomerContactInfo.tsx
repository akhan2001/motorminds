'use client'

import React from 'react'
import { User, Mail, Phone, MapPin, Building2, Calendar } from 'lucide-react'
import { formatPhoneNumber } from '@/utils/format-phone'
import { formatDate } from './utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Customer } from './types'

interface CustomerContactInfoProps {
    customer: Customer
    isEditing?: boolean
    editData?: {
        customer_name: string
        customer_email: string
        customer_phone: string
        customer_address: string
    }
    onFieldChange?: (field: string, value: string) => void
}

export const CustomerContactInfo: React.FC<CustomerContactInfoProps> = ({ 
    customer, 
    isEditing = false,
    editData,
    onFieldChange 
}) => {
    if (isEditing && editData && onFieldChange) {
        return (
            <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <h3 className="text-foreground dark:text-white font-medium">Edit Contact Information</h3>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="customer_name" className="text-foreground text-sm">
                            Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="customer_name"
                            value={editData.customer_name}
                            onChange={(e) => onFieldChange('customer_name', e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground"
                            placeholder="Customer name"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_email" className="text-foreground text-sm">
                                Email
                            </Label>
                            <Input
                                id="customer_email"
                                type="email"
                                value={editData.customer_email}
                                onChange={(e) => onFieldChange('customer_email', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground"
                                placeholder="customer@email.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer_phone" className="text-foreground text-sm">
                                Phone
                            </Label>
                            <Input
                                id="customer_phone"
                                value={editData.customer_phone}
                                onChange={(e) => onFieldChange('customer_phone', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground"
                                placeholder="1234567890"
                                maxLength={10}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="customer_address" className="text-foreground text-sm">
                            Address
                        </Label>
                        <Input
                            id="customer_address"
                            value={editData.customer_address}
                            onChange={(e) => onFieldChange('customer_address', e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground"
                            placeholder="123 Main St, City, State ZIP"
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <h3 className="text-foreground dark:text-white font-medium">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {customer.customer_email && (
                    <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                        <span className="text-foreground dark:text-white">{customer.customer_email === "NULL" ? "-" : customer.customer_email}</span>
                    </div>
                )}
                {customer.customer_phone && (
                    <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                        <span className="text-foreground dark:text-white">{formatPhoneNumber(customer.customer_phone)}</span>
                    </div>
                )}
                {customer.customer_address && (
                    <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                        <span className="text-foreground dark:text-white">{customer.customer_address === "NULL" ? "-" : customer.customer_address}</span>
                    </div>
                )}
                {customer.shops?.shop_name && (
                    <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                        <span className="text-foreground dark:text-white">{customer.shops.shop_name}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                    <span className="text-foreground dark:text-white">
                        Customer since {formatDate(customer.created_at)}
                    </span>
                </div>
            </div>
        </div>
    )
}
