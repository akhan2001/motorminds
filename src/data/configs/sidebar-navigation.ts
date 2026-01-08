import {
	Wrench,
	FileText,
	Archive,
	Package,
	CircleDollarSign,
	Sparkles,
	Wrench as WrenchIcon,
	Brain,
	Calendar,
    MessageSquareDiff,
	UsersRound,
	Building2,
	FileArchive,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavSection {
	title: string
	items: {
		name: string
		href: string
		icon: LucideIcon
	}[]
}

export const sidebarNavSections: NavSection[] = [
	{
		title: "Operations",
		items: [
			// {
			// 	name: "Appointments",
			// 	href: "/operations/appointments",
			// 	icon: Calendar,
			// },
			// {
			// 	name: "Work Orders",
			// 	href: "/operations/work-orders",
			// 	icon: Wrench,
			// },
			{
				name: "Archived Work Orders",
				href: "/operations/work-orders/archived",
				icon: Archive,
			},
			{
				name: "Suppliers",
				href: "/suppliers",
				icon: Building2,
			},
			{
				name: "Parts & Expenses",
				href: "/operations/expenses",
				icon: Package,
			},
		],
	},
	{
		title: "Diagnostics",
		items: [
			{
				name: "Mia AI",
				href: "/mia",
				icon: Sparkles,
			},
			{
				name: "Mia Parts",
				href: "/parts-ordering",
				icon: WrenchIcon,
			},
			// {
			// 	name: "AI Diagnostics",
			// 	href: "/ai/diagnostics",
			// 	icon: Brain,
			// },
		],
	},
	{
		title: "Financials",
		items: [
			// {
			// 	name: "Invoices",
			// 	href: "/financials/invoices",
			// 	icon: FileText,
			// },
			{
				name: "Archived Invoices",
				href: "/financials/invoices/archived",
				icon: FileArchive,
			},
			{
				name: "Financials",
				href: "/financials",
				icon: CircleDollarSign,
			},
		],
	},
	{
		title: "Customers",
		items: [
			{
				name: "All Customers",
				href: "/customers",
				icon: UsersRound,
			},
            {
                name: "Automated Messages",
                href: "/messaging",
                icon: MessageSquareDiff,
            }
		],
	},
]

