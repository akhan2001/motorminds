'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Mail, Calendar, Store } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'
import { StatusBadge } from './StatusBadge'

interface Organization {
    id: string
    name: string
    organization_type?: string
    billing_email?: string
    subscription_plan?: string
    status?: string
    created_at: string
    shop_count?: number
}

interface OrganizationCardProps {
    organization: Organization
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    showActions?: boolean
}

export function OrganizationCard({ 
    organization, 
    onView, 
    onEdit, 
    showActions = true 
}: OrganizationCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-foreground text-lg">
                                {organization.name}
                            </CardTitle>
                            {organization.organization_type && (
                                <p className="text-sm text-muted-foreground mt-1 capitalize">
                                    {organization.organization_type}
                                </p>
                            )}
                        </div>
                    </div>
                    {organization.status && (
                        <StatusBadge status={organization.status} />
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                    {organization.billing_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{organization.billing_email}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Store className="h-4 w-4" />
                        <span>{organization.shop_count || 0} shops</span>
                    </div>
                    {organization.subscription_plan && (
                        <Badge variant="outline" className="w-fit">
                            {organization.subscription_plan}
                        </Badge>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Created {formatDate(organization.created_at)}</span>
                    </div>
                </div>
                
                {showActions && (onView || onEdit) && (
                    <div className="flex gap-2 pt-3 border-t">
                        {onView && (
                            <Button
                                onClick={() => onView(organization.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                            >
                                View
                            </Button>
                        )}
                        {onEdit && (
                            <Button
                                onClick={() => onEdit(organization.id)}
                                size="sm"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

