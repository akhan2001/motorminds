'use client'

import { useState, useMemo } from 'react'
import { Nav } from '@/app/components/nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/feedback/loading-states'
import { useAuth } from '../hooks/use-auth'
// import { useOperationsDashboard } from '../hooks/appointments/useOperationsDashboard' // Disabled for now
import { useAppointments, useCreateWorkOrderFromAppointment, useCancelAppointment } from '../hooks/appointments/useAppointments'
import { MonthCard } from '../components/appointments/Calendar/MonthCard'
import { AppointmentForm } from '../components/appointments/AppointmentForm'
import { AppointmentHeader } from '../components/appointments/appointment-header'
import { DayAppointmentsDialog } from '../components/appointments/DayAppointmentsDialog'
import { AppointmentDetailsSheet } from '../components/appointments/AppointmentDetailsSheet'
import type { AppointmentWithDetails } from '../types/appointment'

export default function AppointmentsPage() {
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()
    
    // State
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedDateForForm, setSelectedDateForForm] = useState<string>()
    const [selectedTimeForForm, setSelectedTimeForForm] = useState<string>()
    const [searchValue, setSearchValue] = useState('')
    
    // Modal state
    const [isDayDialogOpen, setIsDayDialogOpen] = useState(false)
    const [selectedDayForDialog, setSelectedDayForDialog] = useState<string | null>(null)
    const [isAppointmentSheetOpen, setIsAppointmentSheetOpen] = useState(false)
    const [selectedAppointmentForSheet, setSelectedAppointmentForSheet] = useState<AppointmentWithDetails | null>(null)
    const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false)
    
    // Data fetching - operations dashboard disabled for now
    // const { data: dashboardData, isLoading: dashboardLoading } = useOperationsDashboard(shopId || '')
    const dashboardData = null
    const dashboardLoading = false
    
    // Work order creation
    const createWorkOrder = useCreateWorkOrderFromAppointment()
    
    // Cancel appointment
    const cancelAppointment = useCancelAppointment()
    
    // Fetch appointments for the selected day dialog
    const { data: dayDialogAppointments } = useAppointments(shopId || '', selectedDayForDialog ? {
        start: selectedDayForDialog,
        end: selectedDayForDialog
    } : undefined)
    
    // Combined loading state
    const isLoading = authLoading
    const error = authError

    // Sort appointments for day dialog by time
    const sortedDayDialogAppointments = useMemo(() => {
        if (!dayDialogAppointments) return []
        return [...dayDialogAppointments].sort((a, b) => {
            const timeA = a.start_time || '09:00'
            const timeB = b.start_time || '09:00'
            return timeA.localeCompare(timeB)
        })
    }, [dayDialogAppointments])

    // Handlers
    const handleDateSelect = (date: string) => {
        // Create date without timezone conversion by parsing the components
        const [year, month, day] = date.split('-').map(Number)
        setSelectedDate(new Date(year, month - 1, day)) // month is 0-indexed
        // Open day dialog
        setSelectedDayForDialog(date)
        setIsDayDialogOpen(true)
    }

    const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
        // Open appointment sheet
        setSelectedAppointmentForSheet(appointment)
        setIsAppointmentSheetOpen(true)
    }

    const handleCreateAppointment = (date: string, time?: string) => {
        setSelectedDateForForm(date)
        setSelectedTimeForForm(time)
        // Create date without timezone conversion by parsing the components
        const [year, month, day] = date.split('-').map(Number)
        setSelectedDate(new Date(year, month - 1, day)) // month is 0-indexed
        // Open form dialog
        setIsAppointmentFormOpen(true)
    }

    const handleShowNewAppointmentForm = () => {
        // Format date without timezone issues
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`
        setSelectedDateForForm(dateString)
        setSelectedTimeForForm(undefined)
        // Open form dialog
        setIsAppointmentFormOpen(true)
    }

    const handleAppointmentSuccess = () => {
        // Clear form selections and refresh data
        setSelectedDateForForm(undefined)
        setSelectedTimeForForm(undefined)
        setIsAppointmentFormOpen(false) // Close form dialog after successful creation
        // The queries will automatically refetch due to cache invalidation
    }

    const handleCancelAppointment = (appointmentId: string) => {
        cancelAppointment.mutate(appointmentId)
        // Close appointment sheet if this appointment is being viewed
        if (selectedAppointmentForSheet?.id === appointmentId) {
            setSelectedAppointmentForSheet(null)
            setIsAppointmentSheetOpen(false)
        }
    }

    const handleCloseAppointmentDetails = () => {
        setIsAppointmentSheetOpen(false)
        setSelectedAppointmentForSheet(null)
    }

    const handleEditAppointment = (appointment: AppointmentWithDetails) => {
        // TODO: Implement edit appointment functionality
        console.log('Edit appointment:', appointment)
        // For now, close sheet and could open form in edit mode
        setIsAppointmentSheetOpen(false)
        setSelectedAppointmentForSheet(null)
    }

    const handleMessageCustomer = (customer: AppointmentWithDetails['customer']) => {
        // TODO: Implement message customer functionality
        console.log('Message customer:', customer)
    }

    const handleCreateWorkOrder = async (appointmentId: string) => {
        try {
            const workOrderId = await createWorkOrder.mutateAsync(appointmentId)
            
            // Refetch the appointment to get the updated data with work order
            if (selectedAppointmentForSheet) {
                // Update the local state with work order info
                setSelectedAppointmentForSheet(prev => prev ? {
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
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <LoadingSpinner size="md" className="text-blue-500" />
                            <div>
                                <p className="text-foreground font-medium">Loading Appointments</p>
                                <p className="text-muted-foreground text-sm">Fetching calendar data...</p>
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
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-foreground font-medium">Failed to Load Appointments</p>
                                <p className="text-muted-foreground text-sm mb-3">
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
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            <div>
                                <p className="text-foreground font-medium">Authentication Required</p>
                                <p className="text-muted-foreground text-sm">
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
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            
            <AppointmentHeader
                onNewAppointment={handleShowNewAppointmentForm}
                onCustomersClick={handleCustomersClick}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
            />

            {/* Main Content - Calendar with Large Horizontal Padding */}
            <div className="flex-1 overflow-hidden px-12">
                <MonthCard
                    selectedDate={selectedDate}
                    shopId={shopId}
                    onDateSelect={handleDateSelect}
                    onAppointmentClick={handleAppointmentClick}
                    onCreateAppointment={handleCreateAppointment}
                    onMonthChange={setSelectedDate}
                />
            </div>

            {/* Modals */}
            <DayAppointmentsDialog
                isOpen={isDayDialogOpen}
                onClose={() => {
                    setIsDayDialogOpen(false)
                    setSelectedDayForDialog(null)
                }}
                selectedDate={selectedDayForDialog || ''}
                appointments={sortedDayDialogAppointments}
                onAppointmentClick={handleAppointmentClick}
                onCreateAppointment={handleCreateAppointment}
            />

            {selectedAppointmentForSheet && (
                <AppointmentDetailsSheet
                    isOpen={isAppointmentSheetOpen}
                    onClose={handleCloseAppointmentDetails}
                    appointment={selectedAppointmentForSheet}
                    onEdit={handleEditAppointment}
                    onCancel={handleCancelAppointment}
                    onMessageCustomer={handleMessageCustomer}
                    onCreateWorkOrder={handleCreateWorkOrder}
                    isCreatingWorkOrder={createWorkOrder.isPending}
                />
            )}

            <AppointmentForm
                isOpen={isAppointmentFormOpen}
                onClose={() => setIsAppointmentFormOpen(false)}
                shopId={shopId}
                selectedDate={selectedDateForForm}
                selectedTime={selectedTimeForForm}
                onSuccess={handleAppointmentSuccess}
            />
        </div>
    )
}
