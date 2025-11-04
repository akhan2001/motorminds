import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"

interface ImagesTabProps {
    form: UseFormReturn<any>
}

export function ImagesTab({ form }: ImagesTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-medium text-foreground">Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="logo_image_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Logo URL</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="https://example.com/logo.png" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
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
                                <Input 
                                    placeholder="https://example.com/banner.png" 
                                    className="bg-white dark:bg-background border-border text-foreground" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormDescription>
                                URL to your shop's banner image.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
} 