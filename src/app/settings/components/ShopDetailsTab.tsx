import { Suspense, lazy } from "react"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn } from "react-hook-form"
import { Loader2 } from "lucide-react"

// Lazy load heavy components
const OperatingHoursSection = lazy(() => import("./OperatingHoursSection").then(module => ({ default: module.OperatingHoursSection })))
const ServicesSection = lazy(() => import("./ServicesSection").then(module => ({ default: module.ServicesSection })))

interface DaySchedule {
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

interface ShopDetailsTabProps {
    form: UseFormReturn<any>
    operatingHours: WeekSchedule
    updateDaySchedule: (day: keyof WeekSchedule, field: keyof DaySchedule, value: any) => void
    times: string[]
    services: string[]
    newService: string
    setNewService: (value: string) => void
    handleAddService: (e: React.KeyboardEvent<HTMLInputElement>) => void
    removeService: (service: string) => void
}

// Loading component for lazy-loaded sections
const SectionLoader = () => (
    <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-gray-400">Loading...</span>
    </div>
)

export function ShopDetailsTab({
    form,
    operatingHours,
    updateDaySchedule,
    times,
    services,
    newService,
    setNewService,
    handleAddService,
    removeService
}: ShopDetailsTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-medium">Shop Details</h3>
            
            {/* Shop Information Section */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="shop_tagline"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tagline</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Quality Service You Can Trust" 
                                        className="bg-[#292929] border-[#626262] text-white" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormDescription>
                                    A short slogan or tagline for your shop.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="hst_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>HST Number</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="1234567890"
                                            className="bg-[#292929] border-[#626262] text-white"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Your shop's HST number.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="business_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Number</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="1234567890"
                                            className="bg-[#292929] border-[#626262] text-white"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Your shop's business number.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="shop_about"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>About Your Shop</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="We provide quality auto repair services with a focus on customer satisfaction." 
                                    className="resize-none min-h-[200px] bg-[#292929] border-[#626262] text-white"
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

            {/* Operating Hours Section */}
            <Suspense fallback={<SectionLoader />}>
                <OperatingHoursSection
                    form={form}
                    operatingHours={operatingHours}
                    updateDaySchedule={updateDaySchedule}
                    times={times}
                />
            </Suspense>
            
            {/* Services Section */}
            <Suspense fallback={<SectionLoader />}>
                <ServicesSection
                    form={form}
                    services={services}
                    newService={newService}
                    setNewService={setNewService}
                    handleAddService={handleAddService}
                    removeService={removeService}
                />
            </Suspense>
        </div>
    )
} 