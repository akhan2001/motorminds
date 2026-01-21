"use client"

import { AppShell } from "@/components/layout"

export default function MiaLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <AppShell>{children}</AppShell>
}
