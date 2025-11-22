'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface QuickActionCardProps {
    title: string
    description: string
    icon: LucideIcon
    href?: string
    onClick?: () => void
    iconColor?: string
    iconBg?: string
    buttonText?: string
    buttonColor?: string
}

export function QuickActionCard({
    title,
    description,
    icon: Icon,
    href,
    onClick,
    iconColor = 'text-blue-600 dark:text-blue-400',
    iconBg = 'bg-blue-100 dark:bg-blue-900/20',
    buttonText = 'View',
    buttonColor = 'bg-red-600 hover:bg-red-700 text-white'
}: QuickActionCardProps) {
    const content = (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${iconBg} rounded-lg`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                {href ? (
                    <Button asChild className={`w-full ${buttonColor}`}>
                        <Link href={href}>{buttonText}</Link>
                    </Button>
                ) : onClick ? (
                    <Button onClick={onClick} className={`w-full ${buttonColor}`}>
                        {buttonText}
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    )

    return content
}

