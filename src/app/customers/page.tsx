'use client'

import { Nav } from '@/app/components/nav'
import { CustomerDashboard } from './components/customer-dashboard'

export default function CustomersPage() {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Customers" />
            <CustomerDashboard />
        </div>
    )
}