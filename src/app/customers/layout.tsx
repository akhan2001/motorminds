"use client"

import { AppShell } from "@/components/layout"

export default function CustomersLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <AppShell>{children}</AppShell>
}
