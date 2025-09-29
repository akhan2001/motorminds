import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'

interface BreadcrumbItem {
    label: string
    href?: string
}

interface PageLayoutProps {
    children: React.ReactNode
    breadcrumbs?: BreadcrumbItem[]
    title?: string
    description?: string
    actions?: React.ReactNode
}

export function PageLayout({ 
    children, 
    breadcrumbs = [], 
    title, 
    description, 
    actions 
}: PageLayoutProps) {
    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-6xl mx-auto w-full">
                        {/* Breadcrumb Navigation */}
                        {breadcrumbs.length > 0 && (
                            <Breadcrumb className="mb-6">
                                <BreadcrumbList>
                                    {breadcrumbs.map((item, index) => (
                                        <div key={index} className="flex items-center">
                                            {index > 0 && (
                                                <BreadcrumbSeparator>
                                                    <Slash className="h-4 w-4" />
                                                </BreadcrumbSeparator>
                                            )}
                                            <BreadcrumbItem>
                                                {item.href ? (
                                                    <BreadcrumbLink asChild>
                                                        <Link href={item.href} className="text-gray-400 hover:text-gray-300">
                                                            {item.label}
                                                        </Link>
                                                    </BreadcrumbLink>
                                                ) : (
                                                    <BreadcrumbPage className="text-white">
                                                        {item.label}
                                                    </BreadcrumbPage>
                                                )}
                                            </BreadcrumbItem>
                                        </div>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        )}

                        {/* Header */}
                        {(title || description || actions) && (
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    {title && (
                                        <h1 className="text-3xl font-bold text-white mb-2">
                                            {title}
                                        </h1>
                                    )}
                                    {description && (
                                        <p className="text-gray-400">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                {actions && (
                                    <div className="flex gap-3">
                                        {actions}
                                    </div>
                                )}
                            </div>
                        )}

                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
