'use client'

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils/text"

export interface CustomerInformationProps {
    customerName: string
    customerEmail: string
    customerPhone: string
    customerAddress: string
    isEditing: boolean
    onFieldChange: (field: string, value: string) => void
    className?: string
}

export const CustomerInformation: React.FC<CustomerInformationProps> = ({
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    isEditing,
    onFieldChange,
    className = ""
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Customer Information</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src="/placeholder.svg?height=64&width=64" />
                        <AvatarFallback className="bg-[#b22222] text-white text-xl">
                            {getInitials(customerName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-gray-400">Customer Name</Label>
                                <Input
                                    value={customerName}
                                    onChange={(e) => isEditing && onFieldChange('customer', e.target.value)}
                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                    readOnly={!isEditing}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-400">Email</Label>
                                <Input
                                    value={customerEmail}
                                    onChange={(e) => isEditing && onFieldChange('customerEmail', e.target.value)}
                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                    readOnly={!isEditing}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-400">Phone</Label>
                                <Input
                                    value={customerPhone}
                                    onChange={(e) => isEditing && onFieldChange('customerPhone', e.target.value)}
                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                    readOnly={!isEditing}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-400">Address</Label>
                                <Input
                                    value={customerAddress}
                                    onChange={(e) => isEditing && onFieldChange('customerAddress', e.target.value)}
                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                    readOnly={!isEditing}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
