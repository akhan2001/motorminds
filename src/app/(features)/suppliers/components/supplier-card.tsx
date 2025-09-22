'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Phone, Mail, PhoneCall } from 'lucide-react'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'
import { toast } from 'sonner'

interface SupplierCardProps {
    supplier: Supplier
    onCallSupplier?: (supplier: Supplier) => void
}

export default function SupplierCard({ supplier, onCallSupplier }: SupplierCardProps) {
    const handleCallClick = () => {
        if (!supplier.phone_number) {
            toast.error('No phone number available for this supplier')
            return
        }
        onCallSupplier?.(supplier)
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
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {supplier.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {supplier.contact_person && (
                    <div className="flex items-center gap-2 text-gray-300">
                        <span className="text-sm">Contact: {supplier.contact_person}</span>
                    </div>
                )}

                {supplier.phone_number && (
                    <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{supplier.phone_number}</span>
                    </div>
                )}

                {supplier.email && (
                    <div className="flex items-center gap-2 text-gray-300">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{supplier.email}</span>
                    </div>
                )}

                {supplier.account_number && (
                    <div className="text-xs text-gray-400">
                        Account: {supplier.account_number}
                    </div>
                )}

                {supplier.address?.city && supplier.address?.province && (
                    <div className="text-xs text-gray-400">
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
                <div className="flex gap-2 pt-4">
                    <Button
                        onClick={handleCallClick}
                        disabled={!supplier.phone_number}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                    >
                        <PhoneCall className="h-4 w-4 mr-2" />
                        Call for Parts
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
