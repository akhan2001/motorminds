'use client'

import { useState, useMemo } from 'react'

type CalendarViewType = 'day' | 'week' | 'month'
import { PageLoading, PageError, PageAuthRequired } from '@/components/common/feedback/page-states'
import { useAuth } from '../hooks/use-auth'
import { useAppointments, useCreateWorkOrderFromAppointment, useCancelAppointment } from '../hooks/appointments/useAppointments'
import { CalendarView } from '../components/appointments/Calendar/CalendarView'
import { AppointmentForm } from '../components/appointments/AppointmentForm'
import { DayAppointmentsDialog } from '../components/appointments/DayAppointmentsDialog'
import { AppointmentDetailsSheet } from '../components/appointments/AppointmentDetailsSheet'
import { AppointmentHeader } from '../components/appointments/appointment-header'
import type { AppointmentWithDetails } from '../types/appointment'

export default function AppointmentsPage() {
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()
    
    // State
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedDateForForm, setSelectedDateForForm] = useState<string>()
    const [selectedTimeForForm, setSelectedTimeForForm] = useState<string>()
    const [currentView, setCurrentView] = useState<CalendarViewType>('month')
    
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
    const handleDateSelect = (date: string, currentView?: string) => {
        // Create date without timezone conversion by parsing the components
        const [year, month, day] = date.split('-').map(Number)
        setSelectedDate(new Date(year, month - 1, day)) // month is 0-indexed
        
        // Only show the day dialog in week view
        // In day and month views, appointments are already visible
        if (currentView === 'week') {
            setSelectedDayForDialog(date)
            setIsDayDialogOpen(true)
        }
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

    const handleSlotClick = (date: string, time: string) => {
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


    const handleCustomersClick = () => {
        // TODO: Navigate to customers page or open customers modal
        console.log('Navigate to customers')
    }

    // Loading state
    if (isLoading) {
        return <PageLoading title="Loading Appointments" description="Fetching calendar data..." />
    }

    // Error state
    if (error) {
        const errorMessage = error && typeof error === 'object' && 'message' in error 
            ? (error as Error).message 
            : String(error)
        return <PageError title="Failed to Load Appointments" error={errorMessage} />
    }

    // Auth required state
    if (!shopId || !user) {
        return <PageAuthRequired resource="appointments" />
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <AppointmentHeader
                onNewAppointment={handleShowNewAppointmentForm}
                onCustomersClick={handleCustomersClick}
                currentView={currentView}
                onViewChange={setCurrentView}
            />

            {/* Main Content - Calendar */}
            <div className="flex-1 overflow-hidden">
                <CalendarView
                    selectedDate={selectedDate}
                    shopId={shopId}
                    onDateSelect={handleDateSelect}
                    onAppointmentClick={handleAppointmentClick}
                    onCreateAppointment={handleCreateAppointment}
                    onSlotClick={handleSlotClick}
                    onMonthChange={setSelectedDate}
                    onWeekChange={setSelectedDate}
                    onNewAppointment={handleShowNewAppointmentForm}
                    onCustomersClick={handleCustomersClick}
                    currentView={currentView}
                    onViewChange={setCurrentView}
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
