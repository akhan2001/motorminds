'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { workOrderSchema, WorkOrderFormData } from './schema'
import { useShopMeta } from '@/hooks/useShopMeta'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { CustomerPicker } from './CustomerPicker'
import { VehiclePicker } from './VehiclePicker'
import { TechnicianPicker } from './TechnicianPicker'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useMemo } from 'react'

export function NewWorkOrderForm({ onSuccess }: { onSuccess: () => void }) {
    const form = useForm<WorkOrderFormData>({
        resolver: zodResolver(workOrderSchema),
        defaultValues: {
            priority: 'Medium',
        },
    })

    const { data: shopMeta, isLoading: isLoadingMeta } = useShopMeta()

    const selectedCustomerId = form.watch('customerId')

    const customerVehicles = useMemo(() => {
        if (!selectedCustomerId || !shopMeta?.vehicles) return []
        return shopMeta.vehicles.filter(v => v.customer_id === selectedCustomerId)
    }, [selectedCustomerId, shopMeta?.vehicles])

    async function onSubmit(data: WorkOrderFormData) {
        if (!shopMeta?.shopId) {
            toast.error("Shop information not available.");
            return;
        }

        try {
            const { error } = await supabase.from('work_orders').insert({
                ...data,
                shop_id: shopMeta.shopId,
                status: 'Pending', // Default status
            });

            if (error) {
                throw error;
            }

            toast.success('Work order created successfully!');
            onSuccess();
        } catch (error: any) {
            toast.error(`Failed to create work order: ${error.message}`);
        }
    }

    if (isLoadingMeta) {
        return <div>Loading shop data...</div>
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Customer</FormLabel>
                                <FormControl>
                                    <CustomerPicker field={field} customers={shopMeta?.customers ?? []} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="vehicleId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vehicle</FormLabel>
                                <FormControl>
                                    <VehiclePicker field={field} vehicles={customerVehicles} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Set priority" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="technicianId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assign Technician</FormLabel>
                            <FormControl>
                                <TechnicianPicker field={field} employees={shopMeta?.employees ?? []} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="customer_notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Add any relevant notes..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit">Create Work Order</Button>
            </form>
        </Form>
    )
} 