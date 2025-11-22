'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'
import { RoleBadge } from './RoleBadge'
import { StatusBadge } from './StatusBadge'

interface UserCardUser {
    id: string
    email: string
    full_name?: string
    role: string
    status: string
    plan?: string
    shop_name?: string
    created_at: string
}

interface UserCardProps {
    user: UserCardUser
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onSuspend?: (id: string) => void
    onActivate?: (id: string) => void
    showActions?: boolean
}

export function UserCard({ 
    user, 
    onView, 
    onEdit,
    onSuspend,
    onActivate,
    showActions = true 
}: UserCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <CardTitle className="text-foreground text-lg">
                                {user.full_name || user.email}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <RoleBadge role={user.role} />
                                <StatusBadge status={user.status} />
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                    </div>
                    {user.shop_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{user.shop_name}</span>
                        </div>
                    )}
                    {user.plan && (
                        <Badge variant="outline" className="w-fit">
                            {user.plan}
                        </Badge>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Created {formatDate(user.created_at)}</span>
                    </div>
                </div>
                
                {showActions && (onView || onEdit || onSuspend || onActivate) && (
                    <div className="flex gap-2 pt-3 border-t">
                        {onView && (
                            <Button
                                onClick={() => onView(user.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                            >
                                View
                            </Button>
                        )}
                        {onEdit && (
                            <Button
                                onClick={() => onEdit(user.id)}
                                size="sm"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                Edit
                            </Button>
                        )}
                        {user.status === 'active' && onSuspend && (
                            <Button
                                onClick={() => onSuspend(user.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                Suspend
                            </Button>
                        )}
                        {user.status === 'suspended' && onActivate && (
                            <Button
                                onClick={() => onActivate(user.id)}
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                Activate
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

