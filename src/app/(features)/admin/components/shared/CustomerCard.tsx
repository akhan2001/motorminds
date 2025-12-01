'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail, Phone, Building2 } from 'lucide-react'
import { getInitials } from '@/lib/utils/text'
import { formatPhoneNumber } from '@/utils/format-phone'

interface Customer {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone?: string
    customer_address?: string
    shop_id: string
    created_at: string
    shops?: {
        shop_name: string
        shop_email?: string
    }
}

interface CustomerCardProps {
    customer: Customer
    showShopName?: boolean
    onClick?: () => void
}

export function CustomerCard({ customer, showShopName = false, onClick }: CustomerCardProps) {
    return (
        <Card 
            className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-red-600 text-white">
                            {getInitials(customer.customer_name)}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                            {customer.customer_name}
                        </h3>
                        
                        <div className="space-y-1 mt-2">
                            {customer.customer_email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{customer.customer_email}</span>
                                </div>
                            )}
                            
                            {customer.customer_phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{formatPhoneNumber(customer.customer_phone)}</span>
                                </div>
                            )}
                            
                            {showShopName && customer.shops?.shop_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building2 className="h-3 w-3" />
                                    <span className="truncate">{customer.shops.shop_name}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-3 text-xs text-muted-foreground">
                            Added {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
