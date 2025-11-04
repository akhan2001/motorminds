import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"

interface SocialMediaTabProps {
    form: UseFormReturn<any>
}

export function SocialMediaTab({ form }: SocialMediaTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-medium text-foreground">Social Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="facebook_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="https://facebook.com/motorminds" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
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
                                <Input 
                                    placeholder="https://twitter.com/motorminds" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
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
                                <Input 
                                    placeholder="https://instagram.com/motorminds" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
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
                                <Input 
                                    placeholder="https://youtube.com/motorminds" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
} 