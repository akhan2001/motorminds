"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Mail } from "lucide-react";

interface SendConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contract: any;
  customerEmail: string;
}

export function SendConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  contract,
  customerEmail,
}: SendConfirmationDialogProps) {
  if (!isOpen || !contract) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-500" />
            Confirm Email Delivery
          </DialogTitle>
          <DialogDescription className="text-zinc-400 pt-2">
            You are about to send the contract titled "{contract.title}" to the following recipient. Please confirm the details are correct.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <div className="bg-zinc-800 p-4 rounded-lg">
                <p className="font-semibold text-zinc-300">Recipient Email:</p>
                <p className="text-lg text-white">{customerEmail}</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-lg">
                <p className="font-semibold text-zinc-300">Contract:</p>
                <p className="text-lg text-white">{contract.title}</p>
            </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-yellow-300">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm">Ensure the recipient is expecting this email. This action cannot be undone.</p>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="text-white border-zinc-600 hover:bg-zinc-800">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">
            Confirm & Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 