'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Nav } from '@/app/components/nav'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCustomerName, getCustomerVehicles } from '../api/customer-utils'
import { formatPhoneNumber } from "@/app/invoices/utils/invoice-utils"
import { 
  User, Car, History, MessageCircle, Calendar, Home, Mail, Phone, 
  MapPin, Key, Gauge, Clock, Plus, Edit, MoreVertical, Wrench,
  Star
} from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function CustomerPage() {
    const [customer, setCustomer] = useState<any>(null)
    const [customerVehicles, setCustomerVehicles] = useState<any[]>([])
    const [workOrders, setWorkOrders] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [appointments, setAppointments] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState("profile")
    const [isLoading, setIsLoading] = useState(true)
    
    const params = useParams<{ customerId: string }>()
    const router = useRouter()
    
    useEffect(() => {
        const fetchCustomerData = async () => {
            setIsLoading(true)
            try {
                // Get customer details
                const { data: customerData } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', params?.customerId || '')
                    .single()
                
                setCustomer(customerData)
                
                // Get vehicles
                const vehicles = await getCustomerVehicles(params?.customerId || '')
                setCustomerVehicles(vehicles)
                
                // Get work orders
                const { data: workOrderData } = await supabase
                    .from('repair_orders')
                    .select(`
                        *,
                        repair_order_details(*),
                        customer_vehicles(year, make, model)
                    `)
                    .eq('customer_id', params?.customerId || '')
                    .order('created_at', { ascending: false })
                
                setWorkOrders(workOrderData || [])
                
                // Simulate message history (replace with actual data source)
                setMessages([
                    { id: 1, sender: 'shop', text: 'Your vehicle is ready for pickup', timestamp: '2023-07-15T14:30:00' },
                    { id: 2, sender: 'customer', text: "Great! I'll be there at 5pm", timestamp: '2023-07-15T15:45:00' },
                    { id: 3, sender: 'mia', text: 'Reminder: Your next service is due in 2 weeks', timestamp: '2023-07-20T09:00:00' }
                ])
                
                // Simulate appointments (replace with actual data source)
                setAppointments([
                    { id: 1, date: '2023-08-10T10:00:00', service: 'Oil Change', status: 'Confirmed' },
                    { id: 2, date: '2023-06-15T14:30:00', service: 'Brake Inspection', status: 'Completed' }
                ])
                
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
    
    // Function to format dates nicely
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date)
    }
    
    // Function to determine status color
    const getStatusColor = (status: string) => {
        switch(status.toLowerCase()) {
            case 'completed': return 'bg-green-500'
            case 'in progress': return 'bg-blue-500'
            case 'pending': return 'bg-yellow-500'
            default: return 'bg-gray-500'
        }
    }
    
    if (isLoading || !customer) {
        return (
            <div className="flex flex-col min-h-screen bg-black text-white">
                <Nav activeLink="Customers" />
                <main className="flex items-center justify-center flex-grow">
                    <div className="animate-pulse">Loading customer profile...</div>
                </main>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Customers" />
            
            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 py-6 mb-16 md:mb-0">
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
                            <h1 className="text-2xl md:text-3xl font-bold">{customer?.customer_name}</h1>
                            <p className="text-gray-400">Customer since {new Date(customer?.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
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
                    </div>
                </div>
                
                {/* Tabs */}
                <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-[#1A1A1A] border-b border-[#333] p-0 w-full flex justify-between md:justify-start">
                        <TabsTrigger 
                            value="profile" 
                            className="py-3 px-4 data-[state=active]:bg-[#292929] data-[state=active]:text-white rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222]"
                        >
                            <User className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Profile</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="vehicles" 
                            className="py-3 px-4 data-[state=active]:bg-[#292929] data-[state=active]:text-white rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222]"
                        >
                            <Car className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Vehicles</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="history" 
                            className="py-3 px-4 data-[state=active]:bg-[#292929] data-[state=active]:text-white rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222]"
                        >
                            <History className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">History</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="messages" 
                            className="py-3 px-4 data-[state=active]:bg-[#292929] data-[state=active]:text-white rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222]"
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Messages</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="appointments" 
                            className="py-3 px-4 data-[state=active]:bg-[#292929] data-[state=active]:text-white rounded-none border-b-2 border-transparent data-[state=active]:border-[#b22222]"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Appointments</span>
                        </TabsTrigger>
                    </TabsList>
                    
                    {/* Profile Tab */}
                    <TabsContent value="profile" className="mt-6">
                        <Card className="bg-[#1A1A1A] border-[#333] text-white">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="h-5 w-5 mr-2" />
                                    Customer Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                    <div className="flex items-start">
                                        <Home className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-gray-400 text-sm">Name</p>
                                            <p>{customer.customer_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-gray-400 text-sm">Email</p>
                                            <p>{customer.customer_email || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-gray-400 text-sm">Phone</p>
                                            <p>{formatPhoneNumber(customer.customer_phone) || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-gray-400 text-sm">Address</p>
                                            <p>{customer.customer_address || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Key className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-gray-400 text-sm">Customer ID</p>
                                            <p className="font-mono text-sm">{customer.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    {/* Vehicles Tab */}
                    <TabsContent value="vehicles" className="mt-6">
                        {customerVehicles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {customerVehicles.map((vehicle) => (
                                    <Card key={vehicle.id} className="bg-[#1A1A1A] border-[#333] text-white">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-xl">
                                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                                </CardTitle>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {vehicle.color && (
                                                <CardDescription className="text-gray-400">
                                                    Color: {vehicle.color}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-3 py-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-gray-400 text-sm">VIN</p>
                                                    <p className="font-mono text-sm">{vehicle.vin || 'Not recorded'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 text-sm">License Plate</p>
                                                    <p>{vehicle.license_plate || 'Not recorded'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 text-sm">Mileage</p>
                                                    <div className="flex items-center">
                                                        <Gauge className="h-4 w-4 mr-1 text-gray-400" />
                                                        <p>{vehicle.mileage ? `${vehicle.mileage} mi` : 'Not recorded'}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400 text-sm">Next Service</p>
                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                                        <p>{vehicle.next_service_date ? new Date(vehicle.next_service_date).toLocaleDateString() : 'Not scheduled'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t border-[#333] pt-3">
                                            <Button 
                                                variant="outline" 
                                                className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white w-full"
                                            >
                                                Service History
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-[#1A1A1A] rounded-lg border border-[#333]">
                                <Car className="h-12 w-12 text-gray-500 mb-3" />
                                <h3 className="text-xl font-semibold mb-2">No Vehicles</h3>
                                <p className="text-gray-400 text-center mb-4">This customer doesn't have any vehicles on record.</p>
                                <Button className="bg-[#b22222] hover:bg-[#e23232] text-white">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Vehicle
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* Work Order History Tab */}
                    <TabsContent value="history" className="mt-6">
                        {workOrders.length > 0 ? (
                            <div className="space-y-4">
                                {workOrders.map((order) => (
                                    <Card key={order.id} className="bg-[#1A1A1A] border-[#333] text-white overflow-hidden">
                                        <div className={`h-1 ${getStatusColor(order.status)}`}></div>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg flex items-center">
                                                        <Wrench className="h-4 w-4 mr-2" />
                                                        {order.repair_order_details?.[0]?.description || 'Work Order'}
                                                    </CardTitle>
                                                    <CardDescription className="mt-1 text-gray-400">
                                                        {order.customer_vehicles?.[0]?.year} {order.customer_vehicles?.[0]?.make} {order.customer_vehicles?.[0]?.model}
                                                    </CardDescription>
                                                </div>
                                                <Badge className={getStatusColor(order.status).replace('bg-', 'bg-opacity-20 text-').replace('500', '400')}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="py-0">
                                            <div className="text-sm text-gray-400">
                                                <div className="flex justify-between mb-1">
                                                    <span>Created:</span>
                                                    <span>{formatDate(order.created_at)}</span>
                                                </div>
                                                {order.completed_at && (
                                                    <div className="flex justify-between">
                                                        <span>Completed:</span>
                                                        <span>{formatDate(order.completed_at)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t border-[#333] mt-3 pt-3">
                                            <Button 
                                                variant="ghost" 
                                                className="text-gray-300 hover:text-white hover:bg-[#292929] w-full"
                                                onClick={() => router.push(`/work-orders/${order.id}`)}
                                            >
                                                View Details
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-[#1A1A1A] rounded-lg border border-[#333]">
                                <History className="h-12 w-12 text-gray-500 mb-3" />
                                <h3 className="text-xl font-semibold mb-2">No Work History</h3>
                                <p className="text-gray-400 text-center mb-4">This customer doesn't have any work orders yet.</p>
                                <Button className="bg-[#b22222] hover:bg-[#e23232] text-white">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Work Order
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* Messages Tab */}
                    <TabsContent value="messages" className="mt-6">
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
                    </TabsContent>
                    
                    {/* Appointments Tab */}
                    <TabsContent value="appointments" className="mt-6">
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
                    </TabsContent>
                </Tabs>
            </main>
            
            {/* Floating Action Button (Mobile Only) */}
            <div className="fixed right-6 bottom-20 md:hidden">
                <Button 
                    className="h-14 w-14 rounded-full bg-[#b22222] hover:bg-[#e23232] text-white shadow-lg"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
            
            {/* Mobile Bottom Navigation */}
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
            </div>
        </div>
    )
}

