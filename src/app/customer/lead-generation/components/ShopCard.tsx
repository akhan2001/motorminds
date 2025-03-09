import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getActiveRewards, getRewardNames } from "@/app/loyalty/utils/LoyaltyUtils";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// const handleFavourite = (shopName: string) => {
//     toast.success(`Shop ${shopName} added to favourites`);
// };

export default function ShopCard({ shop }: { shop: any }) {
    const router = useRouter();
    const [rewardNames, setRewardNames] = useState<string[]>([]);
    const [rewardID, setRewardID] = useState<string[]>([]);

    useEffect(() => {
        const fetchRewardNames = async () => {
            const rewardData = await getActiveRewards(shop.id);
            // Extract just the name property from each reward object
            setRewardNames(rewardData.map(reward => reward.name));
            setRewardID(rewardData.map(reward => reward.id));
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
            <Card>
                <div className="flex flex-row justify-between items-center">
                    <CardHeader>
                        <h2 className="text-xl font-semibold">{shop.shop_name}</h2>
                        <p className="text-gray-600">{shop.shop_address}, {shop.shop_city}, {shop.shop_province}</p>
                        <p className="text-gray-800 mt-2">Contact: {shop.shop_phone}</p>
                        <p className="text-gray-800 mt-2">Website: <a href={`http://${shop.website}`} target="_blank" rel="noopener noreferrer">{shop.website}</a></p>
                    </CardHeader>
                    <CardContent className="flex flex-row gap-2">
                        <Button 
                            variant="default"
                            onClick={() => {
                                router.push(`/customer/lead-generation/${encodeURIComponent(shop.shop_name)}-${shop.id}`);
                            }}>
                            Contact Shop
                        </Button>
                    </CardContent>
                </div>
                <CardFooter className="flex gap-2">
                    {rewardNames.map((reward: any, index: number) => (
                        <TooltipProvider key={rewardID[index]}>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Badge variant="outline">{reward}</Badge>
                                </TooltipTrigger>
                                <TooltipContent>{reward.description}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </CardFooter>
            </Card>
        </motion.div>
    );
}