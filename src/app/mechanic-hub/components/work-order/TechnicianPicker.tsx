'use client'

import { memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ControllerRenderProps } from 'react-hook-form'
import { Employee } from '@/hooks/useShopMeta'

interface TechnicianPickerProps {
    field: ControllerRenderProps<any, 'technicianId'>
    employees: Employee[]
}

const TechnicianPickerMemo = ({ field, employees }: TechnicianPickerProps) => {
    return (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger>
                <SelectValue placeholder="Select a technician" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export const TechnicianPicker = memo(TechnicianPickerMemo) 