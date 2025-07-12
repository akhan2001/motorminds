import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"

interface LocationTabProps {
    form: UseFormReturn<any>
}

export function LocationTab({ form }: LocationTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-medium">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="shop_address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="123 Main Street" 
                                    className="bg-[#292929] border-[#626262] text-white" 
                                    {...field} 
                                />
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
                                    <Input 
                                        placeholder="Anytown" 
                                        className="bg-[#292929] border-[#626262] text-white" 
                                        {...field} 
                                    />
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
                                    <Input 
                                        placeholder="CA" 
                                        className="bg-[#292929] border-[#626262] text-white" 
                                        {...field} 
                                    />
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
                                <Input 
                                    placeholder="https://motorminds.ca" 
                                    className="bg-[#292929] border-[#626262] text-white" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormDescription>
                                Your shop's website URL.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
} 