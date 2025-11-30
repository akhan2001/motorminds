'use client'

import React from 'react'
import { User, Mail, Phone, MapPin, Building2, Calendar } from 'lucide-react'
import { formatPhoneNumber } from '@/utils/format-phone'
import { formatDate } from './utils'
import type { Customer } from './types'

interface CustomerContactInfoProps {
    customer: Customer
}

export const CustomerContactInfo: React.FC<CustomerContactInfoProps> = ({ customer }) => {
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
                        <span className="text-foreground dark:text-white">{customer.customer_email}</span>
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
                        <span className="text-foreground dark:text-white">{customer.customer_address}</span>
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
