"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useShopSettings } from "@/hooks/useShopSettings"
import { useSettingsForm } from "@/hooks/useSettingsForm"
import { 
    BasicInfoTab, 
    LocationTab, 
    ShopDetailsTab, 
    ImagesTab, 
    SocialMediaTab 
} from "./components"

const supabase = createClient()

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
    operating_hours: z.string().optional().or(z.literal("")),
    services_offered: z.string().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
    hst_number: z.string().optional().or(z.literal("")),
    business_number: z.string().optional().or(z.literal("")),
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
export type DaySchedule = {
    closed: boolean;
    openTime: string;
    closeTime: string;
}

export type WeekSchedule = {
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
    const router = useRouter()
    const { shopInfo, updateShopInfo, isLoading, error } = useShopSettings(shopId)
    
    // Use custom hook for form state management
    const { state, actions } = useSettingsForm()
    
    // Use ref to store actions to avoid dependency issues
    const actionsRef = useRef(actions)
    actionsRef.current = actions
    
    // State for active tab
    const [activeTab, setActiveTab] = useState("basic")
    
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
            hst_number: "",
            business_number: "",
            logo_image_url: "",
            banner_image_url: "",
            facebook_url: "",
            twitter_url: "",
            instagram_url: "",
            youtube_url: "",
        },
    })

    // Generate time options for operating hours
    const times = timeOptions()

    // Handle hash changes and set active tab
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '')
            if (hash && ['basic', 'location', 'details', 'images', 'social'].includes(hash)) {
                setActiveTab(hash)
            }
        }

        // Set initial tab from hash
        handleHashChange()

        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    }, [])

    // Load shop data when available
    useEffect(() => {
        if (shopInfo.data) {
            const shop = shopInfo.data
            
            // Parse operating hours and services
            const parsedHours = parseOperatingHours(shop.operating_hours || "")
            const parsedServices = parseServices(shop.services_offered || "")
            
            // Update form with shop data
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
                hst_number: shop.hst_number || "",
                business_number: shop.business_number || "",
                logo_image_url: shop.logo_image_url || "",
                banner_image_url: shop.banner_image_url || "",
                facebook_url: shop.facebook_url || "",
                twitter_url: shop.twitter_url || "",
                instagram_url: shop.instagram_url || "",
                youtube_url: shop.youtube_url || "",
            })
            
            // Update reducer state using ref to avoid dependency issues
            actionsRef.current.setOperatingHours(parsedHours)
            actionsRef.current.setServices(parsedServices)
        }
    }, [shopInfo.data])

    async function onSubmit(data: ShopFormValues) {
        console.log('Form submitted with data:', data);
        await updateShopProfile(data)
    }

    async function updateShopProfile(data: ShopFormValues) {
        console.log('updateShopProfile called with:', { shopId, data });
        if (!shopId) {
            console.error('No shopId provided');
            return;
        }

        actions.setSaving(true)
        try {
            // Debug: Check what's being compared
            console.log('Validation checks:');
            console.log('Current shop data:', shopInfo.data);
            console.log('New business_number:', data.business_number);
            console.log('Current business_number:', shopInfo.data?.business_number);
            console.log('New shop_email:', data.shop_email);
            console.log('Current shop_email:', shopInfo.data?.shop_email);

            // Validate business number if it's being changed
            if (data.business_number && data.business_number.trim() !== (shopInfo.data?.business_number || '').trim()) {
                console.log('Checking business number conflict...');
                // Check if business number already exists
                const { data: existingShop, error: checkError } = await supabase
                    .from('shops')
                    .select('id, shop_name')
                    .eq('business_number', data.business_number.trim())
                    .neq('id', shopId)
                    .single()

                console.log('Business number check result:', { existingShop, checkError });

                if (existingShop) {
                    toast.error(`Business number already exists (used by ${existingShop.shop_name}). Please use a different number.`)
                    actions.setSaving(false)
                    return
                }
            }

            // Validate email if it's being changed
            if (data.shop_email && data.shop_email.trim() !== (shopInfo.data?.shop_email || '').trim()) {
                console.log('Checking email conflict...');
                // Check if email already exists
                const { data: existingShop, error: checkError } = await supabase
                    .from('shops')
                    .select('id, shop_name')
                    .eq('shop_email', data.shop_email.trim())
                    .neq('id', shopId)
                    .single()

                console.log('Email check result:', { existingShop, checkError });

                if (existingShop) {
                    toast.error(`Email already exists (used by ${existingShop.shop_name}). Please use a different email.`)
                    actions.setSaving(false)
                    return
                }
            }

            // Make sure operating hours and services are properly formatted as JSONB
            // Convert empty strings to undefined for optional fields to avoid unique constraint issues
            const formattedData = {
                ...data,
                operating_hours: stringifyOperatingHours(state.operatingHours),
                services_offered: stringifyServices(state.services),
                // Convert empty strings to undefined for fields that can be empty/null
                hst_number: data.hst_number?.trim() || undefined,
                business_number: data.business_number?.trim() || undefined,
                website: data.website?.trim() || undefined,
                logo_image_url: data.logo_image_url?.trim() || undefined,
                banner_image_url: data.banner_image_url?.trim() || undefined,
                facebook_url: data.facebook_url?.trim() || undefined,
                twitter_url: data.twitter_url?.trim() || undefined,
                instagram_url: data.instagram_url?.trim() || undefined,
                youtube_url: data.youtube_url?.trim() || undefined,
            }
            
            console.log('Formatted data for update:', formattedData);
            
            try {
                const result = await updateShopInfo.mutateAsync({ 
                    shopId, 
                    updates: formattedData 
                })
                
                console.log('Update result:', result);
                // Success toast is handled by the mutation hook
            } catch (updateError: any) {
                console.error('Update failed:', updateError);
                
                // Check for specific unique constraint violations
                if (updateError?.message?.includes('already exists')) {
                    if (updateError.message.includes('business_number')) {
                        toast.error('Business number already exists. Please use a different number.');
                    } else if (updateError.message.includes('shop_email')) {
                        toast.error('Email already exists. Please use a different email.');
                    } else {
                        toast.error('Some information already exists in our system. Please check your email and business number.');
                    }
                } else {
                    toast.error('Failed to update shop information. Please try again.');
                }
                actions.setSaving(false);
                return;
            }
            
            // Refresh the page to show updated data
            router.refresh()
        } catch (error) {
            console.error("Error updating shop info:", error)
            toast.error("Failed to update shop information", {
                description: "Please try again later.",
            })
        } finally {
            actions.setSaving(false)
        }
    }

    // Add a function to handle adding a new service
    const handleAddService = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && state.newService.trim()) {
            e.preventDefault()
            if (!state.services.includes(state.newService.trim())) {
                actions.addService(state.newService.trim())
            }
        }
    }
    
    // Add a function to remove a service
    const removeService = (service: string) => {
        actions.removeService(service)
    }

    // Add a function to update a specific day's schedule
    const updateDaySchedule = (day: keyof WeekSchedule, field: keyof DaySchedule, value: any) => {
        actions.updateDaySchedule(day, field, value)
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading shop information...</span>
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <p className="text-red-500">Failed to load shop information</p>
                    <Button 
                        onClick={() => window.location.reload()} 
                        className="mt-2"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <main className="flex flex-col items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full ">
                            <TabsList className="grid grid-cols-5 mb-8 bg-[#222] border-none text-white">
                                <TabsTrigger 
                                    value="basic" 
                                    className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
                                    onClick={() => window.location.hash = '#basic'}
                                >
                                    Basic Info
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="location" 
                                    className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
                                    onClick={() => window.location.hash = '#location'}
                                >
                                    Location
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="details" 
                                    className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
                                    onClick={() => window.location.hash = '#details'}
                                >
                                    Shop Details
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="images" 
                                    className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
                                    onClick={() => window.location.hash = '#images'}
                                >
                                    Images
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="social" 
                                    className="data-[state=active]:bg-[#555] data-[state=active]:text-white hover:bg-[#333]"
                                    onClick={() => window.location.hash = '#social'}
                                >
                                    Social Media
                                </TabsTrigger>
                            </TabsList>
                            
                            {/* Basic Information Tab */}
                            <TabsContent value="basic">
                                <BasicInfoTab form={form} />
                            </TabsContent>
                            
                            {/* Location Tab */}
                            <TabsContent value="location">
                                <LocationTab form={form} />
                            </TabsContent>
                            
                            {/* Shop Details Tab */}
                            <TabsContent value="details">
                                <ShopDetailsTab
                                    form={form}
                                    operatingHours={state.operatingHours}
                                    updateDaySchedule={updateDaySchedule}
                                    times={times}
                                    services={state.services}
                                    newService={state.newService}
                                    setNewService={actions.setNewService}
                                    handleAddService={handleAddService}
                                    removeService={removeService}
                                />
                            </TabsContent>
                            
                            {/* Images Tab */}
                            <TabsContent value="images">
                                <ImagesTab form={form} />
                            </TabsContent>
                            
                            {/* Social Media Tab */}
                            <TabsContent value="social">
                                <SocialMediaTab form={form} />
                            </TabsContent>
                        </Tabs>
                        
                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="bg-[#292929] hover:bg-[#333] border-[#626262] text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={state.isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={(e) => {
                                    console.log('Save button clicked');
                                    console.log('Form state:', form.formState);
                                    console.log('Form errors:', form.formState.errors);
                                }}
                            >
                                {state.isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </main>
    )
}