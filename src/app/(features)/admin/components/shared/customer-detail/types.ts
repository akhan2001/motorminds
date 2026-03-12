export interface Customer {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone?: string
    customer_address?: string
    license_plate?: string | null
    shop_id: string
    created_at: string
    updated_at?: string
    notes?: string
    shops?: {
        shop_name: string
        shop_email?: string
    }
}

export interface WorkOrder {
    id: string
    work_order_number: string
    title?: string
    status: string
    priority?: string
    created_at: string
    updated_at?: string
    completed_at?: string
    total_amount?: number
    customer_vehicles?: {
        id: string
        year?: number
        make?: string
        model?: string
        license_plate?: string
    }
    employees?: {
        id: string
        first_name?: string
        last_name?: string
    }
    shops?: {
        id: string
        shop_name: string
    }
}

export interface Appointment {
    id: string
    appointment_date: string
    start_time?: string
    end_time?: string
    service_type: string
    status?: string
    notes?: string
    created_at: string
    confirmation_code?: string
    customer_vehicles?: {
        id: string
        year?: number
        make?: string
        model?: string
        license_plate?: string
    }
    shops?: {
        id: string
        shop_name: string
    }
}

export interface Invoice {
    id: string
    invoice_number: string
    status: string
    total_amount: number
    issue_date: string
    due_date?: string
    paid_date?: string
    created_at: string
    vehicle?: {
        id: string
        year?: number
        make?: string
        model?: string
        license_plate?: string
    }
    walk_in_vehicle_info?: {
        year?: number
        make?: string
        model?: string
        license_plate?: string
    }
    work_order?: {
        id: string
        work_order_number: string
        title?: string
    }
    shops?: {
        id: string
        shop_name: string
    }
}

export interface CustomerHistory {
    workOrders: WorkOrder[]
    appointments: Appointment[]
    invoices: Invoice[]
    totalSpent: number
    lastVisit?: string
    stats?: {
        totalWorkOrders: number
        totalAppointments: number
        totalInvoices: number
        completedWorkOrders: number
        paidInvoices: number
    }
}

export interface Vehicle {
    id: string
    year?: number
    make?: string
    model?: string
    license_plate?: string
    vin?: string
    color?: string
    engine?: string
    mileage?: string
    created_at?: string
}

export interface CustomerDetailSheetProps {
    customer: Customer | null
    customerHistory?: CustomerHistory | null
    vehicles?: Vehicle[]
    isOpen: boolean
    onClose: () => void
    loading?: boolean
    vehiclesLoading?: boolean
    error?: string | null
}
