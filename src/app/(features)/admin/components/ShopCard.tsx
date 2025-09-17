import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Shop {
    id: string
    shop_name: string
    shop_owner?: string
    shop_email?: string
    shop_phone?: string
    logo_image_url?: string
    created_at: string
    primary_user_plan?: 'DEFAULT' | 'PREMIUM' | 'ENTERPRISE'
    primary_user_status?: 'active' | 'inactive' | 'suspended'
}

interface ShopCardProps {
    shop: Shop
}

export function ShopCard({ shop }: ShopCardProps) {
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500 text-white'
            case 'inactive':
                return 'bg-gray-500 text-white'
            case 'suspended':
                return 'bg-red-500 text-white'
            default:
                return 'bg-gray-500 text-white'
        }
    }

    const getPlanColor = (plan?: string) => {
        switch (plan) {
            case 'PREMIUM':
                return 'bg-blue-500 text-white'
            case 'ENTERPRISE':
                return 'bg-purple-500 text-white'
            default:
                return 'bg-gray-600 text-white'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={shop.logo_image_url} alt={shop.shop_name} />
                        <AvatarFallback className="bg-[#2a2a2a] text-white font-medium">
                            {getInitials(shop.shop_name)}
                        </AvatarFallback>
                    </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-white">
                                {shop.shop_name}
                            </CardTitle>
                            {shop.shop_owner && (
                                <p className="text-sm text-gray-400">
                                    {shop.shop_owner}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-3">
                        {shop.primary_user_status && (
                            <Badge className={getStatusColor(shop.primary_user_status)}>
                                {shop.primary_user_status.charAt(0).toUpperCase() + shop.primary_user_status.slice(1)}
                            </Badge>
                        )}
                        
                        {shop.primary_user_plan && (
                            <Badge className={getPlanColor(shop.primary_user_plan)}>
                                {shop.primary_user_plan}
                            </Badge>
                        )}
                    </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Contact Info */}
                {shop.shop_email && (
                    <p className="text-sm text-gray-400">{shop.shop_email}</p>
                )}
                {shop.shop_phone && (
                    <p className="text-sm text-gray-400">{shop.shop_phone}</p>
                )}

                {/* Created Date */}
                <div className="pt-3 border-t border-[#2a2a2a]">
                    <p className="text-xs text-gray-500">
                        Created {formatDate(shop.created_at)}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
