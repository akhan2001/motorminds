import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { getLeads, formatDate } from "../utils/lead"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@/components/ui/tooltip";
import { LeadSheet } from "./lead-sheet";

const statusColors = {
    "NEW": "bg-[#36612A]",
    "CONTACTED": "bg-[#2F4858]",
    "INTERESTED": "bg-[#9B870C]",
    "NOT INTERESTED": "bg-[#7A1F20]",
    "FOLLOW UP": "bg-[#5D3A9B]",
    "CUSTOMER": "bg-[#1E5631]"
}

export function LeadTable() {
    const [leads, setLeads] = useState<any[]>([])
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    useEffect(() => {
        const fetchLeads = async () => {
            const leads = await getLeads()
            setLeads(leads)
        }
        fetchLeads()
    }, [])

    const handleLeadClick = (lead: any) => {
        setSelectedLead(lead)
        setIsSheetOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-[#222] overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#222] border-none">
                        <TableRow className="hover:bg-[#222] border-b-1 border-[#333]">
                            <TableHead className="text-[#888] font-medium">CUSTOMER</TableHead>
                            <TableHead className="text-[#888] font-medium">DATE</TableHead>
                            <TableHead className="text-[#888] font-medium">SERVICE</TableHead>
                            <TableHead className="text-[#888] font-medium">MESSAGE</TableHead>
                            <TableHead className="text-[#888] font-medium">STATUS</TableHead>
                            <TableHead className="text-[#888] font-medium">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                            <TableRow className="hover:bg-[#1a1a1a] border-b border-[#222] cursor-pointer" key={lead.id} onClick={() => handleLeadClick(lead)}>
                                <TableCell className="text-white">{lead.customer_name}</TableCell>
                                <TableCell className="text-white">{formatDate(lead.updated_at)}</TableCell>
                                <TableCell className="text-white">{lead.service_name}</TableCell>
                                <TableCell className="text-white">{lead.message}</TableCell>
                                <TableCell className="text-white">
                                    <Badge variant="outline" className={`border-none text-white ${statusColors[lead.status as keyof typeof statusColors]}`}>
                                        {lead.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-white">
                                    <div className="flex gap-4">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button>
                                                        <Mail className="w-4 h-4" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                    <p>Send Email</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button>
                                                        <Phone className="w-4 h-4" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                    <p>Call</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button>
                                                        <MessageCircle className="w-4 h-4" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                    <p>Send Message</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
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
                />
            </div>
        </div>
    )
}
