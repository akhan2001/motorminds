'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, Settings, BarChart3, Users, FileText, Database } from 'lucide-react'

const adminNavItems = [
	{
		name: 'Dashboard',
		href: '/admin/',
		icon: BarChart3
	},
	{
		name: 'Parts Requests',
		href: '/admin/parts-requests',
		icon: Package
	},
	{
		name: 'Users',
		href: '/admin/users',
		icon: Users
	},
	{
		name: 'Customer Statements',
		href: '/admin/customer-statements',
		icon: FileText
	},
	{
		name: 'Migrations',
		href: '/admin/migrations',
		icon: Database
	},
	{
		name: 'Invoice Import',
		href: '/admin/migrations/invoices',
		icon: FileText
	},
	{
		name: 'Settings',
		href: '/admin/settings',
		icon: Settings
	}
]

export default function AdminNav() {
	const pathname = usePathname()

	return (
		<div className="flex gap-2 mb-6">
			{adminNavItems.map((item) => {
				const Icon = item.icon
				const isActive = pathname === item.href

				return (
					<Button
						key={item.href}
						asChild
						variant={isActive ? 'default' : 'outline'}
						className={
							isActive
								? 'bg-blue-600 hover:bg-blue-700'
								: 'border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white'
						}
						size="sm"
					>
						<Link href={item.href}>
							<Icon className="h-4 w-4 mr-2" />
							{item.name}
						</Link>
					</Button>
				)
			})}
		</div>
	)
}
