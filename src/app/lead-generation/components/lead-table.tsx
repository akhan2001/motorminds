"use client"

import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { getLeads, formatDate, updateLeadStatus, deleteLead } from "../utils/lead"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MessageCircle, UserPlus, Check, Trash, Calendar, FileText } from 'lucide-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@/components/ui/tooltip";
import { LeadSheet } from "./lead-sheet";
import { toast } from "sonner";
import { createNewCustomer, checkCustomerExists } from "@/app/customers/api/customer-utils";
import { getCustomerRetention, getCustomerFromRetention, getVehicleFromRetention, getWorkOrderFromRetention, updateRetentionStatus } from "../customer-retention/utils/customer-retention";
import { supabase } from "@/lib/supabase";

const statusColors = {
    "NEW": "bg-[#36612A]",
    "CONTACTED": "bg-[#2F4858]",
    "INTERESTED": "bg-[#9B870C]",
    "NOT INTERESTED": "bg-[#7A1F20]",
    "FOLLOW UP": "bg-[#5D3A9B]",
    "CUSTOMER": "bg-[#1E5631]"
}

const timeframeColors = {
    "immediate": "bg-[#36612A]",
    "mid_term": "bg-[#9B870C]",
    "long_term": "bg-[#5D3A9B]"
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
    const [retentionTasks, setRetentionTasks] = useState<any[]>([])
    const [combinedData, setCombinedData] = useState<any[]>([])
    const [filteredData, setFilteredData] = useState<any[]>([])
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchLeads = async () => {
            const leads = await getLeads(shopId)
            setLeads(leads)
        }
        
        const fetchRetentionTasks = async () => {
            setIsLoading(true)
            try {
                const { data: retentionData, error } = await getCustomerRetention(shopId)

                if (error || !retentionData) {
                    throw error || new Error('No data returned')
                }

                // Use the same formatting approach as in customer-retention-dashboard.tsx
                const formattedTasks = await Promise.all(retentionData.map(async (task: any) => {
                    const customer = await getCustomerFromRetention(task.customer_id)
                    const vehicle = await getVehicleFromRetention(task.vehicle_id)
                    const workOrder = await getWorkOrderFromRetention(task.work_order_id)
                    return {
                        ...task,
                        customer_name: customer.data?.customer_name || 'Unknown Customer',
                        vehicle_info: vehicle.data?.year + ' ' + vehicle.data?.make + ' ' + vehicle.data?.model || 'Unknown Vehicle',
                        created_at: workOrder.data?.created_at || task.created_at
                    };
                }))

                setRetentionTasks(formattedTasks)
            } catch (error) {
                console.error("Error fetching retention tasks:", error)
                toast.error("Failed to load retention tasks")
            } finally {
                setIsLoading(false)
            }
        }
        
        fetchLeads()
        fetchRetentionTasks()
    }, [shopId])

    // Combine lead and retention data
    useEffect(() => {
        // Process leads
        const leadsWithType = leads.map(lead => ({
            ...lead,
            dataType: 'lead',
            timeframe: lead.status === 'NEW' ? 'immediate' : 'mid_term'
        }))
        
        // Process retention tasks
        const retentionWithType = retentionTasks.map(task => ({
            ...task,
            dataType: 'retention',
            message: task.summary || '',
            status: task.status.toUpperCase()
        }))
        
        // Combine and sort by date
        const combined = [...leadsWithType, ...retentionWithType]
        combined.sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at)
            const dateB = new Date(b.updated_at || b.created_at)
            return dateB.getTime() - dateA.getTime() // Sort descending (newest first)
        })
        
        setCombinedData(combined)
    }, [leads, retentionTasks])

    // Apply filters whenever dependencies change
    useEffect(() => {
        applyFilters()
    }, [combinedData, activeFilter, searchQuery, statusFilter])

    const applyFilters = () => {
        let filtered = [...combinedData]
        
        // Apply activeFilter (from LeadFilter component cards)
        filtered = filtered.filter(item => {
            if (item.dataType === 'lead') {
                switch (activeFilter) {
                    case 'ALL':
                        return true;
                    case 'NEW':
                        return item.status === 'NEW';
                    case 'REWARD':
                        return Boolean(item.rewards_claim);
                    case 'CUSTOMER':
                        return item.status === 'CUSTOMER';
                    default:
                        return true;
                }
            } else {
                // For retention items
                if (activeFilter === 'ALL') return true;
                if (activeFilter === 'NEW' && item.timeframe === 'immediate') return true;
                return false;
            }
        })
        
        // Apply status filter from dropdown
        if (statusFilter !== 'all') {
            filtered = filtered.filter(item => {
                if (item.dataType === 'lead') {
                    return item.status === statusFilter;
                } else {
                    // For retention items, map the status filter to timeframe
                    if (statusFilter === 'NEW') return item.timeframe === 'immediate';
                    if (statusFilter === 'FOLLOW UP') return item.timeframe === 'mid_term';
                    return false;
                }
            })
        }
        
        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(item => {
                const customerName = item.customer_name?.toLowerCase() || '';
                const message = item.message?.toLowerCase() || '';
                const status = item.status?.toLowerCase() || '';
                const timeframe = item.timeframe?.toLowerCase() || '';
                const vehicleInfo = item.vehicle_info?.toLowerCase() || '';
                
                return (
                    customerName.includes(query) ||
                    message.includes(query) ||
                    status.includes(query) ||
                    timeframe.includes(query) ||
                    vehicleInfo.includes(query)
                );
            })
        }
        
        setFilteredData(filtered)
    }

    const handleLeadClick = (item: any) => {
        setSelectedLead(item)
        setIsSheetOpen(true)
    }

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

    const handleRetentionStatusChange = async (taskId: string, newStatus: string) => {
        try {
            const result = await updateRetentionStatus(taskId, newStatus.toLowerCase());

            if (!result.success) {
                throw result.error;
            }

            // Update local state
            setRetentionTasks(prev => 
                prev.map(task => 
                    task.id === taskId ? { ...task, status: newStatus.toLowerCase() } : task
                )
            )
            
            toast.success(`Task marked as ${newStatus}`)
        } catch (error) {
            console.error("Error updating task status:", error)
            toast.error("Failed to update task status")
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
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
                            <TableHead className="text-[#888] font-medium">CUSTOMER</TableHead>
                            <TableHead className="text-[#888] font-medium">DATE</TableHead>
                            <TableHead className="text-[#888] font-medium">MESSAGE/SUMMARY</TableHead>
                            <TableHead className="text-[#888] font-medium">TYPE</TableHead>
                            <TableHead className="text-[#888] font-medium">STATUS/TIMEFRAME</TableHead>
                            <TableHead className="text-[#888] font-medium">PRIORITY</TableHead>
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
                                    No data found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow 
                                    className="hover:bg-[#1a1a1a] border-b border-[#222] cursor-pointer" 
                                    key={`${item.dataType}-${item.id}`} 
                                    onClick={() => handleLeadClick(item)}
                                >
                                    <TableCell className="text-white">
                                        <div className="flex items-center gap-2">
                                            {(item.status === "NEW" || item.timeframe === "immediate") && (
                                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                            )}
                                            {item.customer_name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-white">
                                        {formatDate(item.updated_at || item.created_at)}
                                    </TableCell>
                                    <TableCell className="text-white">
                                        {item.dataType === 'lead' && item.rewards_claim ? (
                                            <div className="flex items-center">
                                                <Badge className="bg-blue-500/20 text-blue-400 border-none mr-2">Reward</Badge>
                                                {item.message}
                                            </div>
                                        ) : (
                                            <div className="max-w-md truncate">
                                                {item.message}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-white">
                                        <Badge className={`border-none text-white ${item.dataType === 'lead' ? 'bg-[#2F4858]' : 'bg-[#5D3A9B]'}`}>
                                            {item.dataType === 'lead' ? 'Lead' : 'Retention'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-white">
                                        {item.dataType === 'lead' ? (
                                            <Badge variant="outline" className={`border-none text-white ${statusColors[item.status as keyof typeof statusColors]}`}>
                                                {item.status}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className={`border-none text-white ${timeframeColors[item.timeframe as keyof typeof timeframeColors]}`}>
                                                {item.timeframe === 'mid_term' ? 'Mid-Term' : 
                                                 item.timeframe === 'long_term' ? 'Long-Term' : 'Immediate'}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-white">
                                        {item.dataType === 'retention' ? (
                                            <div className={`font-medium ${getPriorityColor(item.priority)}`}>
                                                {item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : '-'}
                                            </div>
                                        ) : (
                                            <div>-</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-white">
                                        <div className="flex gap-4">
                                            {item.dataType === 'lead' ? (
                                                <>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button>
                                                                    <Mail 
                                                                        className="w-4 h-4" 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            window.open(`mailto:${item.customer_email || item.email}`, '_blank');
                                                                        }}
                                                                    />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                                <p>Send Email</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    {item.status != "CUSTOMER" ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button>
                                                                        <UserPlus 
                                                                            className="w-4 h-4 text-green-500 hover:text-green-400"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleCreateCustomer(e, item.id);
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
                                                </>
                                            ) : (
                                                <>
                                                    {item.status !== 'completed' && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button>
                                                                        <Calendar 
                                                                            className="w-4 h-4" 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRetentionStatusChange(item.id, 'scheduled');
                                                                            }}
                                                                        />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                                    <p>Schedule Follow-up</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    
                                                    {item.status !== 'completed' && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button>
                                                                        <Check 
                                                                            className="w-4 h-4 text-green-500" 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRetentionStatusChange(item.id, 'completed');
                                                                            }}
                                                                        />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                                    <p>Mark as Completed</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button>
                                                                    <FileText 
                                                                        className="w-4 h-4" 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            // View details implementation
                                                                        }}
                                                                    />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                                                <p>View Details</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <LeadSheet
                    lead={selectedLead}
                    isOpen={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    sendEmail={() => {
                        window.open(`mailto:${selectedLead?.email || selectedLead?.customer_email}`, '_blank')
                    }}
                    callPhone={() => {
                        window.open(`tel:${selectedLead?.phone || selectedLead?.customer_phone}`, '_blank')
                    }}
                />
            </div>
        </div>
    )
}
