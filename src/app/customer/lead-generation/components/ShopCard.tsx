import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getActiveRewards, getRewardNames } from "@/app/loyalty/utils/LoyaltyUtils";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
            // Extract just the name property from each reward object
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
                hasRewards ? "border-blue-600" : "",
                hasRewards ? "shadow-md shadow-blue-100 dark:shadow-blue-900/20" : ""
            )}>
                <div className="flex flex-row justify-between items-center">
                    <CardHeader>
                        <div className="flex items-center">
                            <h2 className="text-xl font-semibold">{shop.shop_name}</h2>
                            {/* {hasRewards && (
                                <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                    Rewards Available
                                </Badge>
                            )} */}
                        </div>
                        <p className="text-gray-600">{shop.shop_address}, {shop.shop_city}, {shop.shop_province}</p>
                        <p className="text-gray-800 mt-2">Contact: {shop.shop_phone}</p>
                        <p className="text-gray-800 mt-2">Website: <a href={`http://${shop.website}`} target="_blank" rel="noopener noreferrer">{shop.website}</a></p>
                    </CardHeader>
                    <CardContent className="flex flex-row gap-2">
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
                <CardFooter className="flex gap-2">
                    {rewardNames.length > 0 ? (
                        rewardNames.map((reward: any, index: number) => (
                            <TooltipProvider key={rewardID[index]}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                                            {reward}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>{rewardDescription[index]}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))
                    ) : (
                        <span className="text-sm text-gray-500">No active rewards</span>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    );
}