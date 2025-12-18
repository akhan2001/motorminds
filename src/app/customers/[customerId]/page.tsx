'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Nav } from '@/components/navigation/nav'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCustomerVehicles, getCustomerDetails, verifyCustomerBelongsToShop } from '../api/customer-utils'
import { User, Car, History, Calendar, Plus, Wrench, Slash, File } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { CustomerProfileCard } from './components/customer-profile-card'
import { CustomerVehicleCard } from './components/customer-vehicle-card'
import { CustomerHistoryCard } from './components/customer-history-card'
import { CustomerInvoiceCard } from './components/customer-invoice-card'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { checkUser } from '@/utils/supabase/supabase-auth'

export default function CustomerPage() {
    const [customer, setCustomer] = useState<any>(null)
    const [customerVehicles, setCustomerVehicles] = useState<any[]>([])
    const [workOrders, setWorkOrders] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [appointments, setAppointments] = useState<any[]>([])
    const [invoices, setInvoices] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState("profile")
    const [isLoading, setIsLoading] = useState(true)
    const [shopId, setShopId] = useState<string | null>(null)

    const params = useParams<{ customerId: string }>()
    const router = useRouter()
    
    // Confirm customer belongs to shop
    // useEffect(() => {
    //     async function fetchUserData() {
    //         setIsLoading(true)
    //         try {
    //             const userData = await checkUser()
    //             if (userData) {
    //                 const shop = await getShopId(userData.id)
    //                 if (shop) {
    //                     setShopId(shop)
    //                 } else {
    //                     router.push('/customers')
    //                 }
    //             } else {
    //                 router.push('/customers')
    //             }
    //         } catch (error) {
    //             console.error('Error:', error)
    //             router.push('/customers')
    //         } finally {
    //             setIsLoading(false)
    //         }
    //     }
        
    //     fetchUserData()
    // }, [router])

    useEffect(() => {
        const fetchCustomerData = async () => {
            setIsLoading(true)
            try {
                

                // Get customer details
                // const customerBelongsToShop = await verifyCustomerBelongsToShop(params?.customerId || '', shopId)

                const customerData = await getCustomerDetails(params?.customerId || '')
                if (!customerData) {
                    console.error('Customer data not found')
                    setCustomer(null)
                    return
                }
                setCustomer(customerData)
                
                // Get vehicles
                const vehicles = await getCustomerVehicles(params?.customerId || '')
                setCustomerVehicles(vehicles)
                
                // Get work orders (including archived for customer history)
                const { data: workOrderData } = await supabase
                    .from('work_orders')
                    .select(`
                        *,
                        customer_vehicles(year, make, model),
                        employees(first_name, last_name)
                    `)
                    .eq('customer_id', params?.customerId || '')
                    // Include both active and archived work orders for full history
                    .order('created_at', { ascending: false })
                
                setWorkOrders(workOrderData || [])
                
                // Get invoices (including those from archived work orders) - limit to recent 50
                const { data: invoiceData } = await supabase
                    .from('invoices')
                    .select(`
                        id, invoice_number, customer_id, shop_id, amount, status, issue_date, created_at, archived,
                        customers(customer_name),
                        work_orders!left(id, archived)
                    `)
                    .eq('customer_id', params?.customerId || '')
                    .order('created_at', { ascending: false })
                    .limit(50)
                
                setInvoices(invoiceData || [])
                
            } catch (error) {
                console.error('Error fetching customer data:', error)
            } finally {
                setIsLoading(false)
            }
        }
        
        if (params?.customerId) {
            fetchCustomerData()
        }
    }, [params?.customerId])
    
    // // Function to format dates nicely
    // const formatDate = (dateString: string) => {
    //     const date = new Date(dateString)
    //     return new Intl.DateTimeFormat('en-US', { 
    //         month: 'short', 
    //         day: 'numeric', 
    //         year: 'numeric',
    //         hour: 'numeric',
    //         minute: '2-digit'
    //     }).format(date)
    // }
    
    // // Function to determine status color
    // const getStatusColor = (status: string) => {
    //     switch(status.toLowerCase()) {
    //         case 'completed': return 'bg-green-500'
    //         case 'in progress': return 'bg-blue-500'
    //         case 'pending': return 'bg-yellow-500'
    //         default: return 'bg-gray-500'
    //     }
    // }
    
    // Loading state
    if (isLoading || !customer) {
        return (
            <div className="flex flex-col min-h-screen bg-background text-foreground">
                <Nav />
                <main className="flex items-center justify-center flex-grow">
                    <div className="animate-pulse text-foreground">Loading customer profile...</div>
                </main>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Nav />
            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 py-6 mb-16 md:mb-0 max-w-[1300px]">

                {/* Breadcrumb Navigation */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink>. . .</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <Slash className="h-4 w-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/customers" className="text-muted-foreground hover:text-foreground">Customers</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <Slash className="h-4 w-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink className="text-muted-foreground hover:text-foreground">{customer?.customer_name || 'Customer Details'}</BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Customer Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <Avatar className="h-16 w-16 md:h-20 md:w-20">
                            <AvatarImage src={customer?.avatar_url} />
                            <AvatarFallback className="bg-[#b22222] text-white text-xl">
                                {customer?.customer_name?.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{customer?.customer_name}</h1>
                            <p className="text-muted-foreground">Customer since {new Date(customer?.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>  
                    {/* <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button 
                            className="bg-[#b22222] hover:bg-[#e23232] text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Work Order
                        </Button>
                    </div> */}
                </div>
                
                {/* Tabs */}
                <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-slate-50 dark:bg-muted border-b border-border p-0 w-full flex justify-between md:justify-start">
                        <TabsTrigger 
                            value="profile" 
                            id="profile"
                            className="py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222] w-[25%]"
                        >
                            <User className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Profile</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="vehicles"
                            id="vehicles"
                            className="py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222] w-[25%]"
                        >
                            <Car className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Vehicles</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="history" 
                            className="py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222] w-[25%]"
                        >
                            <History className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">History</span>
                        </TabsTrigger>
                        {/* <TabsTrigger 
                            value="messages" 
                            className="py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222]"
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Messages</span>
                        </TabsTrigger> */}
                        {/* <TabsTrigger 
                            value="appointments" 
                            className="py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222]"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Appointments</span>
                        </TabsTrigger> */}
                        <TabsTrigger 
                            value="invoices" 
                            className="py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222] w-[25%]"
                        >
                            <File className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Invoices</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="mt-6" id="profile">
                        <CustomerProfileCard customer={customer} />
                    </TabsContent>

                    {/* Vehicles Tab */}
                    <TabsContent value="vehicles" className="mt-6" id="vehicles">
                        <CustomerVehicleCard customerVehicles={customerVehicles} />
                    </TabsContent>

                    {/* Work Order History Tab */}
                    <TabsContent value="history" className="mt-6" id="history">
                        <CustomerHistoryCard workOrders={workOrders} shopId={shopId || ''} />
                    </TabsContent>

                    {/* Messages Tab */}
                    {/* <TabsContent value="messages" className="mt-6">
                        <Card className="bg-[#1A1A1A] border-[#333] text-white min-h-[400px] flex flex-col">
                            <CardHeader className="border-b border-[#333]">
                                <CardTitle className="flex items-center">
                                    <MessageCircle className="h-5 w-5 mr-2" />
                                    Messages
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow py-4 overflow-y-auto">
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div 
                                            key={message.id} 
                                            className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div 
                                                className={`max-w-[80%] rounded-lg p-3 ${
                                                    message.sender === 'customer' 
                                                        ? 'bg-blue-900 text-white' 
                                                        : message.sender === 'mia'
                                                            ? 'bg-[#b22222] text-white'
                                                            : 'bg-[#292929] text-white'
                                                }`}
                                            >
                                                <div className="text-sm font-semibold mb-1">
                                                    {message.sender === 'customer' 
                                                        ? customer.customer_name 
                                                        : message.sender === 'mia'
                                                            ? 'Mia AI'
                                                            : 'Shop Staff'
                                                    }
                                                </div>
                                                <p>{message.text}</p>
                                                <div className="text-xs text-gray-300 mt-1 text-right">
                                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-[#333] p-3">
                                <div className="w-full flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Type a message..." 
                                        className="flex-grow bg-[#292929] text-white border border-[#626262] rounded-md px-3 py-2"
                                    />
                                    <Button className="bg-[#b22222] hover:bg-[#e23232] text-white">
                                        Send
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </TabsContent> */}

                    {/* Appointments Tab */}
                    {/* <TabsContent value="appointments" className="mt-6">
                        <Card className="bg-[#1A1A1A] border-[#333] text-white">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Appointments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {appointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {appointments.map((appointment) => (
                                            <div 
                                                key={appointment.id} 
                                                className="p-3 rounded-md bg-[#292929] border border-[#333]"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-medium">{appointment.service}</h4>
                                                        <p className="text-gray-400 text-sm">
                                                            {new Date(appointment.date).toLocaleDateString()} at{' '}
                                                            {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <Badge 
                                                        className={
                                                            appointment.status === 'Confirmed' 
                                                                ? 'bg-green-500/20 text-green-400' 
                                                                : appointment.status === 'Pending'
                                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                                    : 'bg-gray-500/20 text-gray-400'
                                                        }
                                                    >
                                                        {appointment.status}
                                                    </Badge>
                                                </div>
                                                {appointment.status === 'Confirmed' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                                                    >
                                                        Reschedule
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <Calendar className="h-12 w-12 text-gray-500 mb-3" />
                                        <h3 className="text-xl font-semibold mb-2">No Appointments</h3>
                                        <p className="text-gray-400 text-center mb-4">This customer has no upcoming appointments.</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="border-t border-[#333] pt-3">
                                <Button className="bg-[#b22222] hover:bg-[#e23232] text-white w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Schedule Appointment
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent> */}

                    {/* Invoices Tab */}
                    <TabsContent value="invoices" className="mt-6">
                        <div className="space-y-4">
                            {/* Add invoice content here */}
                            <CustomerInvoiceCard invoices={invoices} />
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Floating Action Button (Mobile Only)
            <div className="fixed right-6 bottom-20 md:hidden">
                <Button 
                    className="h-14 w-14 rounded-full bg-[#b22222] hover:bg-[#e23232] text-white shadow-lg"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#333] p-2 md:hidden">
                <div className="flex justify-around">
                    <button className="flex flex-col items-center py-1 px-3 text-gray-400">
                        <Home className="h-6 w-6" />
                        <span className="text-xs mt-1">Home</span>
                    </button>
                    <button className="flex flex-col items-center py-1 px-3 text-gray-400">
                        <Calendar className="h-6 w-6" />
                        <span className="text-xs mt-1">Appointments</span>
                    </button>
                    <button className="flex flex-col items-center py-1 px-3 text-[#b22222]">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-xs mt-1">Mia AI</span>
                    </button>
                    <button className="flex flex-col items-center py-1 px-3 text-gray-400">
                        <Star className="h-6 w-6" />
                        <span className="text-xs mt-1">Rewards</span>
                    </button>
                    <button className="flex flex-col items-center py-1 px-3 text-gray-400">
                        <User className="h-6 w-6" />
                        <span className="text-xs mt-1">Profile</span>
                    </button>
                </div>
            </div> */}
        </div>
    )
}

