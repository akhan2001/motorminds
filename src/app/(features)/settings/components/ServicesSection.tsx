import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"

interface ServicesSectionProps {
    form: UseFormReturn<any>
    services: string[]
    newService: string
    setNewService: (value: string) => void
    handleAddService: (e: React.KeyboardEvent<HTMLInputElement>) => void
    removeService: (service: string) => void
}

export function ServicesSection({ 
    form, 
    services, 
    newService, 
    setNewService, 
    handleAddService, 
    removeService 
}: ServicesSectionProps) {
    return (
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
                                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-foreground"
                                >
                                    <span>{service}</span>
                                    <button 
                                        type="button"
                                        onClick={() => removeService(service)}
                                        className="text-muted-foreground hover:text-foreground ml-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <FormControl>
                            <Input 
                                placeholder="Type a service and press Enter (e.g., Oil Changes, Brake Repair)" 
                                className="bg-white dark:bg-background border-border text-foreground"
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
    )
} 