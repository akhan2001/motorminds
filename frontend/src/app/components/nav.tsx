import { Bell } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function Nav() {
  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/mia", label: "Mia AI" },
    { href: "/mechanic-hub", label: "Mechanic Hub" },
    { href: "/invoicing", label: "Invoicing" },
    { href: "/leads", label: "Lead Gen" },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-2">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-full bg-[#222222] px-4 py-2">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              
              <span className="text-lg font-semibold text-white">Motorminds</span>
            </Link>
            <div className="flex items-center gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-1.5 text-sm text-white transition-colors ${
                    link.label === "Mechanic Hub"
                      ? "bg-[#f52f2f] hover:bg-[#f52f2f]/90"
                      : "bg-[#131313] hover:bg-[#1e1e1e]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-full bg-[#131313] p-2 hover:bg-[#1e1e1e]">
              <Bell className="h-5 w-5 text-white" />
            </button>
            <div className="h-10 w-10 rounded-full bg-[#333333]" />
          </div>
        </div>
      </div>
    </nav>
  )
}

