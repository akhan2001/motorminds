'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from 'lucide-react'
import SupplierIntakeForm from './supplier-intake-form'
import { Supplier } from '@/app/(features)/suppliers/types/supplier'

interface SupplierModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (supplier: Supplier) => void
    trigger?: React.ReactNode
}

export default function SupplierModal({ 
    open, 
    onOpenChange, 
    onSuccess, 
    trigger 
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
            <DialogContent className="bg-[#111111] border-[#2a2a2a] text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Add New Supplier
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <SupplierIntakeForm
                        isModal={true}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
