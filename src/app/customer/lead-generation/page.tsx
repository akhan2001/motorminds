'use client'

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardFooter, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { fetchShops } from "./fetchShops";
import { getActiveRewards } from "@/app/loyalty/utils/LoyaltyUtils";

export default function Marketplace() {
	const [shops, setShops] = useState<any[]>([]);
    const [activeRewards, setActiveRewards] = useState(0)
	const shop_id = "850e8400-e29b-41d4-a716-446655440001"

	const router = useRouter();

	useEffect(() => {
		const loadShops = async () => {
			const shopData = await fetchShops();
			setShops(shopData);
		};

		const loadActiveRewards = async (shop_id: string) => {
			const activeRewards = await getActiveRewards(shop_id);
            setActiveRewards(activeRewards.length || 0)
		};

		loadShops();
		loadActiveRewards(shop_id);
	}, []);

	const handleFavourite = (shopName: string) => {
		toast.success(`Shop ${shopName} added to favourites`);
	};

	return (
		
        <main className="flex items-center justify-center py-8">
            <div className="container mx-auto max-w-[1500px]">
				<h1 className="text-3xl font-bold mb-2 flex items-center gap-2">Marketplace</h1>
				<p className="text-gray-400 mb-10">Explore auto services and schedule appointments with ease.</p>

				<Input placeholder="Search for a shop" className="mb-10 w-[50%] rounded-full" />

				<div className="grid grid-cols-1 gap-6">
					{shops.map((shop: any, index: number) => (
						<Card key={index} className="shadow ">
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
									<Button variant="secondary" onClick={() => handleFavourite(shop.shop_name)}>Favourite</Button>
								</CardContent>
							</div>
							<CardFooter className="mt-4 flex gap-2">
								<Badge variant="outline">
									{shop.shop_province}
								</Badge>
							</CardFooter>
						</Card>
					))}
				</div>
			</div>
		</main>
	);
}