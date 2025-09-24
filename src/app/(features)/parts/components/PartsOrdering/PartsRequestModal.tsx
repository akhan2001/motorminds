'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import PartsIntakeForm from './PartsIntakeForm'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface PartsRequestModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplierId?: string
    onSuccess?: (partsRequest: PartsRequest) => void
}

export default function PartsRequestModal({ 
    open, 
    onOpenChange, 
    supplierId, 
    onSuccess 
}: PartsRequestModalProps) {
    const handleSuccess = (partsRequest: PartsRequest) => {
        onSuccess?.(partsRequest)
        onOpenChange(false)
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0d0d0d] border-[#2a2a2a]">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl">Request Parts from Auto Shop</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <PartsIntakeForm
                        supplierId={supplierId}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
