import { FileText, Users, Car } from 'lucide-react'

export const migrationsNavItems = [
    {
        name: 'Invoice Import',
        href: '/admin/migrations/invoices',
        icon: FileText
    },
    {
        name: 'Customer Migrations',
        href: '/admin/migrations/customers',
        icon: Users
    },
    {
        name: 'Vehicle Migrations',
        href: '/admin/migrations/vehicles',
        icon: Car
    }
]
