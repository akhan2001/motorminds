import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate, saveNotes } from "../utils/lead";
import { useState, useEffect } from "react";
import { PenIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

interface LeadSheetProps {
    lead: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sendEmail: (email: string) => void;
    callPhone: (phone: string) => void;
}

export function LeadSheet({ lead, isOpen, onOpenChange, sendEmail, callPhone }: LeadSheetProps) {
    const [notes, setNotes] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (lead) {
            setNotes(lead.notes || "");
            setIsEditing(false);
        }
    }, [lead?.id]);

    if (!lead) return null;

    const handleSaveNotes = async () => {
        try {
            await saveNotes(lead.id, notes);
            setIsEditing(false);
            toast.success("Notes saved successfully");
        } catch (error) {
            toast.error("Failed to save notes");
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            "NEW": "bg-green-500",
            "CONTACTED": "bg-blue-500",
            "INTERESTED": "bg-yellow-500",
            "NOT INTERESTED": "bg-red-500",
            "FOLLOW UP": "bg-purple-500",
            "CUSTOMER": "bg-emerald-500"
        };
        return colors[status as keyof typeof colors] || "bg-gray-500";
    };

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
                    <div className="space-y-4">
                        {/* Contact Info Card */}
                        <Card className="bg-[#292929] border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${getStatusColor(lead.status)}`}></div>
                                    {lead.status}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-400 text-xs">Name</Label>
                                        <p className="text-white text-sm mt-1">{lead.customer_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400 text-xs">Created</Label>
                                        <p className="text-white text-sm mt-1">{formatDate(lead.created_at)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400 text-xs">Email</Label>
                                        <p className="text-white text-sm mt-1 break-all">{lead.email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400 text-xs">Phone</Label>
                                        <p className="text-white text-sm mt-1">{lead.phone}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Message Card */}
                        <Card className="bg-[#292929] border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">Message</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {lead.message.includes("claim") ? (
                                    <div className="space-y-3">
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                                            <p className="text-blue-400 text-sm font-medium">
                                                {lead.customer_name} has claimed a reward!
                                            </p>
                                        </div>
                                        <p className="text-white text-sm italic">"{lead.message}"</p>
                                    </div>
                                ) : (
                                    <p className="text-white text-sm">"{lead.message}"</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/** Latest Message */}
                    {/* <Card className="bg-[#292929] border-none text-white text-sm">
                        <CardHeader>
                            <CardTitle className="text-white text-sm">"{lead.message}"</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400 text-xs">{formatDate(lead.created_at)}</p>
                        </CardContent>
                    </Card> */}

                    {/* Actions */}
                    <div className="flex justify-between gap-2">
                        <Button className="bg-blue-600 hover:bg-blue-500 w-full" onClick={() => sendEmail(lead.email)}>
                            Email
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-500 w-full" onClick={() => callPhone(lead.phone)}>
                            Call
                        </Button>
                        {/* <Button className="bg-yellow-600 hover:bg-yellow-500 w-full" onClick={() => sendMessage(lead.phone)}>
                            Message
                        </Button> */}
                    </div>

                    {/* Notes Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-gray-400 text-xs">Notes</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                                onClick={() => {
                                    if (isEditing) {
                                        handleSaveNotes();
                                    } else {
                                        setIsEditing(true);
                                    }
                                }}
                            >
                                {isEditing ? (
                                    <CheckIcon className="h-4 w-4" />
                                ) : (
                                    <PenIcon className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <textarea 
                            className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1 p-2 rounded-md w-full h-24 resize-none"
                            placeholder="Add any notes about this lead..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            readOnly={!isEditing}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
