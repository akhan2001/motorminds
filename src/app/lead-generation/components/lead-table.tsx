import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { getLeads, formatDate, updateLeadStatus } from "../utils/lead"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MessageCircle, UserPlus, Check } from 'lucide-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@/components/ui/tooltip";
import { LeadSheet } from "./lead-sheet";
import { toast } from "sonner";
import { createNewCustomer } from "@/app/customers/api/customer-utils";
import { getShopId } from "@/utils/supabase/supabase-shop";

const statusColors = {
    "NEW": "bg-[#36612A]",
    "CONTACTED": "bg-[#2F4858]",
    "INTERESTED": "bg-[#9B870C]",
    "NOT INTERESTED": "bg-[#7A1F20]",
    "FOLLOW UP": "bg-[#5D3A9B]",
    "CUSTOMER": "bg-[#1E5631]"
}

export function LeadTable({ shopId, user }: { shopId: string, user: any }) {
    const [leads, setLeads] = useState<any[]>([])
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    useEffect(() => {
        const fetchLeads = async () => {
            const leads = await getLeads(shopId)
            setLeads(leads)
        }
        fetchLeads()
    }, [shopId])

    const handleLeadClick = (lead: any) => {
        setSelectedLead(lead)
        setIsSheetOpen(true)
    }

    const handleCreateCustomer = async (e: React.MouseEvent, leadId: string) => {
        e.stopPropagation();
        try {
            console.log("Lead: ", leadId);
            // Getting leads data and putting into customer object
            const potentialCustomer = {
                customerName: leads.find((lead) => lead.id === leadId)?.customer_name,
                customerEmail: leads.find((lead) => lead.id === leadId)?.email,
                customerPhone: leads.find((lead) => lead.id === leadId)?.phone
            }

            const customer = await createNewCustomer(potentialCustomer, shopId);

            // Update the lead status to "CUSTOMER"
            await updateLeadStatus(leadId, "CUSTOMER");

            toast.success("Customer created successfully");
            const updatedLeads = await getLeads(shopId);
            setLeads(updatedLeads);
        } catch (error) {
            toast.error("Failed to create customer");
            console.error("Error creating customer:", error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-[#222] overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#222] border-none">
                        <TableRow className="hover:bg-[#222] border-b-1 border-[#333]">
                            <TableHead className="text-[#888] font-medium">CUSTOMER</TableHead>
                            <TableHead className="text-[#888] font-medium">DATE</TableHead>
                            {/* <TableHead className="text-[#888] font-medium">SERVICE</TableHead> */}
                            <TableHead className="text-[#888] font-medium">MESSAGE</TableHead>
                            <TableHead className="text-[#888] font-medium">STATUS</TableHead>
                            <TableHead className="text-[#888] font-medium">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                            <TableRow className="hover:bg-[#1a1a1a] border-b border-[#222] cursor-pointer" key={lead.id} onClick={() => handleLeadClick(lead)}>
                                <TableCell className="text-white">
                                    <div className="flex items-center gap-2">
                                        {lead.status === "NEW" && (
                                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        )}
                                        {lead.customer_name}
                                    </div>
                                </TableCell>
                                <TableCell className="text-white">{formatDate(lead.updated_at)}</TableCell>
                                {/* <TableCell className="text-white">{lead.service_name}</TableCell> */}
                                <TableCell className="text-white">{lead.message}</TableCell>
                                <TableCell className="text-white">
                                    <Badge variant="outline" className={`border-none text-white ${statusColors[lead.status as keyof typeof statusColors]}`}>
                                        {lead.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-white">
                                    <div className="flex gap-4">
                                        {/* Email Button */}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button>
                                                        <Mail 
                                                            className="w-4 h-4" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`mailto:${lead.customer_email}`, '_blank');
                                                            }}
                                                        />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                    <p>Send Email</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        {/* Call Button */}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button>
                                                        <Phone 
                                                            className="w-4 h-4" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`tel:${lead.customer_phone}`, '_blank');
                                                            }}
                                                        />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                    <p>Call</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        {/* Create Customer Button */}
                                        {lead.status != "CUSTOMER" ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button>
                                                            <UserPlus 
                                                                className="w-4 h-4 text-green-500 hover:text-green-400"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCreateCustomer(e, lead.id);
                                                                }}
                                                            />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                        <p>Create Customer</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div>
                                                            <Check className="w-4 h-4 text-green-500" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                        <p>Customer Created</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <LeadSheet
                    lead={selectedLead}
                    isOpen={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    sendEmail={() => {
                        window.open(`mailto:${selectedLead.email}`, '_blank')
                    }}
                    callPhone={() => {
                        window.open(`tel:${selectedLead.phone}`, '_blank')
                    }}
                    // sendMessage={() => {
                    //     window.open(`sms:${selectedLead.phone}`, '_blank')
                    // }}
                />
            </div>
        </div>
    )
}
