import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getRewardNames } from "@/app/loyalty/utils/LoyaltyUtils";
import { useState, useEffect } from "react";

const handleFavourite = (shopName: string) => {
    toast.success(`Shop ${shopName} added to favourites`);
};

export default function ShopCard({ shop, activeRewards }: { shop: any, activeRewards: number }) {
    const router = useRouter();
    const [rewardNames, setRewardNames] = useState<string[]>([]);

    useEffect(() => {
        const fetchRewardNames = async () => {
            const rewardNames = await getRewardNames();
            setRewardNames(rewardNames.map((reward: any) => reward.name));
        };
        fetchRewardNames();
    }, []);

    return (
        <motion.div
            className="shadow cursor-pointer transition-all duration-300 s"
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
                    <p className="text-gray-800 mt-2">Rewards: {activeRewards}</p>
                </CardHeader>
                <CardContent className="flex flex-row gap-2">
                    {/* <p className="text-gray-800 mt-2">Services Offered:</p>
                    <ul className="list-disc list-inside">
                        {(shop.services_offered || []).map((service: string, idx: number) => (
                            <li key={idx}>{service}</li>
                        ))}
                    </ul> */}
                    <Button 
                    variant="default"
                    onClick={() => {
                        router.push(`/customer/lead-generation/${encodeURIComponent(shop.shop_name)}-${shop.id}`);
                    }}>
                        Contact Shop
                    </Button>
                </CardContent>
            </div>
            <CardFooter className="mt-4 flex gap-2">
                <Badge variant="outline">
                    {shop.shop_province}
                </Badge>
                {rewardNames.map((reward: string) => (
                    <Badge variant="outline" key={reward}>{reward}</Badge>
                ))}
            </CardFooter>
            </Card>
        </motion.div>
    )
} 