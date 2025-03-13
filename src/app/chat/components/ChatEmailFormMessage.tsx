import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { sendEmail } from "@/app/customers/api/customer-utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Mail } from "lucide-react";

interface ChatEmailFormMessageProps {
  recipient_name: string;
  recipient_email: string;
  subject?: string;
  message?: string;
  onSuccess: (emailData: any) => void;
  onCancel: () => void;
}

export function ChatEmailFormMessage({ 
  recipient_name, 
  recipient_email, 
  subject = "", 
  message = "", 
  onSuccess, 
  onCancel 
}: ChatEmailFormMessageProps) {
  const [emailSubject, setEmailSubject] = useState(subject);
  const [emailBody, setEmailBody] = useState(message);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!recipient_email.trim()) {
      toast.error("Recipient email is required");
      return;
    }

    if (!emailSubject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!emailBody.trim()) {
      toast.error("Message body is required");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendEmail(recipient_email, emailSubject, emailBody, recipient_name);
      
      if (result) {
        toast.success("Email sent successfully");
        onSuccess({
          recipient_name,
          recipient_email,
          subject: emailSubject,
          message: emailBody
        });
      } else {
        toast.error("Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("An error occurred while sending the email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="bg-[#1A1A1A] border-[#333333] text-white w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-red-400" />
            <CardTitle className="text-lg text-white">Send Email</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-transparent"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-gray-400 text-sm">
          Send an email to {recipient_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <div>
          <label className="text-gray-300 text-sm block mb-1">To</label>
          <Input
            className="bg-[#292929] text-white text-sm border-[#444444] focus:border-blue-500 focus:ring-blue-500"
            value={`${recipient_name} <${recipient_email}>`}
            readOnly
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">Subject</label>
          <Input
            className="bg-[#292929] text-white text-sm border-[#444444] focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter email subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">Message</label>
          <textarea
            className="w-full min-h-[150px] bg-[#292929] text-white text-sm border border-[#444444] rounded-md p-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your message"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            required
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-[#444444] text-gray-300 hover:bg-[#333333] hover:text-white"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSending}
          className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
        >
          {isSending ? "Sending..." : "Send Email"}
        </Button>
      </CardFooter>
    </Card>
  );
}