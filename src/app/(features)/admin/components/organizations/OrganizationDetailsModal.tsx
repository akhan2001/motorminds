'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Building2, Mail, Calendar, Store, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'
import { StatusBadge } from '../shared/StatusBadge'
import { Badge } from '@/components/ui/badge'

interface Organization {
    id: string
    name: string
    organization_type?: string
    billing_email?: string
    subscription_plan?: string
    status?: string
    created_at: string
    updated_at?: string
    shop_count?: number
}

interface OrganizationDetailsModalProps {
    organization: Organization | null
    isOpen: boolean
    onClose: () => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

export function OrganizationDetailsModal({
    organization,
    isOpen,
    onClose,
    onEdit,
    onDelete
}: OrganizationDetailsModalProps) {
    if (!organization) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {organization.name}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        {organization.status && (
                            <StatusBadge status={organization.status} />
                        )}
                        {organization.subscription_plan && (
                            <Badge variant="outline">
                                {organization.subscription_plan}
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Organization Type</p>
                            <p className="text-foreground capitalize">
                                {organization.organization_type || 'N/A'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Billing Email</p>
                            <p className="text-foreground flex items-center gap-2">
                                {organization.billing_email ? (
                                    <>
                                        <Mail className="h-4 w-4" />
                                        {organization.billing_email}
                                    </>
                                ) : (
                                    'N/A'
                                )}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Shops</p>
                            <p className="text-foreground flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                {organization.shop_count || 0}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p className="text-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(organization.created_at)}
                            </p>
                        </div>
                    </div>

                    {(onEdit || onDelete) && (
                        <div className="flex gap-3 pt-4 border-t">
                            {onEdit && (
                                <Button
                                    onClick={() => {
                                        onEdit(organization.id)
                                        onClose()
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    onClick={() => {
                                        onDelete(organization.id)
                                        onClose()
                                    }}
                                    variant="destructive"
                                    className="flex-1"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

