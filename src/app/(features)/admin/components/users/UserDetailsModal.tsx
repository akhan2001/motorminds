'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, Building2, Phone, Edit, Ban, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'
import { RoleBadge } from '../shared/RoleBadge'
import { StatusBadge } from '../shared/StatusBadge'
import { Badge } from '@/components/ui/badge'

interface UserDetails {
    id: string
    email: string
    full_name?: string
    role: string
    status: string
    plan?: string
    shop_name?: string
    created_at: string
    last_login?: string
    phone?: string
}

interface UserDetailsModalProps {
    user: UserDetails | null
    isOpen: boolean
    onClose: () => void
    onEdit?: (id: string) => void
    onSuspend?: (id: string) => void
    onActivate?: (id: string) => void
}

export function UserDetailsModal({
    user,
    isOpen,
    onClose,
    onEdit,
    onSuspend,
    onActivate
}: UserDetailsModalProps) {
    if (!user) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {user.full_name || user.email}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <RoleBadge role={user.role} />
                        <StatusBadge status={user.status} />
                        {user.plan && (
                            <Badge variant="outline">
                                {user.plan}
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-foreground flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {user.email}
                            </p>
                        </div>
                        {user.phone && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                <p className="text-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {user.phone}
                                </p>
                            </div>
                        )}
                        {user.shop_name && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Shop</p>
                                <p className="text-foreground flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {user.shop_name}
                                </p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p className="text-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(user.created_at)}
                            </p>
                        </div>
                        {user.last_login && (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                                <p className="text-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(user.last_login)}
                                </p>
                            </div>
                        )}
                    </div>

                    {(onEdit || onSuspend || onActivate) && (
                        <div className="flex gap-3 pt-4 border-t">
                            {onEdit && (
                                <Button
                                    onClick={() => {
                                        onEdit(user.id)
                                        onClose()
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                            {user.status === 'active' && onSuspend && (
                                <Button
                                    onClick={() => {
                                        onSuspend(user.id)
                                        onClose()
                                    }}
                                    variant="outline"
                                    className="flex-1 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Suspend
                                </Button>
                            )}
                            {user.status === 'suspended' && onActivate && (
                                <Button
                                    onClick={() => {
                                        onActivate(user.id)
                                        onClose()
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activate
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

