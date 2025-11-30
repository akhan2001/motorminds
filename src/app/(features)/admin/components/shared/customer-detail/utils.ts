// Re-export utility functions from centralized utils
export { formatDate, formatDateTime } from '@/lib/utils/date'
export { formatCurrency } from '@/lib/utils/currency'

export const getWorkOrderStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'completed') return 'default'
    if (statusLower === 'in_progress' || statusLower === 'pending') return 'secondary'
    if (statusLower === 'cancelled') return 'destructive'
    return 'outline'
}

export const getAppointmentStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'completed' || statusLower === 'confirmed') return 'default'
    if (statusLower === 'scheduled' || statusLower === 'in_progress') return 'secondary'
    if (statusLower === 'cancelled') return 'destructive'
    return 'outline'
}

export const getInvoiceStatusVariant = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'paid') return 'default'
    if (statusLower === 'pending' || statusLower === 'sent') return 'secondary'
    if (statusLower === 'overdue' || statusLower === 'cancelled') return 'destructive'
    return 'outline'
}

export const formatVehicleInfo = (vehicle?: {
    year?: number
    make?: string
    model?: string
    license_plate?: string
}) => {
    if (!vehicle) return 'Unknown Vehicle'
    return `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle'
}

export const formatEmployeeName = (employee?: {
    first_name?: string
    last_name?: string
}) => {
    if (!employee) return ''
    return `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
}
