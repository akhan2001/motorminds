'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { migrationsNavItems } from './migrations-nav'

export default function MigrationsNav() {
    const pathname = usePathname()

    return (
        <div className="flex gap-2 mb-6">
            {migrationsNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                    <Button
                        key={item.href}
                        asChild
                        variant={isActive ? 'default' : 'outline'}
                        className={
                            isActive
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white'
                        }
                        size="sm"
                    >
                        <Link href={item.href}>
                            <Icon className="h-4 w-4 mr-2" />
                            {item.name}
                        </Link>
                    </Button>
                )
            })}
        </div>
    )
}
