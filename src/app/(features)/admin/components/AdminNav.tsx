'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, Settings, BarChart3, Users, FileText, Database, Building2, UserPlus } from 'lucide-react'
import { useAdminContext } from './admin-context/useAdminContext'
import type { AdminType } from '@/types/core/user'

interface AdminNavItem {
	name: string
	href: string
	icon: any
	adminTypes: AdminType[]
}

const adminNavItems: AdminNavItem[] = [
	// Dashboard - All admin types
	{
		name: 'Dashboard',
		href: '/admin',
		icon: BarChart3,
		adminTypes: ['super-admin', 'organization-admin', 'shop-admin']
	},
	// Super Admin Only
	{
		name: 'Organizations',
		href: '/admin/super-admin/organizations',
		icon: Building2,
		adminTypes: ['super-admin']
	},
	{
		name: 'Shops',
		href: '/admin/super-admin/shops',
		icon: Building2,
		adminTypes: ['super-admin']
	},
	{
		name: 'Parts Requests',
		href: '/admin/parts-requests',
		icon: Package,
		adminTypes: ['super-admin']
	},
	{
		name: 'Customer Statements',
		href: '/admin/customer-statements',
		icon: FileText,
		adminTypes: ['super-admin']
	},
	{
		name: 'Migrations',
		href: '/admin/migrations',
		icon: Database,
		adminTypes: ['super-admin']
	},
	// Organization Admin Only
	{
		name: 'Shops',
		href: '/admin/organization/shops',
		icon: Building2,
		adminTypes: ['organization-admin']
	},
	// All Admin Types - Users
	{
		name: 'Users',
		href: '/admin/users',
		icon: Users,
		adminTypes: ['super-admin', 'organization-admin', 'shop-admin']
	},
	// Create User - Super Admin & Organization Admin
	{
		name: 'Create User',
		href: '/admin/create-user',
		icon: UserPlus,
		adminTypes: ['super-admin', 'organization-admin', 'shop-admin']
	},
	// Settings - All admin types
	{
		name: 'Settings',
		href: '/admin/settings',
		icon: Settings,
		adminTypes: ['super-admin', 'organization-admin', 'shop-admin']
	}
]

export default function AdminNav() {
	const pathname = usePathname()
	const { adminType } = useAdminContext()

	// Filter nav items based on admin type
	const filteredNavItems = adminNavItems.filter(item => 
		adminType && item.adminTypes.includes(adminType)
	)

	return (
		<div className="flex gap-2 mb-6 overflow-x-auto">
			{filteredNavItems.map((item) => {
				const Icon = item.icon
				const isActive = pathname && (pathname === item.href || pathname.startsWith(item.href + '/'))

				return (
					<Button
						key={item.href}
						asChild
						variant={isActive ? 'default' : 'outline'}
						className={
							isActive
								? 'bg-red-600 hover:bg-red-700 text-white whitespace-nowrap'
								: 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap'
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
