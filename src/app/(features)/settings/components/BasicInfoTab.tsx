import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"

interface BasicInfoTabProps {
    form: UseFormReturn<any>
}

export function BasicInfoTab({ form }: BasicInfoTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-medium text-foreground">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="shop_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Shop Name</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="MotorMinds Auto Shop" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
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
                                <Input 
                                    placeholder="contact@motorminds.com" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
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
                                <Input 
                                    placeholder="555-123-4567" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
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
                                <Input 
                                    placeholder="John Smith" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormDescription>
                                The name of the shop owner.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="default_hourly_rate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Default Hourly Rate ($)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number"
                                    min="1"
                                    max="1000"
                                    step="0.01"
                                    placeholder="99.99" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormDescription>
                                Default labor rate used for AI-generated work order suggestions.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
} 