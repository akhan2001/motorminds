import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getActiveRewards } from "@/app/loyalty/utils/LoyaltyUtils";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MapPin, Phone, Globe } from "lucide-react";

// const handleFavourite = (shopName: string) => {
//     toast.success(`Shop ${shopName} added to favourites`);
// };

export default function ShopCard({ shop }: { shop: any }) {
    const router = useRouter();
    const [rewardNames, setRewardNames] = useState<string[]>([]);
    const [rewardID, setRewardID] = useState<string[]>([]);
    const [rewardDescription, setRewardDescription] = useState<string[]>([]);
    const [hasRewards, setHasRewards] = useState<boolean>(false);

    useEffect(() => {
        const fetchRewardNames = async () => {
            const rewardData = await getActiveRewards(shop.id);
            setRewardNames(rewardData.map(reward => reward.name));
            setRewardDescription(rewardData.map(reward => reward.description));
            setRewardID(rewardData.map(reward => reward.id));
            setHasRewards(rewardData.length > 0);
        };
        fetchRewardNames();
    }, [shop.id]);

    return (
        <motion.div
            className="shadow cursor-pointer transition-all duration-300"
            onClick={() => {
                router.push(`/customer/lead-generation/${encodeURIComponent(shop.shop_name)}-${shop.id}`);
            }}
            whileHover={{ scale: 1.005 }}
        >
            <Card className={cn(
                "overflow-hidden",
                hasRewards ? "border-blue-600 shadow-md shadow-blue-100 dark:shadow-blue-900/20" : ""
            )}>
                <div className="flex flex-col sm:flex-row justify-between">
                    <CardHeader className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                            <h2 className="text-xl font-semibold">{shop.shop_name}</h2>
                            <Button 
                                variant="default"
                                className="sm:hidden"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/customer/lead-generation/${encodeURIComponent(shop.shop_name)}-${shop.id}`);
                                }}>
                                Contact
                            </Button>
                        </div>
                        
                        <div className="space-y-2 text-sm sm:text-base">
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span className="line-clamp-1">
                                    {shop.shop_address}, {shop.shop_city}, {shop.shop_province}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-800">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{shop.shop_phone}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-800">
                                <Globe className="h-4 w-4 flex-shrink-0" />
                                <a 
                                    href={`http://${shop.website}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-blue-600 transition-colors line-clamp-1"
                                >
                                    {shop.website}
                                </a>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pb-6 px-6 hidden sm:flex items-start pt-6">
                        <Button 
                            variant="default"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/customer/lead-generation/${encodeURIComponent(shop.shop_name)}-${shop.id}`);
                            }}>
                            Contact Shop
                        </Button>
                    </CardContent>
                </div>

                <CardFooter className="flex flex-wrap gap-2 bg-gray-50/50 dark:bg-gray-900/50 px-6 py-4 border-t">
                        <div className="flex flex-wrap gap-2">
                            {rewardNames.map((reward: any, index: number) => (
                                <TooltipProvider key={rewardID[index]}>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge 
                                                variant="outline" 
                                                className="border-blue-300 text-blue-700 dark:border-blue-700 
                                                            dark:text-blue-300 whitespace-nowrap"
                                            >
                                                {reward}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>{rewardDescription[index]}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}