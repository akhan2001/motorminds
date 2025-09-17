import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getStatusColor, getPlanColor, formatStatus } from "@/lib/utils/status"
import { formatDate } from "@/lib/utils/date"
import { getInitials } from "@/lib/utils/text"

interface Shop {
    id: string
    shop_name: string
    shop_owner?: string
    shop_email?: string
    shop_phone?: string
    logo_image_url?: string
    created_at: string
    primary_user_plan?: string
    primary_user_status?: string
}

interface ShopCardProps {
    shop: Shop
}

export function ShopCard({ shop }: ShopCardProps) {

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
                                {formatStatus(shop.primary_user_status)}
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
