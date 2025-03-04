"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Dashboard",
    href: "/",
  },
  {
    title: "Mechanic Hub",
    href: "/mechanic-hub",
  },
  {
    title: "Mia AI",
    href: "/mia-ai",
  },
  {
    title: "Invoices",
    href: "/invoices",
  },
  {
    title: "Lead Gen",
    href: "/lead-gen",
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 flex items-center justify-center px-4">
      <div className="flex w-full max-w-4xl justify-between gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex-grow text-center",
              pathname === item.href
                ? "bg-[#b22222] text-white hover:bg-[#e23232]"
                : "bg-[#222222] text-[#9d9d9d] hover:text-white hover:bg-[#2d2d2d]",
            )}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  )
}

