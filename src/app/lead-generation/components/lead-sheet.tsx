import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate, saveNotes, updateLeadStatus, deleteLead } from "../utils/lead";
import { useState, useEffect } from "react";
import { PenIcon, CheckIcon, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createNewCustomer, checkCustomerExists} from "@/app/customers/api/customer-utils";
import { AlertConfirmation } from "@/app/components/AlertConfirmation";
import { useConfirmation } from "@/app/components/confirmation-service";

interface LeadSheetProps {
    lead: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sendEmail: (email: string) => void;
    callPhone: (phone: string) => void;
}

const formatPhoneNumber = (phoneNumber: string) => {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Check if the number has 10 digits
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    // Return original if not 10 digits
    return phoneNumber;
};

export function LeadSheet({ lead, isOpen, onOpenChange, sendEmail, callPhone }: LeadSheetProps) {
    const router = useRouter();
    const [notes, setNotes] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const { confirm } = useConfirmation();

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

    const handleViewCustomer = () => {
        router.push(`/customers`);
    };

    const createCustomer = async (leadId: string) => {
        const potentialCustomer = {
            customer_name: lead.customer_name,
            customer_email: lead.email,
            customer_phone: lead.phone
        }

        // console.log("Potential customer: ", potentialCustomer);
        const customerExists = await checkCustomerExists(potentialCustomer.customer_phone, lead.shop_id);
        if (customerExists) {
            toast.error("Customer already exists");
            return;
        }
        await createNewCustomer(potentialCustomer, lead.shop_id);
        await updateLeadStatus(leadId, "CUSTOMER");
        toast.success("Customer created successfully");
    };

    const handleDeleteLead = async (leadId: string, shopId: string) => {
        try {
            const confirmed = await confirm({
                title: "Delete Lead",
                description: "Are you sure you want to delete this lead?",
                confirmText: "Delete",
                cancelText: "Cancel",
                variant: "destructive"
            })
            if (confirmed) {
                await deleteLead(leadId, shopId);
                toast.success("Lead deleted successfully");
                onOpenChange(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to delete lead");
        }
    }

    // const callConfirmation = () => {
    //     AlertConfirmation({
    //         title: "Delete Lead",
    //         description: "Are you sure you want to delete this lead?",
    //         action: "Delete",
    //         onAction: () => handleDeleteLead(lead.id, lead.shop_id)
    //     })
    // }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="bg-[#131313] text-white border-l border-[#222] w-[400px]">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-white text-lg">{lead.customer_name}</SheetTitle>
                    </div>
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
                                <CardTitle className="text-lg font-medium text-white flex justify-between items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${getStatusColor(lead.status)}`}></div>
                                        {lead.status}
                                    </div>
                                    {lead.status === "CUSTOMER" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-transparent text-gray-400 border-none hover:bg-transparent hover:text-white"
                                            onClick={handleViewCustomer}
                                        >
                                            <ArrowUpRight className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-400 text-xs">Name</Label>
                                        <p className="text-white text-sm mt-1">{lead.customer_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400 text-xs">Phone</Label>
                                        <p className="text-white text-sm mt-1">{formatPhoneNumber(lead.phone)}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-gray-400 text-xs">Email</Label>
                                    <p className="text-white text-sm mt-1 break-all">{lead.email}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-400 text-xs">Created</Label>
                                    <p className="text-white text-sm mt-1">{formatDate(lead.created_at)}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Message Card */}
                        <Card className="bg-[#292929] border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">Message</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {lead.rewards_claim ? (
                                    <div className="space-y-3">
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                                            <p className="text-blue-400 text-sm font-medium">
                                                {lead.customer_name} has claimed the "{lead.rewards_claim.reward_name}" reward!
                                            </p>
                                        </div>
                                        <p className="text-white text-sm italic">"{lead.message}"</p>
                                    </div>
                                ) : lead.message.includes("claim") ? (
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
                        {/* <Button className="bg-blue-600 hover:bg-blue-500 w-full" onClick={() => sendEmail(lead.email)}>
                            Email
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-500 w-full" onClick={() => callPhone(lead.phone)}>
                            Call
                        </Button> */}
                        {/* <Button className="bg-yellow-600 hover:bg-yellow-500 w-full" onClick={() => sendMessage(lead.phone)}>
                            Message
                        </Button> */}
                        {lead.status !== "CUSTOMER" && (
                            <Button className="bg-blue-600 hover:bg-blue-500 w-full" onClick={() => createCustomer(lead.id)}>
                                Create Customer
                            </Button>
                        )}
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
                <SheetFooter>
                    <Button variant="destructive" onClick={() => handleDeleteLead(lead.id, lead.shop_id)}>
                        Delete Lead
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
