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
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/use-auth'
// import { useOperationsDashboard } from '../hooks/appointments/useOperationsDashboard' // Disabled for now
import { useAppointments, useCreateWorkOrderFromAppointment, useCancelAppointment } from '../hooks/appointments/useAppointments'
import { MonthCard } from '../components/appointments/Calendar/MonthCard'
import { AppointmentForm } from '../components/appointments/AppointmentForm'
import { AppointmentHeader } from '../components/appointments/appointment-header'
import { AppointmentDetailsCard } from '../components/appointments/appointmentDetailsCard'
import { AppointmentsList } from '../components/appointments/AppointmentsList'
import type { AppointmentWithDetails } from '../types/appointment'

export default function AppointmentsPage() {
    // Navigation
    const router = useRouter()
    
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
    
    // Work order creation
    const createWorkOrder = useCreateWorkOrderFromAppointment()
    
    // Cancel appointment
    const cancelAppointment = useCancelAppointment()
    
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

    const handleCancelAppointment = (appointmentId: string) => {
        cancelAppointment.mutate(appointmentId)
        // Close appointment details if this appointment is being viewed
        if (selectedAppointment?.id === appointmentId) {
            setSelectedAppointment(null)
            setShowAppointmentDetails(false)
        }
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

    const handleMessageCustomer = (customer: AppointmentWithDetails['customer']) => {
        // TODO: Implement message customer functionality
        console.log('Message customer:', customer)
    }

    const handleCreateWorkOrder = async (appointmentId: string) => {
        try {
            const workOrderId = await createWorkOrder.mutateAsync(appointmentId)
            
            // Refetch the appointment to get the updated data with work order
            if (selectedAppointment) {
                // Update the local state with work order info
                setSelectedAppointment(prev => prev ? {
                    ...prev,
                    status: 'in_progress',
                    work_order: {
                        id: workOrderId,
                        work_order_number: `WO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${workOrderId.slice(-4)}`,
                        status: 'pending'
                    }
                } : null)
            }
        } catch (error) {
            console.error('Failed to create work order:', error)
            // Error is already handled by the mutation hook
        }
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
                                    isCreatingWorkOrder={createWorkOrder.isPending}
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
                                <AppointmentsList
                                    selectedDate={selectedDate}
                                    appointments={sortedSelectedDateAppointments}
                                    onAddAppointment={handleShowNewAppointmentForm}
                                    onAppointmentClick={handleAppointmentClick}
                                    onCancelAppointment={handleCancelAppointment}
                                    cancellingAppointmentId={cancelAppointment.isPending ? cancelAppointment.variables : undefined}
                                />
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
