'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Phone, Mail, PhoneCall, Edit, Trash2 } from 'lucide-react'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'
import { toast } from 'sonner'

interface SupplierCardProps {
    supplier: Supplier
    onCallSupplier?: (supplier: Supplier) => void
    onEdit?: (supplier: Supplier) => void
    onDelete?: (supplier: Supplier) => void
}

export default function SupplierCard({ supplier, onCallSupplier, onEdit, onDelete }: SupplierCardProps) {
    const handleCallClick = () => {
        if (!supplier.phone_number) {
            toast.error('No phone number available for this supplier')
            return
        }
        onCallSupplier?.(supplier)
    }

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
            <CardHeader>
                <CardTitle className="text-foreground dark:text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {supplier.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {supplier.contact_person && (
                    <div className="flex items-center gap-2 text-foreground dark:text-gray-300">
                        <span className="text-sm">Contact: {supplier.contact_person}</span>
                    </div>
                )}

                {supplier.phone_number && (
                    <div className="flex items-center gap-2 text-foreground dark:text-gray-300">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{supplier.phone_number}</span>
                    </div>
                )}

                {supplier.email && (
                    <div className="flex items-center gap-2 text-foreground dark:text-gray-300">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{supplier.email}</span>
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

                <div className="pt-2">
                    <Badge
                        variant={supplier.status === 'active' ? "default" : "secondary"}
                        className={getStatusBadgeColor(supplier.status)}
                    >
                        {getStatusText(supplier.status)}
                    </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-4">
                    <Button
                        onClick={handleCallClick}
                        disabled={!supplier.phone_number}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                    >
                        <PhoneCall className="h-4 w-4 mr-2" />
                        Call for Parts
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleEditClick}
                            variant="outline"
                            className="flex-1 border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-[#2a2a2a]"
                            size="sm"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            onClick={handleDeleteClick}
                            variant="outline"
                            className="flex-1 border-red-800/30 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-900/20"
                            size="sm"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
