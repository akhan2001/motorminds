// Employee domain types

export interface Employee {
    id: string
    shop_id: string
    first_name: string
    last_name: string | null
    role: string
    salary_or_wage: number
    pay_frequency: 'hourly' | 'weekly' | 'bi-weekly' | 'monthly'
    termination_date: string | null
    created_at: string
}

export interface EmployeeFormData {
    first_name: string
    last_name?: string
    role: string
    salary_or_wage: number
    pay_frequency: 'hourly' | 'weekly' | 'bi-weekly' | 'monthly'
}

export interface EmployeeUpdateData {
    first_name?: string
    last_name?: string
    role?: string
    salary_or_wage?: number
    pay_frequency?: 'hourly' | 'weekly' | 'bi-weekly' | 'monthly'
    termination_date?: string | null
}

export type EmployeeStatus = 'active' | 'terminated' | 'all'

