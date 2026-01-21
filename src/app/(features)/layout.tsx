"use client"

import { AppShell } from "@/components/layout"

export default function FeaturesLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <AppShell>{children}</AppShell>
}
