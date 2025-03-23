import { Dialog } from "@/components/ui/dialog";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { sendEmail } from "../api/customer-utils";

interface EmailDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    emailToSend: string;
    shopId: string;
}

export function EmailDialog({ isOpen, onOpenChange, emailToSend, shopId }: EmailDialogProps) {
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSendEmail = async () => {
        // Validate inputs
        if (!emailToSend) {
            toast.error("No email address provided");
            return;
        }
        
        if (!emailSubject.trim()) {
            toast.error("Subject is required");
            return;
        }
        
        if (!emailBody.trim()) {
            toast.error("Message is required");
            return;
        }
        
        setIsSending(true);
        try {
            await sendEmail(emailToSend, emailSubject, emailBody, shopId);
            toast.success("Email sent successfully");
            // Reset form and close dialog
            setEmailSubject("");
            setEmailBody("");
            onOpenChange(false);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to send email");
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#131313] text-white border border-[#222]">
                <DialogHeader>
                    <DialogTitle>Send Email to Customer</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Send an email to {emailToSend}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-left text-gray-300">Subject</Label>
                        <Input
                            id="subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="col-span-3 bg-[#292929] text-white border-[#626262]"
                            placeholder="Email subject"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="body" className="text-left text-gray-300">Message</Label>
                        <textarea
                            id="body"
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="col-span-3 bg-[#292929] text-white border-[#626262] min-h-[100px] p-2 rounded-md"
                            placeholder="Email message"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                        onClick={() => onOpenChange(false)}
                        disabled={isSending}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
                        onClick={handleSendEmail}
                        disabled={isSending}
                    >
                        {isSending ? "Sending..." : "Send Email"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
