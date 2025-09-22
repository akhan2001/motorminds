'use client'

import { useState, useMemo } from 'react'
import { Nav } from '@/app/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    Calendar,
    CalendarDays, 
    Clock, 
    AlertCircle,
    Plus,
    Users,
    TrendingUp,
    FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../hooks/use-auth'
// import { useOperationsDashboard } from '../hooks/appointments/useOperationsDashboard' // Disabled for now
import { useAppointments } from '../hooks/appointments/useAppointments'
import { MonthCard } from '../components/appointments/Calendar/MonthCard'
import { AppointmentForm } from '../components/appointments/AppointmentForm'
import { AppointmentHeader } from '../components/appointments/appointment-header'
import { AppointmentDetailsCard } from '../components/appointments/appointmentDetailsCard'
import type { AppointmentWithDetails } from '../types/appointment'

export default function AppointmentsPage() {
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()
    
    // State
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
    const [selectedDateForForm, setSelectedDateForForm] = useState<string>()
    const [selectedTimeForForm, setSelectedTimeForForm] = useState<string>()
    const [showForm, setShowForm] = useState(false)
    const [showAppointmentDetails, setShowAppointmentDetails] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    
    // Data fetching - operations dashboard disabled for now
    // const { data: dashboardData, isLoading: dashboardLoading } = useOperationsDashboard(shopId || '')
    const dashboardData = null
    const dashboardLoading = false
    
    // Fetch appointments for the selected date
    const selectedDateString = useMemo(() => {
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }, [selectedDate])
    
    const { data: selectedDateAppointments, isLoading: appointmentsLoading } = useAppointments(shopId || '', {
        start: selectedDateString,
        end: selectedDateString
    })
    
    // Combined loading state
    const isLoading = authLoading // dashboardLoading disabled
    const error = authError

    // Calculate stats - disabled for now, using mock data
    const stats = useMemo(() => {
        // Mock stats data since operations dashboard is disabled
        return {
            todayCount: 0,
            weekCount: 0,
            pendingWorkOrders: 0,
            inProgressWorkOrders: 0,
            todayRevenue: 0,
            weekRevenue: 0
        }
    }, [])

    // Sort appointments for selected date by time
    const sortedSelectedDateAppointments = useMemo(() => {
        if (!selectedDateAppointments) return []
        return [...selectedDateAppointments].sort((a, b) => {
            const timeA = a.start_time || '09:00'
            const timeB = b.start_time || '09:00'
            return timeA.localeCompare(timeB)
        })
    }, [selectedDateAppointments])

    // Handlers
    const handleDateSelect = (date: string) => {
        // Create date without timezone conversion by parsing the components
        const [year, month, day] = date.split('-').map(Number)
        setSelectedDate(new Date(year, month - 1, day)) // month is 0-indexed
        setSelectedDateForForm(date)
        setShowForm(false) // Don't show form automatically when date is selected
        setShowAppointmentDetails(false) // Hide appointment details when date changes
    }

    const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
        setSelectedAppointment(appointment)
        setShowAppointmentDetails(true)
        setShowForm(false) // Hide form if it's open
    }

    const handleCreateAppointment = (date: string, time?: string) => {
        setSelectedDateForForm(date)
        setSelectedTimeForForm(time)
        // Create date without timezone conversion by parsing the components
        const [year, month, day] = date.split('-').map(Number)
        setSelectedDate(new Date(year, month - 1, day)) // month is 0-indexed
        setShowForm(true) // Show form when creating appointment
        setShowAppointmentDetails(false) // Hide appointment details if open
    }

    const handleShowNewAppointmentForm = () => {
        // Format date without timezone issues
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`
        setSelectedDateForForm(dateString)
        setSelectedTimeForForm(undefined)
        setShowForm(true)
        setShowAppointmentDetails(false) // Hide appointment details if open
    }

    const handleHideForm = () => {
        setShowForm(false)
        setSelectedDateForForm(undefined)
        setSelectedTimeForForm(undefined)
    }

    const handleAppointmentSuccess = () => {
        // Clear form selections and refresh data
        setSelectedDateForForm(undefined)
        setSelectedTimeForForm(undefined)
        setShowForm(false) // Hide form after successful creation
        // The queries will automatically refetch due to cache invalidation
    }

    const handleCloseAppointmentDetails = () => {
        setShowAppointmentDetails(false)
        setSelectedAppointment(null)
    }

    const handleEditAppointment = (appointment: AppointmentWithDetails) => {
        // TODO: Implement edit appointment functionality
        console.log('Edit appointment:', appointment)
        // For now, close details and could open form in edit mode
        setShowAppointmentDetails(false)
    }

    const handleCancelAppointment = (appointmentId: string) => {
        // TODO: Implement cancel appointment functionality
        console.log('Cancel appointment:', appointmentId)
    }

    const handleMessageCustomer = (customer: AppointmentWithDetails['customer']) => {
        // TODO: Implement message customer functionality
        console.log('Message customer:', customer)
    }

    const handleCreateWorkOrder = (appointmentId: string) => {
        // TODO: Implement create work order from appointment
        console.log('Create work order for appointment:', appointmentId)
    }

    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        // TODO: Implement search functionality
    }

    const handleCustomersClick = () => {
        // TODO: Navigate to customers page or open customers modal
        console.log('Navigate to customers')
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <Clock className="h-6 w-6 animate-spin text-blue-500" />
                            <div>
                                <p className="text-white font-medium">Loading Appointments</p>
                                <p className="text-gray-400 text-sm">Fetching calendar data...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-white font-medium">Failed to Load Appointments</p>
                                <p className="text-gray-400 text-sm mb-3">
                                    {error && typeof error === 'object' && 'message' in error ? (error as Error).message : 'Unknown error occurred'}
                                </p>
                                <Button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Don't render main content if we don't have authentication data
    if (!shopId || !user) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            <div>
                                <p className="text-white font-medium">Authentication Required</p>
                                <p className="text-gray-400 text-sm">
                                    Unable to access appointments. Please ensure you are logged in.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            
            <AppointmentHeader
                onNewAppointment={handleShowNewAppointmentForm}
                onCustomersClick={handleCustomersClick}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
            />

            {/* Main Content - Resizable Layout */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Calendar Panel - 70% */}
                    <ResizablePanel defaultSize={70} minSize={60} maxSize={80}>
                        <div className="h-full p-4">
                            <MonthCard
                                selectedDate={selectedDate}
                                shopId={shopId}
                                onDateSelect={handleDateSelect}
                                onAppointmentClick={handleAppointmentClick}
                                onCreateAppointment={handleCreateAppointment}
                                onMonthChange={setSelectedDate}
                            />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right Panel - 30% */}
                    <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                        <div className="h-full p-4">
                            {showAppointmentDetails && selectedAppointment ? (
                                // State 4: Appointment Details
                                <AppointmentDetailsCard
                                    appointment={selectedAppointment}
                                    onClose={handleCloseAppointmentDetails}
                                    onEdit={handleEditAppointment}
                                    onCancel={handleCancelAppointment}
                                    onMessageCustomer={handleMessageCustomer}
                                    onCreateWorkOrder={handleCreateWorkOrder}
                                />
                            ) : showForm ? (
                                // State 3: New Appointment Form
                                <AppointmentForm
                                    shopId={shopId}
                                    selectedDate={selectedDateForForm}
                                    selectedTime={selectedTimeForForm}
                                    onSuccess={handleAppointmentSuccess}
                                    onClose={handleHideForm}
                                />
                            ) : sortedSelectedDateAppointments.length > 0 ? (
                                // State 2: Appointments List for Selected Date
                                <Card className="bg-[#1a1a1a] border-[#2a2a2a] h-full">
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-medium text-white">
                                                {format(selectedDate, 'EEEE, MMMM d')}
                                            </h3>
                                            <Button 
                                                onClick={handleShowNewAppointmentForm}
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add
                                            </Button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {sortedSelectedDateAppointments.map((appointment) => (
                                                <div
                                                    key={appointment.id}
                                                    onClick={() => handleAppointmentClick(appointment)}
                                                    className="p-3 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-sm font-medium text-white">
                                                            {appointment.start_time} - {appointment.end_time}
                                                        </div>
                                                        <div className={`
                                                            w-2 h-2 rounded-full
                                                            ${appointment.status === 'confirmed' ? 'bg-green-500' :
                                                              appointment.status === 'in_progress' ? 'bg-blue-500' :
                                                              appointment.status === 'completed' ? 'bg-emerald-500' :
                                                              appointment.status === 'cancelled' ? 'bg-red-500' :
                                                              'bg-yellow-500'}
                                                        `} />
                                                    </div>
                                                    <div className="text-sm text-white mb-1">
                                                        {appointment.customer.customer_name}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mb-1">
                                                        {appointment.vehicle.year} {appointment.vehicle.make} {appointment.vehicle.model}
                                                    </div>
                                                    <div className="text-xs text-gray-300">
                                                        {appointment.service_type}
                                                    </div>
                                                    {appointment.notes && (
                                                        <div className="text-xs text-gray-400 mt-2 italic">
                                                            {appointment.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                // State 1: Empty Panel - No Appointments
                                <Card className="bg-[#1a1a1a] border-[#2a2a2a] h-full">
                                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                        <div className="mb-6">
                                            <CalendarDays className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-white mb-2">
                                                No Appointments
                                            </h3>
                                            <p className="text-gray-400 text-sm max-w-xs">
                                                No appointments scheduled for {format(selectedDate, 'MMMM d, yyyy')}. 
                                                Click below to create one.
                                            </p>
                                        </div>
                                        
                                        <Button 
                                            onClick={handleShowNewAppointmentForm}
                                            className="bg-blue-600 hover:bg-blue-700 text-white mb-6"
                                            size="lg"
                                        >
                                            <Plus className="h-5 w-5 mr-2" />
                                            Add New Appointment
                                        </Button>

                                        {/* Quick Stats */}
                                        {stats && (
                                            <div className="w-full space-y-4 border-t border-[#2a2a2a] pt-6">
                                                <h4 className="text-sm font-medium text-white">Today's Overview</h4>
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarDays className="h-4 w-4 text-blue-400" />
                                                                <span className="text-sm text-gray-300">Today</span>
                                                            </div>
                                                            <span className="text-lg font-bold text-blue-400">{stats.todayCount}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-yellow-400" />
                                                                <span className="text-sm text-gray-300">Pending</span>
                                                            </div>
                                                            <span className="text-lg font-bold text-yellow-400">{stats.pendingWorkOrders}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
