import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { useState } from "react"
import { toast } from "sonner"

interface BasicInfoTabProps {
    form: UseFormReturn<any>
    shopId: string
}

export function BasicInfoTab({ form, shopId }: BasicInfoTabProps) {
    const [copied, setCopied] = useState(false)

    const handleCopyShopId = async () => {
        try {
            await navigator.clipboard.writeText(shopId)
            setCopied(true)
            toast.success("Shop ID copied to clipboard")
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            toast.error("Failed to copy Shop ID")
        }
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-medium text-foreground">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormItem>
                    <FormLabel>Shop ID</FormLabel>
                    <FormControl>
                        <div className="flex gap-2">
                            <Input 
                                value={shopId}
                                readOnly
                                className="bg-muted dark:bg-muted border-border text-foreground font-mono text-sm"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleCopyShopId}
                                className="shrink-0"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </FormControl>
                    <FormDescription>
                        Your unique shop identifier. Click the copy button to copy it.
                    </FormDescription>
                </FormItem>
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