'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Building2, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'
import { getInitials } from '@/lib/utils/text'
import { StatusBadge } from './StatusBadge'

interface Shop {
    id: string
    shop_name: string
    shop_owner?: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    logo_image_url?: string
    created_at: string
    organization_name?: string
    organization_id?: string
}

interface ShopCardProps {
    shop: Shop
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    showActions?: boolean
}

export function ShopCard({ 
    shop, 
    onView, 
    onEdit, 
    showActions = true 
}: ShopCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={shop.logo_image_url} alt={shop.shop_name} />
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                                {getInitials(shop.shop_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-foreground text-lg">
                                {shop.shop_name}
                            </CardTitle>
                            {shop.shop_owner && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {shop.shop_owner}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {shop.organization_name && (
                    <Badge variant="outline" className="w-fit">
                        {shop.organization_name}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                    {shop.shop_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{shop.shop_email}</span>
                        </div>
                    )}
                    {shop.shop_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{shop.shop_phone}</span>
                        </div>
                    )}
                    {(shop.shop_address || shop.shop_city) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                                {[shop.shop_address, shop.shop_city, shop.shop_province]
                                    .filter(Boolean)
                                    .join(', ')}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Created {formatDate(shop.created_at)}</span>
                    </div>
                </div>
                
                {showActions && (onView || onEdit) && (
                    <div className="flex gap-2 pt-3 border-t">
                        {onView && (
                            <Button
                                onClick={() => onView(shop.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                            >
                                View
                            </Button>
                        )}
                        {onEdit && (
                            <Button
                                onClick={() => onEdit(shop.id)}
                                size="sm"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

