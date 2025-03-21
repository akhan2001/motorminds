"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { toast } from "sonner";
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getShopInfo, updateShopInfo } from "@/utils/shopinfo/getShopInfo"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Clock, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const shopFormSchema = z.object({
	shop_name: z
		.string()
		.min(2, {
		message: "Shop name must be at least 2 characters.",
		})
		.max(50, {
		message: "Shop name must not be longer than 50 characters.",
		}),
	shop_email: z
		.string({
		required_error: "Please enter a valid email.",
		})
		.email(),
	shop_phone: z.string().min(10, {
		message: "Phone number must be at least 10 digits.",
	}),
	shop_address: z.string().min(5, {
		message: "Address must be at least 5 characters.",
	}),
	shop_city: z.string().min(2, {
		message: "City must be at least 2 characters.",
	}),
	shop_province: z.string().min(2, {
		message: "Province/State must be at least 2 characters.",
	}),
	shop_owner: z.string().min(2, {
		message: "Owner name must be at least 2 characters.",
	}),
	shop_about: z.string().max(500).min(10, {
		message: "About section must be at least 10 characters.",
	}),
	shop_tagline: z.string().max(100).min(5, {
		message: "Tagline must be at least 5 characters.",
	}),
	operating_hours: z.string().min(5, {
		message: "Operating hours must be at least 5 characters.",
	}),
	services_offered: z.string().min(5, {
		message: "Services offered must be at least 5 characters.",
	}),
	website: z.string().url().optional().or(z.literal("")),
	logo_image_url: z.string().url().optional().or(z.literal("")),
	banner_image_url: z.string().url().optional().or(z.literal("")),
	facebook_url: z.string().url().optional().or(z.literal("")),
	twitter_url: z.string().url().optional().or(z.literal("")),
	instagram_url: z.string().url().optional().or(z.literal("")),
	youtube_url: z.string().url().optional().or(z.literal("")),
})

type ShopFormValues = z.infer<typeof shopFormSchema>

// Add this function to parse services from string to array
function parseServices(servicesString: string): string[] {
	try {
		return JSON.parse(servicesString);
	} catch (e) {
		return [];
	}
}

// Add this function to stringify services from array to string
function stringifyServices(servicesArray: string[]): string {
	try {
		return JSON.stringify(servicesArray);
	} catch (e) {
		return "[]";
	}
}

// Update the operating hours structure
type DaySchedule = {
	closed: boolean;
	openTime: string;
	closeTime: string;
}

type WeekSchedule = {
	Monday: DaySchedule;
	Tuesday: DaySchedule;
	Wednesday: DaySchedule;
	Thursday: DaySchedule;
	Friday: DaySchedule;
	Saturday: DaySchedule;
	Sunday: DaySchedule;
}

// Update parse function for operating hours
function parseOperatingHours(hoursString: string): WeekSchedule {
	try {
		const parsed = JSON.parse(hoursString);
		const defaultSchedule = {
			closed: false,
			openTime: "9:00",
			closeTime: "17:00"
		};
		
		return {
			Monday: { ...defaultSchedule, ...(parsed.Monday || {}) },
			Tuesday: { ...defaultSchedule, ...(parsed.Tuesday || {}) },
			Wednesday: { ...defaultSchedule, ...(parsed.Wednesday || {}) },
			Thursday: { ...defaultSchedule, ...(parsed.Thursday || {}) },
			Friday: { ...defaultSchedule, ...(parsed.Friday || {}) },
			Saturday: { ...defaultSchedule, closed: true, ...(parsed.Saturday || {}) },
			Sunday: { ...defaultSchedule, closed: true, ...(parsed.Sunday || {}) }
		};
	} catch (e) {
		// Return default structure if parsing fails
		return {
			Monday: { closed: false, openTime: "9:00", closeTime: "17:00" },
			Tuesday: { closed: false, openTime: "9:00", closeTime: "17:00" },
			Wednesday: { closed: false, openTime: "9:00", closeTime: "17:00" },
			Thursday: { closed: false, openTime: "9:00", closeTime: "17:00" },
			Friday: { closed: false, openTime: "9:00", closeTime: "17:00" },
			Saturday: { closed: true, openTime: "10:00", closeTime: "16:00" },
			Sunday: { closed: true, openTime: "10:00", closeTime: "16:00" }
		};
	}
}

