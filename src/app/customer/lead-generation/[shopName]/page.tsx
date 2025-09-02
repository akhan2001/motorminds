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
import { StarIcon, MapPin, Phone, Mail, Clock, Calendar, Car, Wrench, Gauge, Facebook, Twitter, Instagram, Youtube, ArrowLeft, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MotormindsNavBar from "@/app/components/Motorminds-NavBar";
import { getActiveRewards } from "@/app/loyalty/utils/LoyaltyUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RewardsCard } from "@/app/customer/lead-generation/components/rewards-card";
import { formatOperatingHours } from "@/app/customer/lead-generation/components/formatOperatingHours";
import Script from "next/script";

export default function ShopProfile() {
	const router = useRouter();
	const params = useParams<{ shopName: string }>();
	const [shopData, setShopData] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [shopName, setShopName] = useState<string | null>(null);
	const [shopID, setShopID] = useState<string | null>(null);
	const [activeRewards, setActiveRewards] = useState<any[]>([]);
	const [isLoadingRewards, setIsLoadingRewards] = useState<boolean>(true);
	const [claimedReward, setClaimedReward] = useState<any | null>(null);

	const formattedHours = formatOperatingHours(shopData?.operating_hours);

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

		// Widget test functions
		const showResult = (elementId: string, message: string, isError: boolean = false) => {
			const element = document.getElementById(elementId);
			if (element) {
				element.textContent = message;
				element.className = isError ? 'mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs font-mono text-red-700 dark:text-red-300' : 'mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs font-mono text-green-700 dark:text-green-300';
			}
		};

		const testWidgetConfig = async () => {
			try {
				showResult('config-result', 'Testing widget configuration...');
				
				const response = await fetch(`/api/widget/config/${shopID}`);
				const data = await response.json();
				
				if (response.ok) {
					showResult('config-result', `✅ Widget config loaded successfully!\n\nShop: ${data.headerText}\nPrimary Color: ${data.primaryColor}\nWelcome Message: ${data.welcomeMessage}\nPosition: ${data.position}`);
				} else {
					showResult('config-result', `❌ Widget config failed: ${data.error}`, true);
				}
			} catch (error) {
				showResult('config-result', `❌ Widget config error: ${(error as Error).message}`, true);
			}
		};

		const testWidgetChat = async () => {
			try {
				showResult('chat-result', 'Testing widget chat...');
				
				const response = await fetch('/api/widget/chat', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						messages: [
							{ role: 'user', content: 'Hello, I need an oil change' }
						],
						conversation_id: null,
						shopId: shopID,
						isBookingMode: false
					})
				});
				
				if (response.ok) {
					showResult('chat-result', '✅ Widget chat is working!\n\nResponse status: ' + response.status);
				} else {
					const errorData = await response.text();
					showResult('chat-result', `❌ Widget chat failed: ${response.status} ${response.statusText}\n\nError: ${errorData}`, true);
				}
			} catch (error) {
				showResult('chat-result', `❌ Widget chat error: ${(error as Error).message}`, true);
			}
		};

		const testWidgetAvailability = async () => {
			try {
				showResult('availability-result', 'Testing widget availability...');
				
				const today = new Date().toISOString().split('T')[0];
				const response = await fetch(`/api/widget/availability/${shopID}?date=${today}`);
				const data = await response.json();
				
				if (response.ok) {
					showResult('availability-result', `✅ Widget availability is working!\n\nDate: ${data.date}\nAvailable slots: ${data.availableSlots?.length || 0}`);
				} else {
					showResult('availability-result', `❌ Widget availability failed: ${data.error}`, true);
				}
			} catch (error) {
				showResult('availability-result', `❌ Widget availability error: ${(error as Error).message}`, true);
			}
		};
		
		if (!currentShopID) {
			toast.error("Shop information is missing. Please try again.");
			console.error("Shop ID is missing during form submission");
			return;
		}
		
		// Ensure shopID is included in the submission
		const submissionData: any = {
			...formData,
			shop_id: currentShopID
		};
		
		// Add reward information if a reward is claimed
		if (claimedReward) {
			submissionData.reward_id = claimedReward.id;
			submissionData.reward_name = claimedReward.name;
		}
		
		console.log("Submitting form with data:", submissionData); // Debug log
		
		try {
			const data = await createLead(submissionData);
			
			// Show appropriate success message based on whether a reward was claimed
			if (claimedReward) {
				toast.success(`Your message has been sent and "${claimedReward.name}" reward has been claimed!`);
			} else {
				toast.success("Your message has been sent! We'll get back to you soon.");
			}
			
			// Reset form fields but keep the shop_id
			setFormData({ name: "", phone: "", email: "", message: "", shop_id: currentShopID });
			// Reset claimed reward
			setClaimedReward(null);
		} catch (error) {
			console.error("Error creating lead:", error);
			toast.error("Failed to send your message. Please try again.");
		}
	};



	// Widget test functions
	const showResult = (elementId: string, message: string, isError: boolean = false) => {
		const element = document.getElementById(elementId);
		if (element) {
			element.textContent = message;
			element.className = isError ? 'mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs font-mono text-red-700 dark:text-red-300' : 'mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs font-mono text-green-700 dark:text-green-300';
		}
	};

	const testWidgetConfig = async () => {
		try {
			showResult('config-result', 'Testing widget configuration...');
			
			const response = await fetch(`/api/widget/config/${shopID}`);
			const data = await response.json();
			
			if (response.ok) {
				showResult('config-result', `✅ Widget config loaded successfully!\n\nShop: ${data.headerText}\nPrimary Color: ${data.primaryColor}\nWelcome Message: ${data.welcomeMessage}\nPosition: ${data.position}`);
			} else {
				showResult('config-result', `❌ Widget config failed: ${data.error}`, true);
			}
		} catch (error) {
			showResult('config-result', `❌ Widget config error: ${(error as Error).message}`, true);
		}
	};

	const testWidgetChat = async () => {
		try {
			showResult('chat-result', 'Testing widget chat...');
			
			const response = await fetch('/api/widget/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages: [
						{ role: 'user', content: 'Hello, I need an oil change' }
					],
					conversation_id: null,
					shopId: shopID,
					isBookingMode: false
				})
			});
			
			if (response.ok) {
				showResult('chat-result', '✅ Widget chat is working!\n\nResponse status: ' + response.status);
			} else {
				const errorData = await response.text();
				showResult('chat-result', `❌ Widget chat failed: ${response.status} ${response.statusText}\n\nError: ${errorData}`, true);
			}
		} catch (error) {
			showResult('chat-result', `❌ Widget chat error: ${(error as Error).message}`, true);
		}
	};

	const testWidgetAvailability = async () => {
		try {
			showResult('availability-result', 'Testing widget availability...');
			
			const today = new Date().toISOString().split('T')[0];
			const response = await fetch(`/api/widget/availability/${shopID}?date=${today}`);
			const data = await response.json();
			
			if (response.ok) {
				showResult('availability-result', `✅ Widget availability is working!\n\nDate: ${data.date}\nAvailable slots: ${data.availableSlots?.length || 0}`);
			} else {
				showResult('availability-result', `❌ Widget availability failed: ${data.error}`, true);
			}
		} catch (error) {
			showResult('availability-result', `❌ Widget availability error: ${(error as Error).message}`, true);
		}
	};

	const handleFavourite = async () => {
		toast.success(`${shopName} added to favorites!`);
	};

	const handleBackClick = () => {
		router.push('/customer/lead-generation');
	};

	const handleClaimReward = (reward: any) => {
		// If clicking the same reward, deselect it
		if (claimedReward?.id === reward.id) {
			setClaimedReward(null);
			setFormData(prev => ({
				...prev,
				message: ""
			}));
			return;
		}
		
		// If a different reward is already claimed, show error
		// if (claimedReward) {
		// 	toast.error("You've already claimed a reward. Please deselect it first.");
		// 	return;
		// }
		
		setClaimedReward(reward);
		// toast.success(`You've claimed the "${reward.name}" reward!`);
		
		setFormData(prev => ({
			...prev,
			message: `I'd like to claim the "${reward.name}" reward.`
		}));
		
		document.querySelector('.contact-form')?.scrollIntoView({ 
			behavior: 'smooth',
			block: 'center'
		});
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
			date: "March 5, 2025",
			comment: "Excellent service! They fixed my car quickly and at a reasonable price.",
		},
		{ 
			name: "Sarah M.", 
			rating: 5,
			date: "September 22, 2024", 
			comment: "Very professional team. Would recommend to anyone looking for quality auto repair.",
		},
		{ 
			name: "Robert K.", 
			rating: 5, 
			date: "October 15, 2024",
			comment: "Best mechanics in town! They explained everything clearly and did a great job.",
		}
	];

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Top Navbar
			<MotormindsNavBar showBackButton={true} onBackClick={handleBackClick} /> */}

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
							{shopData?.shop_tagline}
						</p>
						<div className="flex flex-wrap gap-3">
							{/* <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
								Book Appointment
							</Button> */}
							<Button size="lg" variant="outline" className="bg-white text-blue-700 hover:bg-gray-100" onClick={handleFavourite}>
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
											{shopData?.operating_hours ? (
												Object.entries(formatOperatingHours(shopData.operating_hours)).map(([days, hours]) => (
													<p key={days} className="text-gray-600">
														{days}: {hours}
													</p>
												))
											) : (
												<p className="text-gray-600">Hours not available</p>
											)}
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
											{shopData?.shop_about}
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
													{activeRewards.map((reward) => (
														<RewardsCard
															key={reward.id}
															reward={reward}
															isSelected={claimedReward?.id === reward.id}
															isOtherSelected={claimedReward !== null && claimedReward.id !== reward.id}
															onSelect={handleClaimReward}
														/>
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
															{/* <AvatarImage src={review.avatar} alt={review.name} /> */}
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
						<Card className="sticky top-6 contact-form">
							<CardHeader>
								<CardTitle>Get in Touch</CardTitle>
							</CardHeader>
							<CardContent>
								{claimedReward && (
									<Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
										<div className="flex justify-between items-start">
											<div className="flex items-start">
												<AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 mr-2" />
												<div>
													<AlertTitle className="text-green-800 dark:text-green-400">Reward Selected!</AlertTitle>
													<AlertDescription className="text-green-700 dark:text-green-300">
														You've selected the "{claimedReward.name}" reward. 
														Please complete the form below to redeem it.
													</AlertDescription>
												</div>
											</div>
											<Button 
												variant="ghost" 
												size="sm" 
												className="h-6 text-gray-500 hover:text-gray-700 -mt-1 -mr-2"
												onClick={() => setClaimedReward(null)}
											>
												×
											</Button>
										</div>
									</Alert>
								)}
								
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
									<Button type="submit" className="w-full">
										Send
									</Button>
								</form>
							</CardContent>
						</Card>

						{/* Widget Test Section */}
						<Card className="mt-6">
							<CardHeader>
								<CardTitle>🧪 Widget Test</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<h3 className="text-sm font-medium mb-2">Test Widget Configuration</h3>
										<Button 
											variant="outline" 
											size="sm" 
											onClick={() => testWidgetConfig()}
											className="w-full"
										>
											Test Widget Config
										</Button>
										<div id="config-result" className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono"></div>
									</div>

									<div>
										<h3 className="text-sm font-medium mb-2">Test Widget Chat</h3>
										<Button 
											variant="outline" 
											size="sm" 
											onClick={() => testWidgetChat()}
											className="w-full"
										>
											Test Widget Chat
										</Button>
										<div id="chat-result" className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono"></div>
									</div>

									<div>
										<h3 className="text-sm font-medium mb-2">Test Widget Availability</h3>
										<Button 
											variant="outline" 
											size="sm" 
											onClick={() => testWidgetAvailability()}
											className="w-full"
										>
											Test Widget Availability
										</Button>
										<div id="availability-result" className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono"></div>
									</div>
								</div>
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
							<p className="text-gray-300 mb-4">{shopData?.shop_tagline}</p>
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
									<span>{shopData?.shop_email}</span>
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

			{/* MotorMinds Widget Script */}
			<Script
				id="motorminds-widget-script"
				src="/widget/embed.js"
				data-shop-id={shopID}
				strategy="afterInteractive"
			/>
		</div>
	);
}
