import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Invoices - MotorMinds",
	description: "Manage and track invoices for your auto shop",
	icons: {
		icon: '/motorminds-logo-black.png',
		shortcut: '/motorminds-logo-black.png',
		apple: '/motorminds-logo-black.png',
	},
};

export default function InvoicesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
