'use client'

import { memo } from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import { Customer } from '@/hooks/useShopMeta'
import { Combobox } from './Combobox'

interface CustomerPickerProps {
    field: ControllerRenderProps<any, 'customerId'>
    customers: Customer[]
}

const CustomerPickerMemo = ({ field, customers }: CustomerPickerProps) => {
    const customerOptions = customers.map(customer => ({
        value: customer.id,
        label: `${customer.first_name} ${customer.last_name} (${customer.phone})`
    }))

    return (
        <Combobox
            options={customerOptions}
            value={field.value}
            onChange={field.onChange}
            placeholder="Select a customer"
            emptyText="No customers found."
        />
    )
}

export const CustomerPicker = memo(CustomerPickerMemo) 