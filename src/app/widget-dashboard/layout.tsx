"use client";

import { Nav } from "@/app/components/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare, Settings, BarChart2 } from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Main Dashboard" },
    { href: "/widget-dashboard", icon: MessageSquare, label: "Conversations" },
    { href: "/widget-dashboard/settings", icon: Settings, label: "Settings" },
    { href: "/widget-dashboard/analytics", icon: BarChart2, label: "Analytics" },
];

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            <Nav />
            <div className="flex flex-1">
                <aside className="w-64 p-4 border-r border-gray-800 flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Widget</h2>
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link href={item.href} key={item.href}>
                                <Button
                                    variant={pathname === item.href ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
