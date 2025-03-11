'use client'

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllShops } from "./api/fetchShops";
import ShopCard from "./components/ShopCard";
import { Search } from "lucide-react";

export default function Marketplace() {
	const [shops, setShops] = useState<any[]>([]);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filteredShops, setFilteredShops] = useState<any[]>([]);

	useEffect(() => {
		const loadShops = async () => {
			const shopData = await getAllShops();
			setShops(shopData);
			setFilteredShops(shopData);
		};

		loadShops();
	}, []);

	// Filter shops based on search query
	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredShops(shops);
			return;
		}

		const filtered = shops.filter((shop) => 
			shop.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			shop.shop_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			shop.shop_province?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			shop.shop_address?.toLowerCase().includes(searchQuery.toLowerCase())
		);
		
		setFilteredShops(filtered);
	}, [searchQuery, shops]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	return (
		<main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
			{/* Header */}
			<div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
				<div className="container mx-auto max-w-[1500px] py-4 px-6">
					<h1 className="text-2xl font-bold">Motorminds Marketplace</h1>
				</div>
			</div>

			{/* Main content */}
			<div className="container mx-auto max-w-[1500px] py-8 px-6">
				<div className="mb-10">
					<h2 className="text-3xl font-bold mb-2">Find Your Perfect Auto Service</h2>
					<p className="text-gray-500 dark:text-gray-400">Explore top-rated auto services and schedule appointments with ease.</p>
				</div>

				{/* Search bar with icon */}
				<div className="relative mb-10 max-w-xl">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					<Input 
						placeholder="Search by shop name, city, or address..." 
						className="pl-10 py-6 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm" 
						value={searchQuery}
						onChange={handleSearchChange}
					/>
				</div>

				{/* Shop cards */}
				<div className="grid grid-cols-1 gap-6">
					{filteredShops.length > 0 ? (
						filteredShops.map((shop: any) => (
							<ShopCard key={shop.id} shop={shop} />
						))
					) : (
						<div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
							<Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
							<h3 className="text-xl font-medium mb-2">No shops found</h3>
							<p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria or browse all shops.</p>
							<Button 
								variant="outline" 
								className="mt-4"
								onClick={() => setSearchQuery("")}
							>
								View all shops
							</Button>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}