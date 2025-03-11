'use client'

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchShop } from "../api/fetchShops";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { createLead } from "@/app/lead-generation/utils/lead";
import { StarIcon, MapPin, Phone, Mail, Clock, Calendar, Car, Wrench, Gauge, Facebook, Twitter, Instagram, Youtube, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MotormindsNavBar from "@/app/components/Motorminds-NavBar";
import { getActiveRewards } from "@/app/loyalty/utils/LoyaltyUtils";

export default function ShopProfile() {
	const router = useRouter();
	const params = useParams<{ shopName: string }>();
	const [shopData, setShopData] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [shopName, setShopName] = useState<string | null>(null);
	const [shopID, setShopID] = useState<string | null>(null);
	const [activeRewards, setActiveRewards] = useState<any[]>([]);
	const [isLoadingRewards, setIsLoadingRewards] = useState<boolean>(true);

	// Initialize form data without shopID
	const [formData, setFormData] = useState({
		name: "",
		phone: "",
		email: "",
		message: "",
		shop_id: "",  // Initialize empty, will be updated in useEffect
	});

	useEffect(() => {
		if (!params?.shopName) {
			router.push('/customer/lead-generation');
			return;
		}

		const [encodedShopName, shopID] = params.shopName.split(/-(.+)/);
		const shopName = decodeURIComponent(encodedShopName);
		setShopName(shopName);
		setShopID(shopID);
		
		// Update form data with shopID when it's available
		setFormData(prev => ({ ...prev, shop_id: shopID }));

		const fetchShopData = async () => {
			try {
				const data = await fetchShop(shopID);
				setShopData(data);
			} catch (error) {
				console.error("Error fetching shop data:", error);
				setError("Failed to load shop data. Please try again later.");
			}
		};

		const fetchRewards = async () => {
			setIsLoadingRewards(true);
			try {
				if (shopID) {
					const rewards = await getActiveRewards(shopID);
					setActiveRewards(rewards || []);
				}
			} catch (error) {
				console.error("Error fetching rewards:", error);
			} finally {
				setIsLoadingRewards(false);
			}
		};

		fetchShopData();
		fetchRewards();
	}, [params, router]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		// Get shopID directly from URL if state is not set yet
		let currentShopID = shopID;
		if (!currentShopID && params?.shopName) {
			const urlParts = params.shopName.split(/-(.+)/);
			if (urlParts.length > 1) {
				currentShopID = urlParts[1];
			}
		}
		
		if (!currentShopID) {
			toast.error("Shop information is missing. Please try again.");
			console.error("Shop ID is missing during form submission");
			return;
		}
		
		// Ensure shopID is included in the submission
		const submissionData = {
			...formData,
			shop_id: currentShopID
		};
		
		console.log("Submitting form with data:", submissionData); // Debug log
		
		try {
			const data = await createLead(submissionData);
			toast.success("Your message has been sent! We'll get back to you soon.");
			// Reset form fields but keep the shop_id
			setFormData({ name: "", phone: "", email: "", message: "", shop_id: currentShopID });
		} catch (error) {
			console.error("Error creating lead:", error);
			toast.error("Failed to send your message. Please try again.");
		}
	};

	const handleFavourite = async () => {
		toast.success(`${shopName} added to favorites!`);
	};

	const handleBackClick = () => {
		router.push('/customer/lead-generation');
	};

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Card className="max-w-md w-full">
					<CardContent className="pt-6">
						<div className="text-center">
							<h2 className="text-xl font-semibold mb-2">Error</h2>
							<p className="text-gray-500">{error}</p>
							<Button 
								className="mt-4" 
								onClick={() => router.push('/customer/lead-generation')}
							>
								Return to Marketplace
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!shopData) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-pulse text-center">
					<div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
					<div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
				</div>
			</div>
		);
	}

	// Mock data for the design
	const services = [
		{ name: "Oil Change", icon: <Car className="h-8 w-8 mb-2" />, description: "Regular maintenance with premium oils" },
		{ name: "Brake Service", icon: <Gauge className="h-8 w-8 mb-2" />, description: "Inspection and replacement of brake components" },
		{ name: "Engine Repair", icon: <Wrench className="h-8 w-8 mb-2" />, description: "Diagnostics and repair for all engine types" },
		{ name: "Tire Service", icon: <Wrench className="h-8 w-8 mb-2" />, description: "Rotation, balancing, and replacement" }
	];

	const reviews = [
		{ 
			name: "John D.", 
			rating: 5, 
			date: "October 15, 2023", 
			comment: "Excellent service! They fixed my car quickly and at a reasonable price.",
			avatar: "https://randomuser.me/api/portraits/men/1.jpg"
		},
		{ 
			name: "Sarah M.", 
			rating: 4, 
			date: "September 22, 2023", 
			comment: "Very professional team. Would recommend to anyone looking for quality auto repair.",
			avatar: "https://randomuser.me/api/portraits/women/2.jpg"
		},
		{ 
			name: "Robert K.", 
			rating: 5, 
			date: "August 5, 2023", 
			comment: "Best mechanics in town! They explained everything clearly and did a great job.",
			avatar: "https://randomuser.me/api/portraits/men/3.jpg"
		}
	];

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Top Navbar */}
			<MotormindsNavBar showBackButton={true} onBackClick={handleBackClick} />

			{/* Shop Banner */}
			<div className="relative bg-gradient-to-r from-blue-600 to-blue-800 h-64 md:h-80">
				<div className="absolute inset-0 bg-black opacity-50"></div>
				<div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
					<div className="max-w-4xl">
						<div className="flex flex-row items-center">
							<Button 
								variant="outline"
								size="icon" 
								className="mr-5 mb-4 text-white hover:bg-white/10"
								onClick={() => router.push('/customer/lead-generation')}
							>
								<ArrowLeft className="h-5 w-5" />
							</Button>
							<h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{shopName}</h1>
						</div>
						<p className="text-white text-lg md:text-xl mb-6 max-w-2xl">
							Professional automotive services with a commitment to quality and customer satisfaction
						</p>
						<div className="flex flex-wrap gap-3">
							<Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
								Book Appointment
							</Button>
							<Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" onClick={handleFavourite}>
								<StarIcon className="mr-2 h-4 w-4" /> Favorite
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-12">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column - Shop Info */}
					<div className="lg:col-span-2 space-y-8">
						{/* Quick Info */}
						<Card>
							<CardContent className="p-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="flex items-start">
										<MapPin className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
										<div>
											<h3 className="font-medium">Location</h3>
											<p className="text-gray-600">{shopData?.shop_address}, {shopData?.shop_city}, {shopData?.shop_province}</p>
										</div>
									</div>
									<div className="flex items-start">
										<Phone className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
										<div>
											<h3 className="font-medium">Phone</h3>
											<p className="text-gray-600">{shopData?.shop_phone}</p>
										</div>
									</div>
									<div className="flex items-start">
										<Clock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
										<div>
											<h3 className="font-medium">Hours</h3>
											<p className="text-gray-600">Mon-Fri: {shopData?.operating_hours["Monday-Friday"]}</p>
											<p className="text-gray-600">Sat: {shopData?.operating_hours["Saturday"]}</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Tabs for Services and Reviews */}
						<Tabs defaultValue="about" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="about">About</TabsTrigger>
								<TabsTrigger value="services">Services</TabsTrigger>
								<TabsTrigger value="reviews">Reviews</TabsTrigger>
							</TabsList>
							
							<TabsContent value="about" className="mt-6">
								<Card>
									<CardHeader>
										<CardTitle>About {shopName}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600 mb-4">
											{shopData?.shop_name} is a premier automotive service center dedicated to providing exceptional 
											car care and customer service. With years of experience and a team of certified technicians, 
											we deliver reliable and professional automotive solutions.
										</p>
										<p className="text-gray-600 mb-6">
											Our state-of-the-art facility is equipped with the latest diagnostic tools and equipment to 
											handle all your vehicle maintenance and repair needs. We pride ourselves on transparency, 
											quality workmanship, and building long-lasting relationships with our customers.
										</p>
										
										{/* Active Rewards Section */}
										<div className="mt-8">
											<h3 className="text-lg font-semibold mb-3">Active Rewards</h3>
											{isLoadingRewards ? (
												<div className="flex justify-center py-4">
													<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
												</div>
											) : activeRewards.length > 0 ? (
												<div className="space-y-3">
													{activeRewards.map((reward, index) => (
														<div key={reward.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
															<div className="flex items-start">
																<div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full mr-3">
																	<StarIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
																</div>
																<div className="flex-1">
																	<div className="flex justify-between items-start">
																		<h4 className="font-medium text-blue-800 dark:text-blue-300">{reward.name}</h4>
																		<Badge variant="outline" className="ml-2 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
																			{reward.points_required} points
																		</Badge>
																	</div>
																	<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reward.description}</p>
																</div>
															</div>
														</div>
													))}
												</div>
											) : (
												<div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
													<p className="text-gray-500 dark:text-gray-400">This shop does not have any active rewards.</p>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							</TabsContent>
							
							<TabsContent value="services" className="mt-6">
								<Card>
									<CardHeader>
										<CardTitle>Our Services</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											{services.map((service, index) => (
												<div key={index} className="flex flex-col items-center text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
													{service.icon}
													<h3 className="font-semibold text-lg mb-2">{service.name}</h3>
													<p className="text-gray-600">{service.description}</p>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</TabsContent>
							
							<TabsContent value="reviews" className="mt-6">
								<Card>
									<CardHeader>
										<CardTitle>Customer Reviews</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-6">
											{reviews.map((review, index) => (
												<div key={index} className="border-b pb-6 last:border-0">
													<div className="flex items-center mb-3">
														<Avatar className="h-10 w-10 mr-3">
															<AvatarImage src={review.avatar} alt={review.name} />
															<AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
														</Avatar>
														<div>
															<div className="font-medium">{review.name}</div>
															<div className="text-sm text-gray-500">{review.date}</div>
														</div>
														<div className="ml-auto flex">
															{[...Array(5)].map((_, i) => (
																<StarIcon 
																	key={i} 
																	className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
																/>
															))}
														</div>
													</div>
													<p className="text-gray-600">{review.comment}</p>
												</div>
											))}
										</div>
									</CardContent>
									<CardFooter>
										<Button variant="outline" className="w-full">See All Reviews</Button>
									</CardFooter>
								</Card>
							</TabsContent>
						</Tabs>
					</div>

					{/* Right Column - Contact Form */}
					<div>
						<Card className="sticky top-6">
							<CardHeader>
								<CardTitle>Get in Touch</CardTitle>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit} className="space-y-4">
									<div>
										<label htmlFor="name" className="block text-sm font-medium mb-1">Your Name</label>
										<Input
											id="name"
											type="text"
											name="name"
											placeholder="John Doe"
											value={formData.name}
											onChange={handleChange}
											required
										/>
									</div>
									<div>
										<label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
										<Input
											id="phone"
											type="tel"
											name="phone"
											placeholder="(123) 456-7890"
											value={formData.phone}
											onChange={handleChange}
											required
										/>
									</div>
									<div>
										<label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
										<Input
											id="email"
											type="email"
											name="email"
											placeholder="you@example.com"
											value={formData.email}
											onChange={handleChange}
											required
										/>
									</div>
									<div>
										<label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
										<Textarea
											id="message"
											name="message"
											placeholder="How can we help you?"
											value={formData.message}
											onChange={handleChange}
											rows={4}
											required
										/>
									</div>
									<Button type="submit" className="w-full">Send Message</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className="bg-gray-800 text-white pt-12 pb-8 mt-12">
				<div className="container mx-auto px-4">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div>
							<h3 className="text-lg font-semibold mb-4">{shopName}</h3>
							<p className="text-gray-300 mb-4">Professional automotive services with a commitment to quality and customer satisfaction.</p>
							<div className="flex space-x-4">
								<a href="#" className="text-gray-300 hover:text-white">
									<Facebook className="h-5 w-5" />
								</a>
								<a href="#" className="text-gray-300 hover:text-white">
									<Twitter className="h-5 w-5" />
								</a>
								<a href="#" className="text-gray-300 hover:text-white">
									<Instagram className="h-5 w-5" />
								</a>
								<a href="#" className="text-gray-300 hover:text-white">
									<Youtube className="h-5 w-5" />
								</a>
							</div>
						</div>
						
						<div>
							<h3 className="text-lg font-semibold mb-4">Services</h3>
							<ul className="space-y-2">
								{services.map((service, index) => (
									<li key={index}>
										<a href="#" className="text-gray-300 hover:text-white">{service.name}</a>
									</li>
								))}
								<li><a href="#" className="text-gray-300 hover:text-white">View All Services</a></li>
							</ul>
						</div>
						
						<div>
							<h3 className="text-lg font-semibold mb-4">Quick Links</h3>
							<ul className="space-y-2">
								<li><a href="#" className="text-gray-300 hover:text-white">About Us</a></li>
								<li><a href="#" className="text-gray-300 hover:text-white">Services</a></li>
								<li><a href="#" className="text-gray-300 hover:text-white">Reviews</a></li>
								<li><a href="#" className="text-gray-300 hover:text-white">Contact</a></li>
								<li><a href="#" className="text-gray-300 hover:text-white">Book Appointment</a></li>
							</ul>
						</div>
						
						<div>
							<h3 className="text-lg font-semibold mb-4">Contact Info</h3>
							<ul className="space-y-3">
								<li className="flex items-start">
									<MapPin className="h-5 w-5 mr-2 mt-0.5 text-gray-400" />
									<span>{shopData?.shop_address}, {shopData?.shop_city}, {shopData?.shop_province}</span>
								</li>
								<li className="flex items-center">
									<Phone className="h-5 w-5 mr-2 text-gray-400" />
									<span>{shopData?.shop_phone}</span>
								</li>
								<li className="flex items-center">
									<Mail className="h-5 w-5 mr-2 text-gray-400" />
									<span>info@{shopData?.shop_name.toLowerCase().replace(/\s/g, '')}.com</span>
								</li>
								<li className="flex items-center">
									<Clock className="h-5 w-5 mr-2 text-gray-400" />
									<span>Mon-Fri: {shopData?.operating_hours["Monday-Friday"]}</span>
								</li>
							</ul>
						</div>
					</div>
					
					<Separator className="my-8 bg-gray-700" />
					
					<div className="text-center text-gray-400 text-sm">
						<p>&copy; {new Date().getFullYear()} {shopName}. All rights reserved by MotorMinds.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
