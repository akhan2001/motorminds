'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NewWorkOrderForm } from './NewWorkOrderForm'

export function WorkOrderFormDialog({ onSuccess }: { onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false)

    const handleSuccess = () => {
        onSuccess()
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Create Work Order</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Create New Work Order</DialogTitle>
                    <DialogDescription>
                        Fill out the details below to create a new work order.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] p-4">
                    <NewWorkOrderForm onSuccess={handleSuccess} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
} 