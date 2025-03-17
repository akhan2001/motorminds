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

// This can come from your database or API.
const defaultValues: Partial<ShopFormValues> = {
	shop_name: "MotorMinds Auto Shop",
	shop_email: "contact@motorminds.com",
	shop_phone: "555-123-4567",
	shop_address: "123 Main Street",
	shop_city: "Anytown",
	shop_province: "CA",
	shop_owner: "John Smith",
	shop_about: "We provide quality auto repair services with a focus on customer satisfaction.",
	shop_tagline: "Quality Service You Can Trust",
	operating_hours: "Mon-Fri: 8am-6pm, Sat: 9am-3pm, Sun: Closed",
	services_offered: "Oil Changes, Brake Repair, Engine Diagnostics, Tire Services",
	website: "https://motorminds.com",
}

export function ProfileForm() {
	const form = useForm<ShopFormValues>({
		resolver: zodResolver(shopFormSchema),
		defaultValues,
		mode: "onChange",
	})

	function onSubmit(data: ShopFormValues) {
		toast.success("Shop information updated successfully", {
		description: "Your shop profile has been updated with the new information.",
		})
		console.log(data);
	}

	return (
		<main className="flex flex-col items-center justify-center py-8">
			<div className="container mx-auto max-w-[1300px]">
				<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<Tabs defaultValue="basic" className="w-full ">
						<TabsList className="grid grid-cols-5 mb-8 bg-[#222] border-none text-white">
							<TabsTrigger value="basic">Basic Info</TabsTrigger>
							<TabsTrigger value="location">Location</TabsTrigger>
							<TabsTrigger value="details">Shop Details</TabsTrigger>
							<TabsTrigger value="images">Images</TabsTrigger>
							<TabsTrigger value="social">Social Media</TabsTrigger>
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
									<Input placeholder="MotorMinds Auto Shop" {...field} />
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
									<Input placeholder="contact@motorminds.com" {...field} />
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
									<Input placeholder="555-123-4567" {...field} />
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
									<Input placeholder="John Smith" {...field} />
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
									<Input placeholder="123 Main Street" {...field} />
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
									<Input placeholder="Anytown" {...field} />
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
									<Input placeholder="CA" {...field} />
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
									<Input placeholder="https://motorminds.com" {...field} />
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
									<Input placeholder="Quality Service You Can Trust" {...field} />
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
								<FormItem>
									<FormLabel>Operating Hours</FormLabel>
									<FormControl>
									<Textarea 
									placeholder="Mon-Fri: 8am-6pm, Sat: 9am-3pm, Sun: Closed" 
									className="resize-none"
									{...field} 
									/>
									</FormControl>
									<FormDescription>
										Your shop's operating hours.
									</FormDescription>
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
									<FormControl>
									<Textarea 
									placeholder="Oil Changes, Brake Repair, Engine Diagnostics, Tire Services" 
									className="resize-none"
									{...field} 
									/>
									</FormControl>
									<FormDescription>
										List the services your shop offers.
									</FormDescription>
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
									className="resize-none min-h-[250px]"
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
									<Input placeholder="https://example.com/logo.png" {...field} />
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
									<Input placeholder="https://example.com/banner.png" {...field} />
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
									<Input placeholder="https://facebook.com/motorminds" {...field} />
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
									<Input placeholder="https://twitter.com/motorminds" {...field} />
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
									<Input placeholder="https://instagram.com/motorminds" {...field} />
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
									<Input placeholder="https://youtube.com/motorminds" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
								)}
							/>
							</div>
						</TabsContent>
					</Tabs>
					
					<Button type="submit" className="mt-6">Update Shop Profile</Button>
				</form>
				</Form>
			</div>
		</main>
	)
}