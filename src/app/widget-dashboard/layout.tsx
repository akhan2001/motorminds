"use client";

import { Nav } from "@/app/components/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const navItems = [
    { href: "/widget-dashboard", label: "Conversations" },
    { href: "/widget-dashboard/settings", label: "Settings" },
];

function WidgetNav() {
    const pathname = usePathname();
    return (
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-800">
            {navItems.map((item) => (
                <Link href={item.href} key={item.href}>
                    <Button
                        variant="ghost"
                        className={`rounded-none ${pathname === item.href ? 'border-b-2 border-white text-white' : 'text-zinc-400'}`}
                    >
                        {item.label}
                    </Button>
                </Link>
            ))}
        </div>
    )
}

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            <Nav />
            <main className="flex-1 py-8">
                <div className="container mx-auto max-w-[1300px]">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold">Widget Dashboard</h1>
                        <p className="text-zinc-400 mb-6">
                            Manage your customer-facing chat widget.
                        </p>
                    </div>
                    <WidgetNav />
                    {children}
                </div>
            </main>
        </div>
    );
}
