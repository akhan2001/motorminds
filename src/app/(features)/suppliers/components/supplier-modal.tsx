'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from 'lucide-react'
import SupplierIntakeForm from './supplier-intake-form'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'

interface SupplierModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (supplier: Supplier) => void
    trigger?: React.ReactNode
    supplier?: Supplier | null
}

export default function SupplierModal({ 
    open, 
    onOpenChange, 
    onSuccess, 
    trigger,
    supplier 
}: SupplierModalProps) {
    const defaultTrigger = (
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
        </Button>
    )

    const handleSuccess = (supplier: Supplier) => {
        onSuccess(supplier)
        onOpenChange(false)
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-foreground dark:text-white flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {supplier ? 'Edit Supplier' : 'Add New Supplier'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-gray-400">
                        {supplier ? 'Update supplier information below' : 'Enter supplier details to add a new supplier'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <SupplierIntakeForm
                        isModal={true}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                        supplier={supplier}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
