'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Building2, Mail, Phone, MapPin, Calendar, Globe, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'
import { Badge } from '@/components/ui/badge'

interface Shop {
    id: string
    shop_name: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    shop_owner?: string
    shop_about?: string
    shop_tagline?: string
    website?: string
    business_number?: string
    hst_number?: string
    default_hourly_rate?: number
    created_at: string
    organization_name?: string
}

interface ShopDetailsModalProps {
    shop: Shop | null
    isOpen: boolean
    onClose: () => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

export function ShopDetailsModal({
    shop,
    isOpen,
    onClose,
    onEdit,
    onDelete
}: ShopDetailsModalProps) {
    if (!shop) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {shop.shop_name}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                    {shop.organization_name && (
                        <Badge variant="outline">
                            {shop.organization_name}
                        </Badge>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shop.shop_email && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Email</p>
                                <p className="text-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {shop.shop_email}
                                </p>
                            </div>
                        )}
                        {shop.shop_phone && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                <p className="text-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {shop.shop_phone}
                                </p>
                            </div>
                        )}
                        {(shop.shop_address || shop.shop_city) && (
                            <div className="space-y-1 md:col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Address</p>
                                <p className="text-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {[shop.shop_address, shop.shop_city, shop.shop_province]
                                        .filter(Boolean)
                                        .join(', ') || 'N/A'}
                                </p>
                            </div>
                        )}
                        {shop.shop_owner && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Owner</p>
                                <p className="text-foreground">{shop.shop_owner}</p>
                            </div>
                        )}
                        {shop.website && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Website</p>
                                <p className="text-foreground flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <a 
                                        href={shop.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        {shop.website}
                                    </a>
                                </p>
                            </div>
                        )}
                        {shop.default_hourly_rate && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                                <p className="text-foreground">${shop.default_hourly_rate.toFixed(2)}</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p className="text-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(shop.created_at)}
                            </p>
                        </div>
                    </div>

                    {shop.shop_tagline && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Tagline</p>
                            <p className="text-foreground italic">{shop.shop_tagline}</p>
                        </div>
                    )}

                    {shop.shop_about && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">About</p>
                            <p className="text-foreground">{shop.shop_about}</p>
                        </div>
                    )}

                    {(shop.business_number || shop.hst_number) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            {shop.business_number && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Business Number</p>
                                    <p className="text-foreground">{shop.business_number}</p>
                                </div>
                            )}
                            {shop.hst_number && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">HST Number</p>
                                    <p className="text-foreground">{shop.hst_number}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {(onEdit || onDelete) && (
                        <div className="flex gap-3 pt-4 border-t">
                            {onEdit && (
                                <Button
                                    onClick={() => {
                                        onEdit(shop.id)
                                        onClose()
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    onClick={() => {
                                        onDelete(shop.id)
                                        onClose()
                                    }}
                                    variant="destructive"
                                    className="flex-1"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

