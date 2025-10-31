import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Archived Invoices - MotorMinds",
  description: "View and manage archived historical invoices",
  icons: {
    icon: '/motorminds-logo-black.png',
    shortcut: '/motorminds-logo-black.png',
    apple: '/motorminds-logo-black.png',
  },
}

export default function ArchivedInvoicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

