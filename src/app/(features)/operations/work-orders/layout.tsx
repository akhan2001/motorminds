import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work Orders - MotorMinds",
  description: "Manage and track work orders for your auto shop",
  icons: {
    icon: '/motorminds-logo-black.png',
    shortcut: '/motorminds-logo-black.png',
    apple: '/motorminds-logo-black.png',
  },
};

export default function WorkOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
