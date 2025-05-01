"use client"

import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { getLeads, formatDate, updateLeadStatus, deleteLead } from "../utils/lead"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MessageCircle, UserPlus, Check, Trash, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { LeadSheet } from "./lead-sheet";
import { toast } from "sonner";
import { createNewCustomer, checkCustomerExists } from "@/app/customers/api/customer-utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CustomerInsightsDisplay from "./customer-insights-display";
import React from "react";

const statusColors = {
    "NEW": "bg-[#36612A]",
    "CONTACTED": "bg-[#2F4858]",
    "INTERESTED": "bg-[#9B870C]",
    "NOT INTERESTED": "bg-[#7A1F20]",
    "FOLLOW UP": "bg-[#5D3A9B]",
    "CUSTOMER": "bg-[#1E5631]"
}

export function LeadTable({ 
    shopId, 
    user, 
    activeFilter = 'ALL',
    searchQuery = '',
    statusFilter = 'all'
}: { 
    shopId: string, 
    user: any,
    activeFilter?: 'ALL' | 'NEW' | 'REWARD' | 'CUSTOMER',
    searchQuery?: string,
    statusFilter?: string
}) {
    const [leads, setLeads] = useState<any[]>([])
    const [filteredData, setFilteredData] = useState<any[]>([])
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
    const [insightsData, setInsightsData] = useState<Record<string, any>>({})

    useEffect(() => {
        const fetchLeads = async () => {
            setIsLoading(true)
            try {
                const leads = await getLeads(shopId)
                console.log("Fetched leads:", leads);
                setLeads(leads)
                
                // Look for work order leads and fetch their insights
                const workOrderLeads = leads.filter(lead => 
                    lead.lead_type?.toLowerCase() === 'work_order' || 
                    lead.lead_type?.toLowerCase() === 'workorder'
                )
                console.log("Work order leads:", workOrderLeads);
                
                for (const lead of workOrderLeads) {
                    if (lead.repair_order_id) {
                        console.log("Fetching insights for lead:", lead.id, "repair order:", lead.repair_order_id);
                        await fetchInsightsForLead(lead.id, lead.repair_order_id)
                    }
                }
                
                setIsLoading(false)
            } catch (error) {
                console.error("Error fetching leads:", error)
                toast.error("Failed to load leads")
                setIsLoading(false)
            }
        }
        
        fetchLeads()
    }, [shopId])

    const fetchInsightsForLead = async (leadId: string, repairOrderId: string) => {
        try {
            // Fetch insights from repair_order_details
            const { data, error } = await supabase
                .from("repair_order_details")
                .select("mia_insights")
                .eq("repair_order_id", repairOrderId)
                .single()
            
            if (!error && data && data.mia_insights) {
                setInsightsData(prev => ({
                    ...prev,
                    [leadId]: data.mia_insights
                }))
            }
        } catch (error) {
            console.error("Error fetching insights for lead:", error)
        }
    }

    // Apply filters whenever dependencies change
    useEffect(() => {
        applyFilters()
    }, [leads, activeFilter, searchQuery, statusFilter])

    const applyFilters = () => {
        let filtered = [...leads]
        
        // Apply activeFilter (from LeadFilter component cards)
        filtered = filtered.filter(lead => {
            switch (activeFilter) {
                case 'ALL':
                    return true;
                case 'NEW':
                    return lead.status === 'NEW';
                case 'REWARD':
                    return Boolean(lead.rewards_claim);
                case 'CUSTOMER':
                    return lead.status === 'CUSTOMER';
                default:
                    return true;
            }
        })
        
        // Apply status filter from dropdown
        if (statusFilter !== 'all') {
            filtered = filtered.filter(lead => lead.status === statusFilter)
        }
        
        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(lead => {
                const customerName = lead.customer_name?.toLowerCase() || '';
                const message = lead.message?.toLowerCase() || '';
                const status = lead.status?.toLowerCase() || '';
                const email = lead.email?.toLowerCase() || '';
                const phone = lead.phone?.toLowerCase() || '';
                const leadType = lead.lead_type?.toLowerCase() || '';
                
                return (
                    customerName.includes(query) ||
                    message.includes(query) ||
                    status.includes(query) ||
                    email.includes(query) ||
                    phone.includes(query) ||
                    leadType.includes(query)
                );
            })
        }
        
        setFilteredData(filtered)
    }

    const handleLeadClick = (lead: any) => {
        // If it's a work order lead, toggle expansion instead of opening sheet
        if (lead.lead_type?.toLowerCase() === 'work_order' || lead.lead_type?.toLowerCase() === 'workorder') {
            console.log("Toggling work order row");
            toggleRowExpansion(lead.id);
        } else {
            setSelectedLead(lead);
            setIsSheetOpen(true);
        }
    }

    const toggleRowExpansion = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        // console.log("Toggling row expansion for:", id);
        setExpandedRows(prev => {
            const newState = {
                ...prev,
                [id]: !prev[id]
            };
            // console.log("New expanded state:", newState);
            return newState;
        });
    };

    const handleCreateCustomer = async (e: React.MouseEvent, leadId: string) => {
        e.stopPropagation();
        try {
            console.log("Lead: ", leadId);
            // Getting leads data and putting into customer object
            const potentialCustomer = {
                customer_name: leads.find((lead) => lead.id === leadId)?.customer_name,
                customer_email: leads.find((lead) => lead.id === leadId)?.email,
                customer_phone: leads.find((lead) => lead.id === leadId)?.phone
            }

            console.log("Potential customer: ", potentialCustomer);

            const customerExists = await checkCustomerExists(potentialCustomer.customer_phone, shopId);
            if (customerExists) {
                toast.error("Customer already exists");
                return;
            }

            const customer = await createNewCustomer(potentialCustomer, shopId);
            if (customer) {
                toast.success("Customer created successfully");
                // Update the lead status to "CUSTOMER"
                await updateLeadStatus(leadId, "CUSTOMER");
                const updatedLeads = await getLeads(shopId);
                setLeads(updatedLeads);
            } else {
                toast.error("Failed to create customer");
            }
        } catch (error) {
            toast.error("Failed to create customer");
            console.error("Error creating customer:", error);
        }
    };

    const handleSendEmail = (e: React.MouseEvent, email: string) => {
        e.stopPropagation();
        window.open(`mailto:${email}`, '_blank');
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-green-500';
            default: return 'text-gray-500';
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-[#222] overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#222] border-none">
                        <TableRow className="hover:bg-[#222] border-b-1 border-[#333]">
                            <TableHead className="w-8"></TableHead>
                            <TableHead className="text-[#888] font-medium">CUSTOMER</TableHead>
                            <TableHead className="text-[#888] font-medium">DATE</TableHead>
                            <TableHead className="text-[#888] font-medium">MESSAGE</TableHead>
                            <TableHead className="text-[#888] font-medium">STATUS</TableHead>
                            <TableHead className="text-[#888] font-medium">LEAD TYPE</TableHead>
                            <TableHead className="text-[#888] font-medium">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                    Loading data...
                                </TableCell>
                            </TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                    No leads found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((lead) => (
                                <React.Fragment key={lead.id}>
                                    <TableRow 
                                        className={`border-b border-[#222] ${(lead.lead_type?.toLowerCase() === 'work_order' || lead.lead_type?.toLowerCase() === 'workorder') ? 'hover:bg-[#1a1a1a] cursor-pointer' : 'hover:bg-[#1a1a1a]'}`}
                                        onClick={() => handleLeadClick(lead)}
                                    >
                                        <TableCell className="w-8 p-0 pl-2">
                                            {(lead.lead_type?.toLowerCase() === 'work_order' || lead.lead_type?.toLowerCase() === 'workorder') && (
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            toggleRowExpansion(lead.id);
                                                        }}
                                                    >
                                                        {expandedRows[lead.id] ? 
                                                            <ChevronDown className="h-4 w-4" /> : 
                                                            <ChevronRight className="h-4 w-4" />
                                                        }
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-white">
                                            <div className="flex items-center gap-2">
                                                {lead.status === "NEW" && (
                                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                )}
                                                {lead.customer_name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-white">
                                            {formatDate(lead.updated_at || lead.created_at)}
                                        </TableCell>
                                        <TableCell className="text-white">
                                            {lead.rewards_claim ? (
                                                <div className="flex items-center">
                                                    <Badge className="bg-blue-500/20 text-blue-400 border-none mr-2">Reward</Badge>
                                                    {lead.message}
                                                </div>
                                            ) : (
                                                <div className="max-w-md truncate">
                                                    {lead.message}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-white">
                                            <Badge variant="outline" className={`border-none text-white ${statusColors[lead.status as keyof typeof statusColors]}`}>
                                                {lead.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-white">
                                            <Badge className={`border-none text-white ${(lead.lead_type?.toLowerCase() === 'work_order' || lead.lead_type?.toLowerCase() === 'workorder') ? 'bg-[#5D3A9B]' : 'bg-[#2F4858]'}`}>
                                                {lead.lead_type ? (lead.lead_type.charAt(0).toUpperCase() + lead.lead_type.slice(1)).replace('_', ' ') : "Website"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-white">
                                            <div className="flex gap-4">
                                                <button 
                                                    title="Send Email"
                                                    className="hover:text-blue-400"
                                                    onClick={(e) => handleSendEmail(e, lead.email)}
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                                
                                                {lead.status !== "CUSTOMER" ? (
                                                    <button 
                                                        title="Create Customer"
                                                        className="text-green-500 hover:text-green-400"
                                                        onClick={(e) => handleCreateCustomer(e, lead.id)}
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <div title="Customer Created">
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    
                                    {/* Expanded row content for work order leads */}
                                    {(lead.lead_type?.toLowerCase() === 'work_order' || lead.lead_type?.toLowerCase() === 'workorder') && expandedRows[lead.id] && (
                                        <TableRow className="bg-[#161616]" key={`expanded-${lead.id}`}>
                                            <TableCell colSpan={7} className="py-4 px-6">
                                                <div className="space-y-3">
                                                    {/* {console.log("Rendering expanded content for lead:", lead.id, "vehicle info:", lead.vehicle_info, "insights:", insightsData[lead.id])} */}
                                                    
                                                    {/* Default content when nothing is available */}
                                                    {!lead.vehicle_info && !lead.repair_order_id && (
                                                        <div className="p-4 border border-dashed border-[#333] rounded-md">
                                                            <p className="text-center text-gray-400">No additional information available for this work order.</p>
                                                        </div>
                                                    )}
                                                    
                                                    
                                                    {/* Customer Insights Component */}
                                                    {lead.repair_order_id && (
                                                        <CustomerInsightsDisplay repairOrderId={lead.repair_order_id} />
                                                    )}
                                                    
                                                    {/* Legacy Insights Display - Keep as fallback */}
                                                    {!lead.repair_order_id && insightsData[lead.id] && (
                                                        <>
                                                            {/* Summary */}
                                                            {insightsData[lead.id].summary && (
                                                                <div>
                                                                    <h4 className="text-xs text-gray-400 uppercase mb-1">Summary</h4>
                                                                    <p className="text-white whitespace-pre-wrap">{insightsData[lead.id].summary}</p>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Upsell Suggestions */}
                                                            {insightsData[lead.id].upsell_suggestions && insightsData[lead.id].upsell_suggestions.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs text-gray-400 uppercase mb-1">Recommended Services</h4>
                                                                    <div className="space-y-2">
                                                                        {insightsData[lead.id].upsell_suggestions.map((suggestion: any, index: number) => (
                                                                            <div key={index} className="p-2 bg-[#1A1A1A] border border-[#333] rounded-md">
                                                                                <div className="flex justify-between items-start">
                                                                                    <p className="text-sm font-medium text-white">{suggestion.title}</p>
                                                                                    <Badge className={`${getPriorityColor(suggestion.priority)}`}>
                                                                                        {suggestion.priority}
                                                                                    </Badge>
                                                                                </div>
                                                                                <p className="text-xs text-gray-400 mt-1">{suggestion.description}</p>
                                                                                {suggestion.estimatedValue && (
                                                                                    <p className="text-xs text-green-400 mt-1">
                                                                                        ${typeof suggestion.estimatedValue === 'number' ? 
                                                                                        suggestion.estimatedValue.toFixed(2) : suggestion.estimatedValue}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Flags */}
                                                            {insightsData[lead.id].flags && insightsData[lead.id].flags.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs text-gray-400 uppercase mb-1">Flags</h4>
                                                                    <div className="space-y-2">
                                                                        {insightsData[lead.id].flags.map((flag: any, index: number) => (
                                                                            <div key={index} className="p-2 bg-[#1A1A1A] border border-[#333] rounded-md">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Badge className={`${flag.type === 'urgent' ? 'bg-red-500/20 text-red-400' : 
                                                                                                   flag.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                                                                                                   'bg-blue-500/20 text-blue-400'}`}>
                                                                                        {flag.type}
                                                                                    </Badge>
                                                                                    <p className="text-sm text-white">{flag.message}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    
                                                    {!insightsData[lead.id] && (
                                                        <div className="text-gray-400 text-sm italic">
                                                            No insights available for this work order.
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
                {/* <LeadSheet
                    lead={selectedLead}
                    isOpen={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    sendEmail={() => {
                        window.open(`mailto:${selectedLead?.email}`, '_blank')
                    }}
                    callPhone={() => {
                        window.open(`tel:${selectedLead?.phone}`, '_blank')
                    }}
                /> */}
            </div>
        </div>
    )
}