// Update stringify function for operating hours
function stringifyOperatingHours(schedule: WeekSchedule): string {
	try {
		return JSON.stringify(schedule);
	} catch (e) {
		return "{}";
	}
}

// Generate time options for dropdowns
const timeOptions = () => {
	const options = [];
	for (let hour = 0; hour < 24; hour++) {
		const hourStr = hour.toString().padStart(2, '0');
		options.push(`${hourStr}:00`);
		options.push(`${hourStr}:30`);
	}
	return options;
};

export function ProfileForm({ shopId }: { shopId: string }) {
	const [shopInfo, setShopInfo] = useState<ShopFormValues | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const router = useRouter()
	const [isSaving, setIsSaving] = useState(false);
	const supabase = createClientComponentClient();
	
	// Update operating hours state
	const [operatingHours, setOperatingHours] = useState<WeekSchedule>({
		Monday: { closed: false, openTime: "9:00", closeTime: "17:00" },
		Tuesday: { closed: false, openTime: "9:00", closeTime: "17:00" },
		Wednesday: { closed: false, openTime: "9:00", closeTime: "17:00" },
		Thursday: { closed: false, openTime: "9:00", closeTime: "17:00" },
		Friday: { closed: false, openTime: "9:00", closeTime: "17:00" },
		Saturday: { closed: true, openTime: "10:00", closeTime: "16:00" },
		Sunday: { closed: true, openTime: "10:00", closeTime: "16:00" }
	});
	
	// Add state for services
	const [services, setServices] = useState<string[]>([]);
	const [newService, setNewService] = useState("");

	// Add timeOptions state
	const [times] = useState<string[]>(timeOptions());

	// Create form with empty initial values
	const form = useForm<ShopFormValues>({
		resolver: zodResolver(shopFormSchema),
		defaultValues: {
			shop_name: "",
			shop_email: "",
			shop_phone: "",
			shop_address: "",
			shop_city: "",
			shop_province: "",
			shop_owner: "",
			shop_about: "",
			shop_tagline: "",
			operating_hours: "",
			services_offered: "",
			website: "",
			logo_image_url: "",
			banner_image_url: "",
			facebook_url: "",
			twitter_url: "",
			instagram_url: "",
			youtube_url: "",
		},
		mode: "onChange",
	})

	// Fetch shop info and update form values when data is available
	useEffect(() => {
		async function fetchShopInfo() {
			setIsLoading(true)
			try {
				const shopData = await getShopInfo(shopId)
				if (shopData && shopData.length > 0) {
					const shop = shopData[0]
					setShopInfo(shop)
					
					// Parse operating hours if available
					if (shop.operating_hours) {
						const parsedHours = parseOperatingHours(shop.operating_hours);
						setOperatingHours(parsedHours);
					}
					
					// Parse services if available
					if (shop.services_offered) {
						const parsedServices = parseServices(shop.services_offered);
						setServices(parsedServices);
					}
					
					// Reset form with shop data
					form.reset({
						shop_name: shop.shop_name || "",
						shop_email: shop.shop_email || "",
						shop_phone: shop.shop_phone || "",
						shop_address: shop.shop_address || "",
						shop_city: shop.shop_city || "",
						shop_province: shop.shop_province || "",
						shop_owner: shop.shop_owner || "",
						shop_about: shop.shop_about || "",
						shop_tagline: shop.shop_tagline || "",
						operating_hours: shop.operating_hours || "",
						services_offered: shop.services_offered || "",
						website: shop.website || "",
						logo_image_url: shop.logo_image_url || "",
						banner_image_url: shop.banner_image_url || "",
						facebook_url: shop.facebook_url || "",
						twitter_url: shop.twitter_url || "",
						instagram_url: shop.instagram_url || "",
						youtube_url: shop.youtube_url || "",
					})
				}
			} catch (error) {
				console.error("Error fetching shop info:", error)
				toast.error("Failed to load shop information")
			} finally {
				setIsLoading(false)
			}
		}

		if (shopId) {
			fetchShopInfo()
		}
	}, [shopId, form])

	// Update the form value when operating hours change
	useEffect(() => {
		form.setValue('operating_hours', stringifyOperatingHours(operatingHours));
	}, [operatingHours, form]);
	
	// Update the form value when services change
	useEffect(() => {
		form.setValue('services_offered', stringifyServices(services));
	}, [services, form]);

	async function onSubmit(data: ShopFormValues) {
		await updateShopProfile(data);
	}

	async function updateShopProfile(data: ShopFormValues) {
		if (!shopId) return;

		console.log(data)
		
		setIsSaving(true);
		try {
			// Make sure operating hours and services are properly formatted as JSONB
			const formattedData = {
				...data,
				operating_hours: stringifyOperatingHours(operatingHours),
				services_offered: stringifyServices(services)
			};
			
			const result = await updateShopInfo(shopId, formattedData);
			
			if (!result.success) {
				throw new Error("Failed to update shop information");
			}
			
			toast.success("Shop information updated successfully", {
				description: "Your shop profile has been updated with the new information.",
			});
			
			// Refresh the page to show updated data
			router.refresh();
		} catch (error) {
			console.error("Error updating shop info:", error);
			toast.error("Failed to update shop information", {
				description: "Please try again later.",
			});
		} finally {
			setIsSaving(false);
		}
	}

	// Add a function to handle adding a new service
	const handleAddService = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && newService.trim()) {
			e.preventDefault();
			if (!services.includes(newService.trim())) {
				setServices(prev => [...prev, newService.trim()]);
			}
			setNewService("");
		}
	};
	
	// Add a function to remove a service
	const removeService = (service: string) => {
		setServices(prev => prev.filter(s => s !== service));
	};

	// Add a function to update a specific day's schedule
	const updateDaySchedule = (day: keyof WeekSchedule, field: keyof DaySchedule, value: any) => {
		setOperatingHours(prev => ({
			...prev,
			[day]: {
				...prev[day],
				[field]: value
			}
		}));
	};

	return (
		<main className="flex flex-col items-center justify-center py-8">
			<div className="container mx-auto max-w-[1300px]">
				<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<Tabs defaultValue="basic" className="w-full ">
						<TabsList className="grid grid-cols-5 mb-8 bg-[#222] border-none text-white">
							<TabsTrigger 
								value="basic" 
								className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
							>
								Basic Info
							</TabsTrigger>
							<TabsTrigger 
								value="location" 
								className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
							>
								Location
							</TabsTrigger>
							<TabsTrigger 
								value="details" 
								className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
							>
								Shop Details
							</TabsTrigger>
							<TabsTrigger 
								value="images" 
								className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
							>
								Images
							</TabsTrigger>
							<TabsTrigger 
								value="social" 
								className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
							>
								Social Media
							</TabsTrigger>
						</TabsList>
						
						{/* Basic Information Tab */}
						<TabsContent value="basic" className="space-y-6">
							<h3 className="text-xl font-medium">Basic Information</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormField
								control={form.control}
								name="shop_name"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Shop Name</FormLabel>
									<FormControl>
									<Input placeholder="MotorMinds Auto Shop" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormDescription>
										This is your shop's display name.
									</FormDescription>
									<FormMessage />
								</FormItem>
								)}
							/>
							
							<FormField
								control={form.control}
								name="shop_email"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
									<Input placeholder="contact@motorminds.com" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormDescription>
										Your shop's primary contact email.
									</FormDescription>
									<FormMessage />
								</FormItem>
								)}
							/>
							
							<FormField
								control={form.control}
								name="shop_phone"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Phone</FormLabel>
									<FormControl>
									<Input placeholder="555-123-4567" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormDescription>
										Your shop's primary contact phone number.
									</FormDescription>
									<FormMessage />
								</FormItem>
								)}
							/>
							
							<FormField
								control={form.control}
								name="shop_owner"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Owner Name</FormLabel>
									<FormControl>
									<Input placeholder="John Smith" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormDescription>
										The name of the shop owner.
									</FormDescription>
									<FormMessage />
								</FormItem>
								)}
							/>
							</div>
						</TabsContent>
						
						{/* Location Tab */}
						<TabsContent value="location" className="space-y-6">
							<h3 className="text-xl font-medium">Location</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormField
								control={form.control}
								name="shop_address"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Address</FormLabel>
									<FormControl>
									<Input placeholder="123 Main Street" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
								)}
							/>
							
							<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="shop_city"
								render={({ field }) => (
								<FormItem>
									<FormLabel>City</FormLabel>
									<FormControl>
									<Input placeholder="Anytown" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
								)}
							/>
							
							<FormField
								control={form.control}
								name="shop_province"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Province/State</FormLabel>
									<FormControl>
									<Input placeholder="CA" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
								)}
							/>
							</div>
							
							<FormField
								control={form.control}
								name="website"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Website</FormLabel>
									<FormControl>
									<Input placeholder="https://motorminds.ca" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormDescription>
										Your shop's website URL.
									</FormDescription>
									<FormMessage />
								</FormItem>
								)}
							/>
							</div>
						</TabsContent>
						
						{/* Shop Details Tab */}
						<TabsContent value="details" className="space-y-6">
							<h3 className="text-xl font-medium">Shop Details</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-6">
								<FormField
								control={form.control}
								name="shop_tagline"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Tagline</FormLabel>
									<FormControl>
									<Input placeholder="Quality Service You Can Trust" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormDescription>
										A short slogan or tagline for your shop.
									</FormDescription>
									<FormMessage />
								</FormItem>
								)}
								/>
								
								<FormField
									control={form.control}
									name="operating_hours"
									render={({ field }) => (
										<FormItem className="col-span-2">
											<FormLabel>Operating Hours</FormLabel>
											<FormDescription>
												Set your shop's operating hours for each day of the week.
											</FormDescription>
											
											<div className="space-y-4 mt-2">
												{(Object.keys(operatingHours) as Array<keyof WeekSchedule>).map((day) => (
													<div key={day} className="grid grid-cols-12 gap-3 items-center">
														<div className="col-span-3">
															<div className="flex items-center space-x-2">
																<Checkbox 
																	id={`${day}-closed`}
																	checked={operatingHours[day].closed}
																	onCheckedChange={(checked) => 
																		updateDaySchedule(day, 'closed', checked === true)
																	}
																	className="bg-[#292929] border-[#626262]"
																/>
																<label 
																	htmlFor={`${day}-closed`}
																	className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
																>
																	{day}
																</label>
															</div>
														</div>
														
														{!operatingHours[day].closed ? (
															<>
																<div className="col-span-4">
																	<div className="flex items-center">
																		<span className="text-xs mr-2">Opens at</span>
																		<Select
																			value={operatingHours[day].openTime}
																			onValueChange={(value) => updateDaySchedule(day, 'openTime', value)}
																		>
																			<SelectTrigger className="bg-[#292929] border-[#626262] text-white">
																				<SelectValue placeholder="Select time" />
																			</SelectTrigger>
																			<SelectContent className="bg-[#292929] border-[#626262] text-white max-h-[300px]">
																				{times.map((time) => (
																					<SelectItem key={`${day}-open-${time}`} value={time}>
																						{time}
																					</SelectItem>
																				))}
																			</SelectContent>
																		</Select>
																	</div>
																</div>
																<div className="col-span-4">
																	<div className="flex items-center">
																		<span className="text-xs mr-2">Closes at</span>
																		<Select
																			value={operatingHours[day].closeTime}
																			onValueChange={(value) => updateDaySchedule(day, 'closeTime', value)}
																		>
																			<SelectTrigger className="bg-[#292929] border-[#626262] text-white">
																				<SelectValue placeholder="Select time" />
																			</SelectTrigger>
																			<SelectContent className="bg-[#292929] border-[#626262] text-white max-h-[300px]">
																				{times.map((time) => (
																					<SelectItem key={`${day}-close-${time}`} value={time}>
																						{time}
																					</SelectItem>
																				))}
																			</SelectContent>
																		</Select>
																	</div>
																</div>
															</>
														) : (
															<div className="col-span-8 text-gray-500 italic">
																Closed
															</div>
														)}
													</div>
												))}
											</div>
											
											<FormMessage />
										</FormItem>
									)}
								/>
								
								<FormField
								control={form.control}
								name="services_offered"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Services Offered</FormLabel>
									<FormDescription>
										List the services your shop offers. Press Enter to add each service.
									</FormDescription>
									
									<div className="space-y-4">
										<div className="flex flex-wrap gap-2 mb-2">
											{services.map((service, index) => (
												<div 
													key={index} 
													className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#333] text-white"
												>
													<span>{service}</span>
													<button 
														type="button"
														onClick={() => removeService(service)}
														className="text-gray-400 hover:text-white ml-1"
													>
														×
													</button>
												</div>
											))}
										</div>
										
										<FormControl>
											<Input 
												placeholder="Type a service and press Enter (e.g., Oil Changes, Brake Repair)" 
												className="bg-[#292929] border-[#626262] text-white"
												value={newService}
												onChange={(e) => setNewService(e.target.value)}
												onKeyDown={handleAddService}
											/>
										</FormControl>
									</div>
									
									<FormMessage />
								</FormItem>
								)}
								/>
							</div>
							
							<div className="space-y-6">
								<FormField
								control={form.control}
								name="shop_about"
								render={({ field }) => (
								<FormItem>
									<FormLabel>About Your Shop</FormLabel>
									<FormControl>
									<Textarea 
									placeholder="We provide quality auto repair services with a focus on customer satisfaction." 
									className="resize-none min-h-[250px] bg-[#292929] border-[#626262] text-white"
									{...field} 
									/>
									</FormControl>
									<FormDescription>
										Tell customers about your shop, history, and values.
									</FormDescription>
									<FormMessage />
								</FormItem>
								)}
								/>
							</div>
							</div>
						</TabsContent>
						
						{/* Images Tab */}
						<TabsContent value="images" className="space-y-6">
							<h3 className="text-xl font-medium">Images</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormField
								control={form.control}
								name="logo_image_url"
								render={({ field }) => (
								<FormItem>
								<FormLabel>Logo URL</FormLabel>
								<FormControl>
								<Input placeholder="https://example.com/logo.png" className="bg-[#292929] border-[#626262] text-white" {...field} />
								</FormControl>
								<FormDescription>
									URL to your shop's logo image.
								</FormDescription>
								<FormMessage />
								</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="banner_image_url"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Banner URL</FormLabel>
									<FormControl>
									<Input placeholder="https://example.com/banner.png" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormDescription>
										URL to your shop's banner image.
									</FormDescription>
									<FormMessage />
								</FormItem>
								)}
							/>
							</div>
						</TabsContent>
						
						{/* Social Media Tab */}
						<TabsContent value="social" className="space-y-6">
							<h3 className="text-xl font-medium">Social Media</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormField
								control={form.control}
								name="facebook_url"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Facebook</FormLabel>
									<FormControl>
									<Input placeholder="https://facebook.com/motorminds" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
								)}
							/>
							
							<FormField
								control={form.control}
								name="twitter_url"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Twitter</FormLabel>
									<FormControl>
									<Input placeholder="https://twitter.com/motorminds" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
								)}
							/>
							
							<FormField
								control={form.control}
								name="instagram_url"
								render={({ field }) => (
								<FormItem>
									<FormLabel>Instagram</FormLabel>
									<FormControl>
									<Input placeholder="https://instagram.com/motorminds" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
								)}
							/>
							
							<FormField
								control={form.control}
								name="youtube_url"
								render={({ field }) => (
								<FormItem>
									<FormLabel>YouTube</FormLabel>
									<FormControl>
									<Input placeholder="https://youtube.com/motorminds" className="bg-[#292929] border-[#626262] text-white" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
								)}
							/>
							</div>
						</TabsContent>
					</Tabs>
					
					<Button 
						type="submit" 
						className="mt-6 bg-[#b91c1c] hover:bg-[#991616]" 
						disabled={isSaving}
					>
						{isSaving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							"Update Shop Profile"
						)}
					</Button>
				</form>
				</Form>
			</div>
		</main>
	)
}