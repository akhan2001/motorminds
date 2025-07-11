"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

type Contract = {
    id: string;
    [key: string]: any;
};

interface ContractActionsProps {
    contract: Contract;
    onContractSent: () => void;
}

export default function ContractActions({ contract, onContractSent }: ContractActionsProps) {
    const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');

    const handleSendEmail = async () => {
        if (!customerEmail) {
            toast.error("Please enter a customer email address.");
            return;
        }

        try {
            const response = await fetch('/api/customer-contracts/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractId: contract.id, customerEmail }),
            });

            if (!response.ok) {
                throw new Error("Failed to send email.");
            }

            toast.success("Contract sent successfully!");
            onContractSent(); // This will be used to refresh the contract list
        } catch (error) {
            console.error(error);
            toast.error("Failed to send the contract.");
        } finally {
            setIsSendDialogOpen(false);
            setCustomerEmail('');
        }
    };

    return (
        <>
            <Button variant="ghost" size="sm" onClick={() => setIsSendDialogOpen(true)} className="text-gray-300 hover:text-white">
                <Send className="mr-2 h-4 w-4" />
                Send
            </Button>

            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Send Contract to Customer</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="email" className="text-gray-300">Customer Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={customerEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerEmail(e.target.value)}
                            placeholder="customer@example.com"
                            className="bg-gray-800 border-gray-700"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSendDialogOpen(false)} className="hover:bg-gray-800">Cancel</Button>
                        <Button onClick={handleSendEmail}>Send Email</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
} 