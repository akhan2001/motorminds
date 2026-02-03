'use client'

import React from 'react'
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils/text'
import { Edit, X, Save, Loader2, Mail } from 'lucide-react'
import type { Customer } from './types'

interface CustomerHeaderProps {
    customer: Customer
    isEditing?: boolean
    isSaving?: boolean
    onEditClick?: () => void
    onCancelClick?: () => void
    onSaveClick?: () => void
    showEmailButton?: boolean
    onEmailClick?: () => void
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ 
    customer,
    isEditing = false,
    isSaving = false,
    onEditClick,
    onCancelClick,
    onSaveClick,
    showEmailButton = false,
    onEmailClick
}) => {
    return (
        <SheetHeader className="pb-4 border-b border-border dark:border-[#222222]">
            <SheetDescription className="sr-only">
                Customer details and edit functionality for {customer.customer_name}
            </SheetDescription>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-red-600 text-white text-sm">
                            {getInitials(customer.customer_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <SheetTitle className="text-foreground dark:text-white text-xl font-bold">
                            {customer.customer_name}
                        </SheetTitle>
                        <p className="text-muted-foreground dark:text-gray-400 text-sm">
                            Customer ID: {customer.id.slice(0, 8)}...
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onCancelClick}
                                disabled={isSaving}
                                className="border-border text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={onSaveClick}
                                disabled={isSaving}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-1" />
                                        Save
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            {showEmailButton && customer.customer_email && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onEmailClick}
                                    className="border-border text-muted-foreground hover:bg-muted hover:text-red-500"
                                >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onEditClick}
                                className="border-border text-muted-foreground hover:bg-muted"
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                            <Badge className="bg-green-500/10 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-500/20">
                                Active
                            </Badge>
                        </>
                    )}
                </div>
            </div>
        </SheetHeader>
    )
}
