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
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle } from "lucide-react"
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
    SocialMediaTab,
    EmployeesTab
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
    }).optional(),
    shop_about: z.union([
        z.string().max(500).min(10, {
            message: "About section must be at least 10 characters.",
        }),
        z.literal('')
    ]).optional(),
    shop_tagline: z.union([
        z.string().max(100).min(5, {
            message: "Tagline must be at least 5 characters.",
        }),
        z.literal('')
    ]).optional(),
    default_hourly_rate: z.coerce.number().min(1, {
        message: "Hourly rate must be at least $1.00.",
    }).max(1000, {
        message: "Hourly rate must be less than $1000.00.",
    }).optional(),
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
    
    // State to track which tabs have errors
    const [tabsWithErrors, setTabsWithErrors] = useState<Set<string>>(new Set())
    
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
            default_hourly_rate: 99.99,
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
            if (hash && ['basic', 'location', 'details', 'images', 'social', 'employees'].includes(hash)) {
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
                default_hourly_rate: shop.default_hourly_rate || 99.99,
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

    // Update tab errors based on form validation state
    useEffect(() => {
        const tabFields: Record<string, (keyof ShopFormValues)[]> = {
            basic: ['shop_name', 'shop_email', 'shop_phone', 'shop_owner', 'default_hourly_rate'],
            location: ['shop_address', 'shop_city', 'shop_province', 'website'],
            details: ['shop_tagline', 'shop_about', 'hst_number', 'business_number'],
            images: ['logo_image_url', 'banner_image_url'],
            social: ['facebook_url', 'twitter_url', 'instagram_url', 'youtube_url']
        }

        const formErrors = form.formState.errors
        
        setTabsWithErrors(prev => {
            const newSet = new Set<string>()
            
            // Check each tab - if any field has an error, add tab to error set
            for (const [tab, fields] of Object.entries(tabFields)) {
                const hasError = fields.some(field => formErrors[field as keyof typeof formErrors])
                if (hasError) {
                    newSet.add(tab)
                }
            }
            
            return newSet
        })
    }, [form.formState.errors])

    // Function to validate all tabs and return which ones have errors
    const validateAllTabs = async (): Promise<Set<string>> => {
        const tabFields: Record<string, (keyof ShopFormValues)[]> = {
            basic: ['shop_name', 'shop_email', 'shop_phone', 'shop_owner', 'default_hourly_rate'],
            location: ['shop_address', 'shop_city', 'shop_province', 'website'],
            details: ['shop_tagline', 'shop_about', 'hst_number', 'business_number'],
            images: ['logo_image_url', 'banner_image_url'],
            social: ['facebook_url', 'twitter_url', 'instagram_url', 'youtube_url']
        }

        const errors = new Set<string>()
        
        for (const [tab, fields] of Object.entries(tabFields)) {
            const isValid = await form.trigger(fields as any)
            if (!isValid) {
                errors.add(tab)
            }
        }
        
        return errors
    }

    async function onSubmit(data: ShopFormValues) {
        console.log('Form submitted with data:', data);
        
        // Validate all tabs first
        const validationErrors = await validateAllTabs()
        setTabsWithErrors(validationErrors)
        
        if (validationErrors.size > 0) {
            // Switch to the first tab with errors
            const firstErrorTab = Array.from(validationErrors)[0]
            setActiveTab(firstErrorTab)
            window.location.hash = `#${firstErrorTab}`
            
            // Show toast with error summary
            const tabNames: Record<string, string> = {
                basic: 'Basic Information',
                location: 'Location',
                details: 'Shop Details',
                images: 'Images',
                social: 'Social Media'
            }
            const errorTabs = Array.from(validationErrors).map(tab => tabNames[tab] || tab).join(', ')
            toast.error(`Please fix errors in the following tabs: ${errorTabs}`)
            
            // Scroll to first error field
            const firstErrorTabFields = {
                basic: ['shop_name', 'shop_email', 'shop_phone', 'shop_owner', 'default_hourly_rate'],
                location: ['shop_address', 'shop_city', 'shop_province', 'website'],
                details: ['shop_tagline', 'shop_about', 'hst_number', 'business_number'],
                images: ['logo_image_url', 'banner_image_url'],
                social: ['facebook_url', 'twitter_url', 'instagram_url', 'youtube_url']
            }[firstErrorTab] || []
            
            const formErrors = form.formState.errors
            const firstErrorField = firstErrorTabFields.find(field => formErrors[field as keyof typeof formErrors])
            if (firstErrorField) {
                setTimeout(() => {
                    const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        ;(errorElement as HTMLElement).focus()
                    }
                }, 100)
            }
            
            return
        }
        
        // Clear errors if validation passes
        setTabsWithErrors(new Set())
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
                <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                <span className="ml-2 text-foreground">Loading shop information...</span>
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
                            <TabsList className="grid grid-cols-6 mb-8 bg-slate-50 dark:bg-muted border-none text-foreground">
                                <TabsTrigger 
                                    value="basic" 
                                    className={`data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted relative ${
                                        tabsWithErrors.has('basic') ? 'border-2 border-destructive' : ''
                                    }`}
                                    onClick={() => window.location.hash = '#basic'}
                                >
                                    <span className="flex items-center gap-2">
                                        Basic Info
                                        {tabsWithErrors.has('basic') && (
                                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center rounded-full">
                                                <AlertCircle className="h-2.5 w-2.5" />
                                            </Badge>
                                        )}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="location" 
                                    className={`data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted relative ${
                                        tabsWithErrors.has('location') ? 'border-2 border-destructive' : ''
                                    }`}
                                    onClick={() => window.location.hash = '#location'}
                                >
                                    <span className="flex items-center gap-2">
                                        Location
                                        {tabsWithErrors.has('location') && (
                                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center rounded-full">
                                                <AlertCircle className="h-2.5 w-2.5" />
                                            </Badge>
                                        )}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="details" 
                                    className={`data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted relative ${
                                        tabsWithErrors.has('details') ? 'border-2 border-destructive' : ''
                                    }`}
                                    onClick={() => window.location.hash = '#details'}
                                >
                                    <span className="flex items-center gap-2">
                                        Shop Details
                                        {tabsWithErrors.has('details') && (
                                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center rounded-full">
                                                <AlertCircle className="h-2.5 w-2.5" />
                                            </Badge>
                                        )}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="images" 
                                    className={`data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted relative ${
                                        tabsWithErrors.has('images') ? 'border-2 border-destructive' : ''
                                    }`}
                                    onClick={() => window.location.hash = '#images'}
                                >
                                    <span className="flex items-center gap-2">
                                        Images
                                        {tabsWithErrors.has('images') && (
                                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center rounded-full">
                                                <AlertCircle className="h-2.5 w-2.5" />
                                            </Badge>
                                        )}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="social" 
                                    className={`data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted relative ${
                                        tabsWithErrors.has('social') ? 'border-2 border-destructive' : ''
                                    }`}
                                    onClick={() => window.location.hash = '#social'}
                                >
                                    <span className="flex items-center gap-2">
                                        Social Media
                                        {tabsWithErrors.has('social') && (
                                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center rounded-full">
                                                <AlertCircle className="h-2.5 w-2.5" />
                                            </Badge>
                                        )}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="employees" 
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground hover:bg-muted relative"
                                    onClick={() => window.location.hash = '#employees'}
                                >
                                    <span className="flex items-center gap-2">
                                        Employees
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                            
                            {/* Basic Information Tab */}
                            <TabsContent value="basic">
                                <BasicInfoTab form={form} shopId={shopId} />
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
                            
                            {/* Employees Tab */}
                            <TabsContent value="employees">
                                <EmployeesTab shopId={shopId} />
                            </TabsContent>
                        </Tabs>
                        
                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={state.isSaving}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
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