'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardFooter, CardContent } from "@/components/ui/card";
import { fetchShops } from "./fetchShops";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// const shops = [
//   {
//     name: "AutoFix Garage",
//     location: "123 Main St, Anytown",
//     services: ["Brake Repair", "Oil Change", "Tire Rotation"],
//     rating: 4.5,
//   },
//   {
//     name: "Speedy Motors",
//     location: "456 Elm St, Anytown",
//     services: ["Engine Tuning", "Transmission Repair"],
//     rating: 4.7,
//   },
//   {
//     name: "Speedy Motors",
//     location: "456 Elm St, Anytown",
//     services: ["Engine Tuning", "Transmission Repair"],
//     rating: 4.7,
//   },
//   {
//     name: "Speedy Motors",
//     location: "456 Elm St, Anytown",
//     services: ["Engine Tuning", "Transmission Repair"],
//     rating: 4.7,
//   },
//   {
//     name: "Speedy Motors",
//     location: "456 Elm St, Anytown",
//     services: ["Engine Tuning", "Transmission Repair"],
//     rating: 4.7,
//   },
//   // Add more shops as needed
// ];

export default function Marketplace() {
	const [shops, setShops] = useState<any[]>([]);
	const router = useRouter();

	useEffect(() => {
		const loadShops = async () => {
			const shopData = await fetchShops();
			setShops(shopData);
		};
		loadShops();
	}, []);

	const handleFavourite = (shopName: string) => {
		toast.success(`Shop ${shopName} added to favourites`);
	};

	return (
		<div className="max-w-[1200px] mx-auto p-4">
			<h1 className="text-3xl font-bold mb-6">Marketplace</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
				{shops.map((shop: any, index: number) => (
					<Card key={index} className="shadow">
						<CardHeader>
							<h2 className="text-xl font-semibold">{shop.shop_name}</h2>
							<p className="text-gray-600">{shop.shop_address}, {shop.shop_city}, {shop.shop_province}</p>
						</CardHeader>
						<CardContent>
							<p className="text-gray-800 mt-2">Services Offered:</p>
							<ul className="list-disc list-inside">
								{(shop.services_offered || []).map((service: string, idx: number) => (
									<li key={idx}>{service}</li>
								))}
							</ul>
							<p className="text-gray-800 mt-2">Operating Hours: {shop.operating_hours['Monday-Friday']}</p>
							<p className="text-gray-800 mt-2">Contact: {shop.shop_phone}</p>
							<p className="text-gray-800 mt-2">Email: {shop.shop_email}</p>
							<p className="text-gray-800 mt-2">Website: <a href={`http://${shop.website}`} target="_blank" rel="noopener noreferrer">{shop.website}</a></p>
						</CardContent>
						<CardFooter className="mt-4 flex gap-2">
							<Button variant="default" onClick={() => router.push(`/lead-generation/${encodeURIComponent(shop.shop_name)}`)}>Contact Shop</Button>
							<Button variant="secondary" onClick={() => handleFavourite(shop.shop_name)}>Favourite</Button>
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}