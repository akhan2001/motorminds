'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// ------------------------------------------------------------------
//  Schema & Types
// ------------------------------------------------------------------
const workOrderSchema = z.object({
    description: z.string().min(3, 'Description is required'),
    status: z.enum(['Pending', 'In Progress', 'Completed', 'Waiting on Customer', 'Cancelled']),
    cost: z.coerce.number().nonnegative(),
    taskPriority: z.enum(['High', 'Medium', 'Low']),
})

type WorkOrderFormValues = z.infer<typeof workOrderSchema>

interface WorkOrderFormProps {
    shopId: string
    customerId: string
    vehicleId: string
    onSuccess?: () => void
}

// ------------------------------------------------------------------
//  Component
// ------------------------------------------------------------------
export function WorkOrderForm({ shopId, customerId, vehicleId, onSuccess }: WorkOrderFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<WorkOrderFormValues>({
        resolver: zodResolver(workOrderSchema),
        defaultValues: {
            description: '',
            status: 'Pending',
            cost: 0,
            taskPriority: 'Medium',
        },
    })

    const [isSaving, setIsSaving] = useState(false)

    async function onSubmit(values: WorkOrderFormValues) {
        if (isSaving) return
        setIsSaving(true)
        try {
            // 1. Create main repair order row
            const repairOrderId = uuidv4()
            const { error: mainErr } = await supabase.from('repair_orders').insert({
                id: repairOrderId,
                shop_id: shopId,
                customer_id: customerId,
                vehicle_id: vehicleId,
                status: values.status,
            })
            if (mainErr) throw mainErr

            // 2. Insert first detail row
            const { error: detailErr } = await supabase.from('repair_order_details').insert({
                id: uuidv4(),
                repair_order_id: repairOrderId,
                description: values.description,
                cost: values.cost,
                task_priority: values.taskPriority,
            })
            if (detailErr) throw detailErr

            toast.success('Work order created')
            reset()
            onSuccess?.()
        } catch (err: any) {
            console.error('Create work order failed', err)
            toast.error(err.message || 'Unexpected error')
        } finally {
            setIsSaving(false)
        }
    }

    // ------------------------------------------------------------------
    //  Render
    // ------------------------------------------------------------------
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <Input placeholder="Brake inspection" {...register('description')} />
                {errors.description && (
                    <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Status</label>
                    <Select {...register('status') as any /* radix Select not RHF-aware */}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {['Pending', 'In Progress', 'Waiting on Customer', 'Completed', 'Cancelled'].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.status && (
                        <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Priority</label>
                    <Select {...register('taskPriority') as any}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {['High', 'Medium', 'Low'].map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.taskPriority && (
                        <p className="text-red-500 text-xs mt-1">{errors.taskPriority.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Cost ($)</label>
                <Input type="number" step="0.01" min="0" {...register('cost')} />
                {errors.cost && (
                    <p className="text-red-500 text-xs mt-1">{errors.cost.message}</p>
                )}
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || isSaving}>Create Work Order</Button>
            </div>
        </form>
    )
} 