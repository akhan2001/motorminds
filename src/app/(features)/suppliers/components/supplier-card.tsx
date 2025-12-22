'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Phone, Mail, Edit, Trash2 } from 'lucide-react'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'
import { toast } from 'sonner'

interface SupplierCardProps {
    supplier: Supplier
    onCallSupplier?: (supplier: Supplier) => void
    onEdit?: (supplier: Supplier) => void
    onDelete?: (supplier: Supplier) => void
}

export default function SupplierCard({ supplier, onCallSupplier, onEdit, onDelete }: SupplierCardProps) {
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onEdit?.(supplier)
    }

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
            onDelete?.(supplier)
        }
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-600'
            case 'inactive':
                return 'bg-gray-600'
            case 'suspended':
                return 'bg-red-600'
            default:
                return 'bg-gray-600'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'Active'
            case 'inactive':
                return 'Inactive'
            case 'suspended':
                return 'Suspended'
            default:
                return status
        }
    }

    return (
        <Card className="bg-card dark:bg-[#111111] border-border dark:border-[#2a2a2a]">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground dark:text-white flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4" />
                        {supplier.name}
                    </CardTitle>
                    <Badge
                        variant={supplier.status === 'active' ? "default" : "secondary"}
                        className={`${getStatusBadgeColor(supplier.status)} text-xs`}
                    >
                        {getStatusText(supplier.status)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                <div className="grid grid-cols-1 gap-1.5 text-sm">
                    {supplier.contact_person && (
                        <div className="flex items-center gap-2 text-foreground dark:text-gray-300">
                            <span className="text-xs text-muted-foreground dark:text-gray-400">Contact:</span>
                            <span className="text-xs">{supplier.contact_person}</span>
                        </div>
                    )}

                    {supplier.phone_number && (
                        <div className="flex items-center gap-2 text-foreground dark:text-gray-300">
                            <Phone className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                            <span className="text-xs">{supplier.phone_number}</span>
                        </div>
                    )}

                    {supplier.email && (
                        <div className="flex items-center gap-2 text-foreground dark:text-gray-300">
                            <Mail className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
                            <span className="text-xs truncate">{supplier.email}</span>
                        </div>
                    )}

                    {supplier.account_number && (
                        <div className="text-xs text-muted-foreground dark:text-gray-400">
                            Account: {supplier.account_number}
                        </div>
                    )}

                    {supplier.address?.city && supplier.address?.province && (
                        <div className="text-xs text-muted-foreground dark:text-gray-400">
                            {supplier.address.city}, {supplier.address.province}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-border dark:border-[#2a2a2a]">
                    <Button
                        onClick={handleEditClick}
                        variant="outline"
                        className="flex-1 border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#2a2a2a] h-8 text-xs"
                        size="sm"
                    >
                        <Edit className="h-3 w-3 mr-1.5" />
                        Edit
                    </Button>
                    <Button
                        onClick={handleDeleteClick}
                        variant="outline"
                        className="flex-1 border-red-800/30 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-900/20 h-8 text-xs"
                        size="sm"
                    >
                        <Trash2 className="h-3 w-3 mr-1.5" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
