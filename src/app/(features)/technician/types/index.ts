// Technician domain types

export interface Technician {
    id: string
    firstName: string
    lastName: string
    fullName: string
    role: string
    shopId: string
    salaryOrWage: number
    payFrequency: 'hourly' | 'weekly' | 'bi-weekly' | 'monthly'
    hireDate?: string
    terminationDate?: string
    createdAt: string
    updatedAt: string
}

export interface TechnicianOption {
    id: string
    firstName: string
    lastName: string
    fullName: string
    role: string
}

export interface TechnicianDropdownProps {
    shopId: string
    selectedTechnicianId: string
    onTechnicianSelect: (technicianId: string, technicianData?: TechnicianOption) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    showNoneOption?: boolean
}

// Common technician roles/types in automotive shops
export type TechnicianRole = 
    | 'Master Technician'
    | 'Senior Technician' 
    | 'Lead Technician'
    | 'Automotive Technician'
    | 'Junior Technician'
    | 'Apprentice'
    | 'Specialist - Engine'
    | 'Specialist - Transmission'
    | 'Specialist - Electrical'
    | 'Specialist - HVAC'
    | 'Specialist - Brakes'
    | 'Specialist - Suspension'
    | 'Diagnostic Technician'
    | 'Service Advisor'
    | 'Shop Foreman'

export const TECHNICIAN_ROLES: { value: TechnicianRole; label: string; description?: string }[] = [
    { value: 'Master Technician', label: 'Master Technician', description: 'Highly experienced, certified in multiple areas' },
    { value: 'Senior Technician', label: 'Senior Technician', description: 'Experienced with advanced diagnostic skills' },
    { value: 'Lead Technician', label: 'Lead Technician', description: 'Team leader with supervisory responsibilities' },
    { value: 'Automotive Technician', label: 'Automotive Technician', description: 'General automotive repair and maintenance' },
    { value: 'Junior Technician', label: 'Junior Technician', description: 'Entry-level technician with basic skills' },
    { value: 'Apprentice', label: 'Apprentice', description: 'Learning under supervision' },
    { value: 'Specialist - Engine', label: 'Engine Specialist', description: 'Specialized in engine repair and rebuilding' },
    { value: 'Specialist - Transmission', label: 'Transmission Specialist', description: 'Specialized in transmission repair' },
    { value: 'Specialist - Electrical', label: 'Electrical Specialist', description: 'Specialized in automotive electrical systems' },
    { value: 'Specialist - HVAC', label: 'HVAC Specialist', description: 'Specialized in heating and air conditioning' },
    { value: 'Specialist - Brakes', label: 'Brake Specialist', description: 'Specialized in brake systems' },
    { value: 'Specialist - Suspension', label: 'Suspension Specialist', description: 'Specialized in suspension and steering' },
    { value: 'Diagnostic Technician', label: 'Diagnostic Technician', description: 'Specialized in computer diagnostics' },
    { value: 'Service Advisor', label: 'Service Advisor', description: 'Customer interface and service coordination' },
    { value: 'Shop Foreman', label: 'Shop Foreman', description: 'Shop operations manager' },
]
