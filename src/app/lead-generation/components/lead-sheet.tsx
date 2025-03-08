import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
interface LeadSheetProps {
    lead: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sendEmail: (email: string) => void;
    callPhone: (phone: string) => void;
    sendMessage: (phone: string) => void;
}

export function LeadSheet({ lead, isOpen, onOpenChange, sendEmail, callPhone, sendMessage }: LeadSheetProps) {
    if (!lead) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="bg-[#131313] text-white border-l border-[#222] w-[400px]">
                <SheetHeader>
                    <SheetTitle className="text-white text-lg">{lead.customer_name}</SheetTitle>
                    <SheetDescription className="text-gray-400 text-sm">
                        Manage lead details and take action.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-5 mt-4">
                    {/* Lead Information */}
                    <div className="space-y-3">
                        <div>
                            <Label className="text-gray-400 text-xs">Email</Label>
                            <Input 
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1" 
                                value={lead.email}
                                readOnly
                            />
                        </div>
                        <div>
                            <Label className="text-gray-400 text-xs">Phone</Label>
                            <Input 
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1" 
                                value={lead.phone} 
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Lead Status */}
                    <div>
                        <Label className="text-gray-400 text-xs">Status</Label>
                        <Select 
                            defaultValue={lead.status}
                            onValueChange={(value) => {
                                console.log(value);
                            }}
                        >
                            <SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1">
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#292929] border-none text-white text-sm">
                                <SelectItem className="bg-[#292929]" value="NEW">New</SelectItem>
                                <SelectItem className="bg-[#292929]" value="CONTACTED">Contacted</SelectItem>
                                <SelectItem className="bg-[#292929]" value="INTERESTED">Interested</SelectItem>
                                <SelectItem className="bg-[#292929]" value="NOT INTERESTED">Not Interested</SelectItem>
                                <SelectItem className="bg-[#292929]" value="FOLLOW UP">Follow Up</SelectItem>
                                <SelectItem className="bg-[#292929]" value="CUSTOMER">Customer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/** Latest Message */}
                    <Card className="bg-[#292929] border-none text-white text-sm">
                        <CardHeader>
                            <CardTitle className="text-white text-sm">{lead.created_at}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400 text-xs">{lead.message}</p>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-between gap-2">
                        <Button className="bg-blue-600 hover:bg-blue-500 w-full" onClick={() => sendEmail(lead.customer_email)}>
                            Email
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-500 w-full" onClick={() => callPhone(lead.customer_phone)}>
                            Call
                        </Button>
                        <Button className="bg-yellow-600 hover:bg-yellow-500 w-full" onClick={() => sendMessage(lead.customer_phone)}>
                            Message
                        </Button>
                    </div>

                    {/* Notes Section */}
                    <div>
                        <Label className="text-gray-400 text-xs">Notes</Label>
                        <textarea 
                            className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 p-2 rounded-md w-full h-24 resize-none"
                            placeholder="Add any notes about this lead..."
                        ></textarea>
                    </div>
                </div>

                {/* Mia AI Chatbot */}
                {/* <div className="bg-[#1A1A1A] mt-5 p-4 rounded-md border border-[#292929]">
                    <h3 className="text-white text-sm font-semibold">Mia AI Assistant</h3>
                    <p className="text-gray-400 text-xs mb-2">Ask Mia for lead details or insights.</p>
                    
                    <div className="flex gap-2">
                        <Input 
                            className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 flex-1" 
                            placeholder="Ask Mia about this lead..."
                        />
                        <Button className="bg-blue-500 hover:bg-blue-400">Ask</Button>
                    </div>
                </div> */}
            </SheetContent>
        </Sheet>
    )
}
