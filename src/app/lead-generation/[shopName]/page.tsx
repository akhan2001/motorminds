'use client'

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchShops } from "../fetchShops";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ContactShop() {
	const router = useRouter();
	const params = useParams<{ shopName: string }>();
	const [shopData, setShopData] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [shopName, setShopName] = useState<string | null>(null);
	const [shopID, setShopID] = useState<string | null>(null);

	useEffect(() => {
		if (!params?.shopName) {
			router.push('/lead-generation');
			return;
		}

		const [encodedShopName, shopID] = params.shopName.split(/-(.+)/);
		const shopName = decodeURIComponent(encodedShopName);
		setShopName(shopName);
		setShopID(shopID);

		const fetchShopData = async () => {
			try {
				const data = await fetchShops(shopID);
				setShopData(data);
			} catch (error) {
				console.error("Error fetching shop data:", error);
				setError("Failed to load shop data. Please try again later.");
			}
		};

		fetchShopData();
	}, [params, router]);

	const [formData, setFormData] = useState({
		name: "",
		phone: "",
		email: "",
		message: "",
		shop_id: shopID,
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		toast.success(`Message sent to ${shopData?.shop_name || "the shop"}`);
		// console.log("Shop ID: ", shopID);
		setFormData({ name: "", phone: "", email: "", message: "", shop_id: shopID });

		const sendMessage = async () => {
			const response = await fetch(`/dashboard/api/receive-message`, {
				method: "POST",
				body: JSON.stringify(formData),
			});
		};
		sendMessage();
	};

	if (error) {
		return <p>{error}</p>;
	}

	if (!shopData) {
		return <p>Loading...</p>;
	}

	return (
		<div className="max-w-md mx-auto p-4">
			
			{/* Adding shop info (operating hours, address, etc.) */}
			<Card className="mt-6 mb-6">
				<CardHeader>
					<CardTitle>{shopName} Information</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-600">
						{shopData[0].shop_name} is located at {shopData[0].shop_address}, {shopData[0].shop_city}, {shopData[0].shop_province}
					</p>
					<p className="text-sm text-gray-600">
						Operating hours: 
						<br />
							Mon-Fri: {shopData[0].operating_hours["Monday-Friday"]}
						<br />
							Sat: {shopData[0].operating_hours["Saturday"]}
					</p>
				</CardContent>
			</Card>

			{/* Contact form */}
			<h1 className="text-2xl font-bold mb-4">Contact {shopName}</h1>
			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<Input
					type="text"
					name="name"
					placeholder="Your Name"
					value={formData.name}
					onChange={handleChange}
					required
				/>
				<Input
					type="tel"
					name="phone"
					placeholder="Your Phone Number"
					value={formData.phone}
					onChange={handleChange}
					required
				/>
				<Input
					type="email"
					name="email"
					placeholder="Your Email"
					value={formData.email}
					onChange={handleChange}
					required
				/>
				<Textarea
					name="message"
					placeholder="Your Message"
					value={formData.message}
					onChange={handleChange}
					required
				/>
				<Button type="submit" variant="default">Send Message</Button>
			</form>
		</div>
	);
}
