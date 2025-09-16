export { default as CustomerSelection } from './CustomerSelection'

// Export the Customer type for convenience
export type Customer = {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone: string
    customer_address?: string
    customer_vehicle?: {
        year?: number
        make?: string
        model?: string
        trim?: string
    }
    license_plate?: string
    tags?: string[]
}

// Export props types for easier reuse
export type CustomerSelectionProps = {
    selectedCustomer?: Customer | null
    onCustomerSelect: (customer: Customer | null) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    showCreateOption?: boolean
    onCreateNew?: () => void
    compact?: boolean
}
