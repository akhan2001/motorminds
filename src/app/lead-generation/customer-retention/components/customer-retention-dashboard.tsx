import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, UserPlus, Calendar, Filter, Search, Phone, Mail, FileText, Check } from "lucide-react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import FilterCard from "@/app/components/FilterCard"
import { getCustomerFromRetention, getCustomerRetention, getVehicleFromRetention, getWorkOrderFromRetention } from "../utils/customer-retention"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { WorkorderHoverCard } from "./workorder-hover-card"
import { getPriority } from "os"

interface RetentionTask {
    id: string
    customer_id: string
    vehicle_id: string
    work_order_id: string
    status: 'pending' | 'scheduled' | 'completed' | 'cancelled'
    priority: 'low' | 'medium' | 'high'
    timeframe: 'immediate' | 'mid_term' | 'long_term'
    recommended_followup_date: string
    next_service_due_date: string
    summary: string
    insights_json: any
    contact_method_preference: 'email' | 'phone'
    customer_name?: string
    vehicle_info?: string
    created_at?: string
}

export default function CustomerRetentionDashboard({ shopId }: { shopId: string }) {
    const [activeTab, setActiveTab] = useState<'all' | 'immediate' | 'mid_term' | 'long_term'>('all')
    const [retentionTasks, setRetentionTasks] = useState<RetentionTask[]>([])
    const [filteredTasks, setFilteredTasks] = useState<RetentionTask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [stats, setStats] = useState({
        all: 0,
        immediate: 0,
        mid_term: 0,
        long_term: 0,
        conversion_rate: 0
    })

    useEffect(() => {
        fetchRetentionTasks()
    }, [shopId])

    useEffect(() => {
        applyFilters()
    }, [retentionTasks, activeTab, statusFilter, searchQuery])

    const fetchRetentionTasks = async () => {
        setIsLoading(true)
        try {
            const { data: retentionData, error } = await getCustomerRetention(shopId)

            if (error || !retentionData) {
                throw error || new Error('No data returned')
            }

            const formattedTasks: RetentionTask[] = await Promise.all(retentionData.map(async (task: any) => {
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
            
            // Calculate stats
            const stats = {
                all: formattedTasks.length,
                immediate: formattedTasks.filter(t => t.timeframe === 'immediate').length,
                mid_term: formattedTasks.filter(t => t.timeframe === 'mid_term').length,
                long_term: formattedTasks.filter(t => t.timeframe === 'long_term').length,
                conversion_rate: calculateConversionRate(formattedTasks)
            }
            setStats(stats)
        } catch (error) {
            console.error("Error fetching retention tasks:", error)
            toast.error("Failed to load retention tasks")
        } finally {
            setIsLoading(false)
        }
    }

    const calculateConversionRate = (tasks: RetentionTask[]) => {
        const completedTasks = tasks.filter(t => t.status === 'completed').length
        return tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
    }

    const applyFilters = () => {
        // Filter by timeframe - if "all" is selected, don't filter by timeframe
        let filtered = activeTab === 'all' 
            ? [...retentionTasks] 
            : retentionTasks.filter(task => task.timeframe === activeTab)
        
        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(task => task.status === statusFilter)
        }
        
        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(task => 
                task.customer_name?.toLowerCase().includes(query) ||
                task.vehicle_info?.toLowerCase().includes(query) ||
                task.summary?.toLowerCase().includes(query)
            )
        }
        
        setFilteredTasks(filtered)
    }

    const handleStatusChange = async (taskId: string, newStatus: RetentionTask['status']) => {
        try {
            const { error } = await supabase
                .from("customer_retention")
                .update({ status: newStatus })
                .eq("id", taskId)

            if (error) throw error

            // Update local state
            setRetentionTasks(prev => 
                prev.map(task => 
                    task.id === taskId ? { ...task, status: newStatus } : task
                )
            )
            
            toast.success(`Task marked as ${newStatus}`)
        } catch (error) {
            console.error("Error updating task status:", error)
            toast.error("Failed to update task status")
        }
    }

    const getStatusBadgeColor = (status: RetentionTask['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-600 hover:bg-yellow-700'
            case 'scheduled': return 'bg-blue-600 hover:bg-blue-700'
            case 'completed': return 'bg-green-600 hover:bg-green-700'
            case 'cancelled': return 'bg-gray-600 hover:bg-gray-700'
            default: return 'bg-gray-600 hover:bg-gray-700'
        }
    }

    const getPriorityColor = (priority: RetentionTask['priority']) => {
        switch (priority) {
            case 'high': return 'text-red-500'
            case 'medium': return 'text-yellow-500'
            case 'low': return 'text-green-500'
            default: return 'text-gray-500'
        }
    }

    const getTimeframeColor = (timeframe: RetentionTask['timeframe']) => {
        switch (timeframe) {
            case 'immediate': return 'bg-[#36612A]'
            case 'mid_term': return 'bg-[#9B870C]'
            case 'long_term': return 'bg-[#5D3A9B]'
            default: return 'bg-gray-600'
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    return (
        <div className="flex items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-col pb-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
                            Opportunities
                        </h1>
                    </div>
                    <p className="text-gray-400">
                        Manage your opportunities to increase customer loyalty and service revenue.
                    </p>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <FilterCard 
                        title="Immediate Tasks" 
                        value={stats.immediate} 
                        description="Current shop visit opportunities" 
                    />

                    <FilterCard 
                        title="Mid-Term Tasks" 
                        value={stats.mid_term} 
                        description="Follow-ups within 90 days" 
                    />

                    <FilterCard 
                        title="Long-Term Tasks" 
                        value={stats.long_term} 
                        description="Extended maintenance planning" 
                    />

                    <FilterCard 
                        title="Conversion Rate" 
                        value={stats.conversion_rate} 
                        description="Tasks resulting in service" 
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Search by customer, vehicle or description..."
                            className="pl-10 bg-[#1A1A1A] border-[#333] text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="w-full md:w-[200px]">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-[#1A1A1A] border-[#333] text-white">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1A1A] border-[#333] text-white">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tabs and Task Table */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid grid-cols-4 bg-[#1A1A1A] mb-6">
                        <TabsTrigger 
                            value="all" 
                            className="data-[state=active]:bg-[#444] data-[state=active]:text-white"
                        >
                            All Tasks ({stats.all})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="immediate" 
                            className="data-[state=active]:bg-[#36612A] data-[state=active]:text-white"
                        >
                            Immediate ({stats.immediate})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="mid_term" 
                            className="data-[state=active]:bg-[#9B870C] data-[state=active]:text-white"
                        >
                            Mid-Term ({stats.mid_term})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="long_term" 
                            className="data-[state=active]:bg-[#5D3A9B] data-[state=active]:text-white"
                        >
                            Long-Term ({stats.long_term})
                        </TabsTrigger>
                    </TabsList>

                    {['all', 'immediate', 'mid_term', 'long_term'].map((tab) => (
                        <TabsContent key={tab} value={tab} className="mt-0">
                            <div className="rounded-md border border-[#222] overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-[#222]">
                                        <TableRow className="hover:bg-[#222] border-b border-[#333]">
                                            <TableHead className="text-[#888] font-medium">CUSTOMER</TableHead>
                                            <TableHead className="text-[#888] font-medium">VEHICLE</TableHead>
                                            {tab === 'all' && (
                                                <TableHead className="text-[#888] font-medium">TIMEFRAME</TableHead>
                                            )}
                                            <TableHead className="text-[#888] font-medium">FOLLOW-UP DATE</TableHead>
                                            <TableHead className="text-[#888] font-medium">STATUS</TableHead>
                                            <TableHead className="text-[#888] font-medium">PRIORITY</TableHead>
                                            <TableHead className="text-[#888] font-medium">ACTIONS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={tab === 'all' ? 7 : 6} className="text-center py-8 text-gray-400">
                                                    Loading retention tasks...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredTasks.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={tab === 'all' ? 7 : 6} className="text-center py-8 text-gray-400">
                                                    No {tab === 'all' ? '' : tab.replace('_', ' ')} tasks found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredTasks.map((task) => (
                                                <HoverCard key={task.id}>
                                                    <HoverCardTrigger asChild>
                                                        <TableRow className="hover:bg-[#1a1a1a] border-b border-[#222] cursor-pointer">
                                                            <TableCell className="font-medium text-white">{task.customer_name}</TableCell>
                                                            <TableCell className="text-gray-300">{task.vehicle_info}</TableCell>
                                                            {tab === 'all' && (
                                                                <TableCell>
                                                                    <Badge className={`${getTimeframeColor(task.timeframe)} text-white border-none`}>
                                                                        {task.timeframe === 'mid_term' ? 'Mid-Term' : 
                                                                         task.timeframe === 'long_term' ? 'Long-Term' : 'Immediate'}
                                                                    </Badge>
                                                                </TableCell>
                                                            )}
                                                            <TableCell>
                                                                <div className="flex items-center">
                                                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                                    <span className="text-gray-300">{formatDate(task.recommended_followup_date)}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={`${getStatusBadgeColor(task.status)} text-white border-none`}>
                                                                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className={`font-medium ${getPriorityColor(task.priority)}`}>
                                                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex space-x-2">
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm"
                                                                        className="h-8 bg-[#1A1A1A] border-[#333] text-white hover:bg-[#333]"
                                                                        onClick={() => {
                                                                            // View task details implementation
                                                                            console.log("View task:", task.id)
                                                                        }}
                                                                    >
                                                                        <FileText className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    
                                                                    {task.status === 'pending' && (
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm"
                                                                            className="h-8 bg-blue-900/30 border-blue-800 text-blue-400 hover:bg-blue-800/50"
                                                                            onClick={() => handleStatusChange(task.id, 'scheduled')}
                                                                        >
                                                                            <Calendar className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                    
                                                                    {(task.status === 'pending' || task.status === 'scheduled') && (
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm"
                                                                            className="h-8 bg-green-900/30 border-green-800 text-green-400 hover:bg-green-800/50"
                                                                            onClick={() => handleStatusChange(task.id, 'completed')}
                                                                        >
                                                                            <Check className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                    
                                                                    {task.contact_method_preference === 'phone' ? (
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm"
                                                                            className="h-8 bg-[#1A1A1A] border-[#333] text-white hover:bg-[#333]"
                                                                        >
                                                                            <Phone className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    ) : (
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm"
                                                                            className="h-8 bg-[#1A1A1A] border-[#333] text-white hover:bg-[#333]"
                                                                        >
                                                                            <Mail className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    </HoverCardTrigger>
                                                    <HoverCardContent className="w-80 bg-[#1A1A1A] border-[#333] text-white">
                                                        {/* <WorkorderHoverCard workOrder={task.work_order_id} /> */}
                                                    </HoverCardContent>
                                                </HoverCard>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    )
}
