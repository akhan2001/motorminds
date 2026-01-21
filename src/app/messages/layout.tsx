"use client"

import { AppShell } from "@/components/layout"

export default function MessagesLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <AppShell>{children}</AppShell>
}
