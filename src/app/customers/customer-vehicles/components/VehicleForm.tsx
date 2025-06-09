"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Form validation schema
const vehicleSchema = z.object({
    customer_id: z.string().uuid(),
    year: z.string().transform(val => parseInt(val, 10)),
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    vin: z.string().optional(),
    license_plate: z.string().optional(),
    engine_type: z.string().optional(),
    color: z.string().optional(),
    mileage: z.string().transform(val => val ? parseInt(val, 10) : null).optional(),
});

interface VehicleFormProps {
    isOpen: boolean;
    onClose: () => void;
    shopId: string;
    existingVehicle?: any;
    customerId?: string;
}

export function VehicleForm({ 
    isOpen, 
    onClose, 
    shopId, 
    existingVehicle,
    customerId 
}: VehicleFormProps) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize form
    const form = useForm<z.infer<typeof vehicleSchema>>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            customer_id: customerId || existingVehicle?.customer_id || "",
            year: existingVehicle?.year?.toString() || new Date().getFullYear().toString(),
            make: existingVehicle?.make || "",
            model: existingVehicle?.model || "",
            vin: existingVehicle?.vin || "",
            license_plate: existingVehicle?.license_plate || "",
            engine_type: existingVehicle?.engine_type || "",
            color: existingVehicle?.color || "",
            mileage: existingVehicle?.mileage?.toString() || "",
        },
    });

    // Fetch customers for dropdown if customerId is not provided
    useEffect(() => {
        if (!customerId) {
            fetchCustomers();
        }
    }, [customerId]);

    async function fetchCustomers() {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('id, customer_name')
                .eq('shop_id', shopId)
                .order('customer_name');

            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    }

    async function onSubmit(values: z.infer<typeof vehicleSchema>) {
        try {
            setIsLoading(true);
            
            if (existingVehicle) {
                // Update existing vehicle
                const { error } = await supabase
                    .from('customer_vehicles')
                    .update(values)
                    .eq('id', existingVehicle.id);

                if (error) throw error;
            } else {
                // Create new vehicle
                const { error } = await supabase
                    .from('customer_vehicles')
                    .insert(values);

                if (error) throw error;
            }

            onClose();
        } catch (error) {
            console.error('Error saving vehicle:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Generate year options (from 1900 to current year)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from(
        { length: currentYear - 1900 + 1 }, 
        (_, i) => (currentYear - i).toString()
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border border-[#222] sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {existingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {!customerId && (
                            <FormField
                                control={form.control}
                                name="customer_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-[#1a1a1a] border-[#333]">
                                                    <SelectValue placeholder="Select a customer" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-[#1a1a1a] border-[#333]">
                                                {customers.map((customer) => (
                                                    <SelectItem 
                                                        key={customer.id} 
                                                        value={customer.id}
                                                        className="text-white hover:bg-[#222]"
                                                    >
                                                        {customer.customer_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Year</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-[#1a1a1a] border-[#333]">
                                                    <SelectValue placeholder="Select year" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-[#1a1a1a] border-[#333] max-h-[200px]">
                                                {yearOptions.map((year) => (
                                                    <SelectItem 
                                                        key={year} 
                                                        value={year}
                                                        className="text-white hover:bg-[#222]"
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="make"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Make</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                className="bg-[#1a1a1a] border-[#333]"
                                                placeholder="Enter make"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                className="bg-[#1a1a1a] border-[#333]"
                                                placeholder="Enter model"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="engine_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Engine Type</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                className="bg-[#1a1a1a] border-[#333]"
                                                placeholder="Enter engine type"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>VIN</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                className="bg-[#1a1a1a] border-[#333]"
                                                placeholder="Enter VIN"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="license_plate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>License Plate</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                className="bg-[#1a1a1a] border-[#333]"
                                                placeholder="Enter license plate"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                className="bg-[#1a1a1a] border-[#333]"
                                                placeholder="Enter color"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="mileage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mileage</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                type="number"
                                                value={field.value?.toString() || ""}
                                                className="bg-[#1a1a1a] border-[#333]"
                                                placeholder="Enter mileage"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="border-[#333] hover:bg-[#222] hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit"
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : existingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
