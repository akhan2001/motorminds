'use client'

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { fetchShops } from "./api/fetchShops";
import { getActiveRewards } from "@/app/loyalty/utils/LoyaltyUtils";
import ShopCard from "./components/ShopCard";

export default function Marketplace() {
	const [shops, setShops] = useState<any[]>([]);
    const [activeRewards, setActiveRewards] = useState(0)
	const shop_id = "850e8400-e29b-41d4-a716-446655440001"

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

	return (
        <main className="flex items-center justify-center py-8">
            <div className="container mx-auto max-w-[1500px]">
				<h1 className="text-3xl font-bold mb-2 flex items-center gap-2">Marketplace</h1>
				<p className="text-gray-400 mb-10">Explore auto services and schedule appointments with ease.</p>

				<Input placeholder="Search for a shop" className="mb-10 w-[50%] rounded-full" />

				<div className="grid grid-cols-1 gap-6">
					{shops.map((shop: any) => (
						<ShopCard key={shop.id} shop={shop} activeRewards={activeRewards} />
					))}
				</div>
			</div>
		</main>
	);
}