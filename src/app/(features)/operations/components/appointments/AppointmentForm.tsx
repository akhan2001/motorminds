'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TimeSelect } from '@/components/ui/time-select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    Calendar,
    Clock,
    User,
    Save,
    X,
    AlertCircle
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useAvailableSlots } from '../../hooks/appointments/useAvailbility'
import { useCreateAppointment, useCreateWalkInAppointment } from '../../hooks/appointments/useAppointments'
import { CustomerInformation } from '../work-orders/shared/customer-information'
import { VehicleInformation } from '../work-orders/shared/vehicle-information'
import { WalkInVehicleForm } from '../work-orders/create/WalkInVehicleForm'
import type { AppointmentCreateData } from '../../types/appointment'
import type { WalkInVehicleInfo } from '../../../customers/types/vehicle'
import type { VehicleOption } from '../../../customers/types/vehicle'

interface AppointmentFormProps {
    shopId: string
    isOpen: boolean
    onClose: () => void
    selectedDate?: string
    selectedTime?: string
    onSuccess?: () => void
}

const SERVICE_TYPES = [
    'Oil Change',
    'Brake Service',
    'Tire Service',
    'Engine Diagnostic',
    'Transmission Service',
    'A/C Service',
    'Battery Service',
    'Inspection',
    'General Repair',
    'Maintenance',
    'Other'
]

export function AppointmentForm({
    shopId,
    isOpen,
    onClose,
    selectedDate,
    selectedTime,
    onSuccess
}: AppointmentFormProps) {
    // Form state
    const [formData, setFormData] = useState({
        // Appointment details
        appointmentDate: selectedDate || format(new Date(), 'yyyy-MM-dd'),
        startTime: selectedTime || '',
        endTime: '',
        serviceType: [] as string[],
        notes: '',
    })

    // Calculate end time (standard 60 minutes)
    const calculateEndTime = (startTime: string) => {
        if (!startTime) return ''

        const [hours, minutes] = startTime.split(':').map(Number)
        const startMinutes = hours * 60 + minutes
        const endMinutes = startMinutes + 60 // Standard 60-minute appointment

        const endHours = Math.floor(endMinutes / 60)
        const endMins = endMinutes % 60

        return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
    }

    // Update form data when selectedDate prop changes
    useEffect(() => {
        if (selectedDate && isOpen) {
            setFormData(prev => ({
                ...prev,
                appointmentDate: selectedDate
            }))
        }
    }, [selectedDate, isOpen])

    // Update form data when selectedTime prop changes
    useEffect(() => {
        if (selectedTime && isOpen) {
            setFormData(prev => ({
                ...prev,
                startTime: selectedTime,
                endTime: calculateEndTime(selectedTime)
            }))
        }
    }, [selectedTime, isOpen])

    // Customer type selection
    const [customerType, setCustomerType] = useState<'registered' | 'walk_in'>('registered')

    // Customer state (for CustomerInformation component)
    const [customerId, setCustomerId] = useState<string>('')
    const [customerName, setCustomerName] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerAddress, setCustomerAddress] = useState('')

    // Vehicle state (for VehicleInformation component)
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
    const [vehicleYear, setVehicleYear] = useState('')
    const [vehicleMake, setVehicleMake] = useState('')
    const [vehicleModel, setVehicleModel] = useState('')
    const [vehicleColor, setVehicleColor] = useState('')
    const [vehicleVin, setVehicleVin] = useState('')
    const [vehicleLicensePlate, setVehicleLicensePlate] = useState('')
    const [vehicleMileage, setVehicleMileage] = useState('')

    // Walk-in vehicle state
    const [walkInVehicleInfo, setWalkInVehicleInfo] = useState<WalkInVehicleInfo>({
        year: new Date().getFullYear(),
        make: '',
        model: '',
        license_plate: '',
        color: '',
        vin: '',
        mileage: 0
    })
    const [walkInVehicleId, setWalkInVehicleId] = useState<string | null>(null)

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [customServiceType, setCustomServiceType] = useState('')
    const [showCustomServiceInput, setShowCustomServiceInput] = useState(false)



    // Fetch available slots for the selected date
    const {
        data: availableSlots,
        isLoading: slotsLoading
    } = useAvailableSlots(shopId, formData.appointmentDate)

    // Create appointment mutations
    const createAppointment = useCreateAppointment()
    const createWalkInAppointment = useCreateWalkInAppointment()

    // Handle form field changes
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value }

            // Auto-calculate end time when start time changes
            if (field === 'startTime') {
                updated.endTime = calculateEndTime(value)
            }

            return updated
        })

        // Mark as having unsaved changes
        setHasUnsavedChanges(true)

        // Clear field error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    // Handle service type multi-select
    const handleServiceTypeToggle = (serviceType: string) => {
        if (serviceType === 'Other') {
            // Show custom input for "Other"
            setShowCustomServiceInput(true)
            return
        }

        setFormData(prev => {
            const currentServices = prev.serviceType as string[]
            const isSelected = currentServices.includes(serviceType)

            const updatedServices = isSelected
                ? currentServices.filter(service => service !== serviceType)
                : [...currentServices, serviceType]

            return { ...prev, serviceType: updatedServices }
        })

        // Mark as having unsaved changes
        setHasUnsavedChanges(true)

        // Clear field error when user makes selection
        if (errors.serviceType) {
            setErrors(prev => ({ ...prev, serviceType: '' }))
        }
    }

    // Handle custom service type addition
    const handleAddCustomServiceType = () => {
        if (customServiceType.trim()) {
            setFormData(prev => {
                const currentServices = prev.serviceType as string[]
                if (!currentServices.includes(customServiceType.trim())) {
                    return { ...prev, serviceType: [...currentServices, customServiceType.trim()] }
                }
                return prev
            })
            setCustomServiceType('')
            setShowCustomServiceInput(false)
            setHasUnsavedChanges(true)
            
            // Clear field error
            if (errors.serviceType) {
                setErrors(prev => ({ ...prev, serviceType: '' }))
            }
        }
    }


    // Handler for CustomerInformation field changes
    const handleCustomerFieldChange = (field: string, value: string) => {
        switch (field) {
            case 'customer':
                setCustomerName(value)
                break
            case 'customerEmail':
                setCustomerEmail(value)
                break
            case 'customerPhone':
                setCustomerPhone(value)
                break
            case 'customerAddress':
                setCustomerAddress(value)
                break
        }
        setHasUnsavedChanges(true)
    }

    // Handler for CustomerInformation customer change (selection or new)
    const handleCustomerChange = (newCustomerId: string) => {
        setCustomerId(newCustomerId)
        // Reset vehicle selection when customer changes
        setSelectedVehicleId('')
        setVehicleYear('')
        setVehicleMake('')
        setVehicleModel('')
        setVehicleColor('')
        setVehicleVin('')
        setVehicleLicensePlate('')
        setVehicleMileage('')
        setHasUnsavedChanges(true)
        // Clear customer-related errors
        setErrors(prev => ({ ...prev, customer: '', vehicle: '' }))
    }

    // Handler for CustomerInformation customer saved (new customer created)
    const handleCustomerSaved = (newCustomerId: string, customerData: any) => {
        setCustomerId(newCustomerId)
        setCustomerName(customerData.name || '')
        setCustomerEmail(customerData.email || '')
        setCustomerPhone(customerData.phone || '')
        setCustomerAddress(customerData.address || '')
        setHasUnsavedChanges(true)
        // Clear customer-related errors
        setErrors(prev => ({ ...prev, customer: '' }))
    }

    // Handler for VehicleInformation field changes
    const handleVehicleFieldChange = (field: string, value: string) => {
        switch (field) {
            case 'vehicleYear':
                setVehicleYear(value)
                break
            case 'vehicleMake':
                setVehicleMake(value)
                break
            case 'vehicleModel':
                setVehicleModel(value)
                break
            case 'vehicleColor':
                setVehicleColor(value)
                break
            case 'vehicleVin':
                setVehicleVin(value)
                break
            case 'vehicleLicensePlate':
                setVehicleLicensePlate(value)
                break
            case 'vehicleMileage':
                setVehicleMileage(value)
                break
        }
        setHasUnsavedChanges(true)
    }

    // Handler for VehicleInformation vehicle selection
    const handleVehicleSelect = (vehicleId: string, vehicleData?: VehicleOption) => {
        setSelectedVehicleId(vehicleId)
        if (vehicleData) {
            setVehicleYear(vehicleData.year?.toString() || '')
            setVehicleMake(vehicleData.make || '')
            setVehicleModel(vehicleData.model || '')
            setVehicleColor(vehicleData.color || '')
            setVehicleVin(vehicleData.vin || '')
            setVehicleLicensePlate(vehicleData.licensePlate || '')
            setVehicleMileage('')
        } else if (vehicleId === 'new') {
            // Clear fields for new vehicle
            setVehicleYear('')
            setVehicleMake('')
            setVehicleModel('')
            setVehicleColor('')
            setVehicleVin('')
            setVehicleLicensePlate('')
            setVehicleMileage('')
        }
        setHasUnsavedChanges(true)
        // Clear vehicle-related errors
        setErrors(prev => ({ ...prev, vehicle: '' }))
    }

    // Handler for VehicleInformation vehicle saved (new vehicle created)
    const handleVehicleSaved = (newVehicleId: string, vehicleData: any) => {
        setSelectedVehicleId(newVehicleId)
        setVehicleYear(vehicleData.year?.toString() || '')
        setVehicleMake(vehicleData.make || '')
        setVehicleModel(vehicleData.model || '')
        setVehicleColor(vehicleData.color || '')
        setVehicleVin(vehicleData.vin || '')
        setVehicleLicensePlate(vehicleData.licensePlate || '')
        setVehicleMileage(vehicleData.mileage?.toString() || '')
        setHasUnsavedChanges(true)
        // Clear vehicle-related errors
        setErrors(prev => ({ ...prev, vehicle: '' }))
    }



    // Validate form
    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        // Required appointment fields
        if (!formData.appointmentDate) newErrors.appointmentDate = 'Date is required'
        if (!formData.startTime) newErrors.startTime = 'Start time is required'
        if (!formData.serviceType || formData.serviceType.length === 0) newErrors.serviceType = 'At least one service type is required'

        // Customer validation based on type
        if (customerType === 'registered') {
            // Registered customer validation - must have a valid customer ID (not empty and not "new")
            if (!customerId || customerId === 'new') {
                newErrors.customer = 'Customer is required (please save customer first)'
            }

            // Vehicle validation for registered customers - must have a valid vehicle ID (not empty and not "new")
            if (!selectedVehicleId || selectedVehicleId === 'new') {
                newErrors.vehicle = 'Vehicle is required (please save vehicle first)'
            }
        } else {
            // Walk-in vehicle validation
            if (!walkInVehicleInfo.year || !walkInVehicleInfo.make ||
                !walkInVehicleInfo.model || !walkInVehicleInfo.license_plate) {
                newErrors.walkInVehicle = 'Vehicle information (year, make, model, license plate) is required'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Get customer ID - customer should already be saved via CustomerInformation component
    const getCustomerId = (): string => {
        if (customerId && customerId !== 'new') {
            return customerId
        }
        throw new Error('Customer must be saved before creating appointment')
    }

    // Get vehicle ID - vehicle should already be saved via VehicleInformation component
    const getVehicleId = (): string => {
        if (selectedVehicleId && selectedVehicleId !== 'new') {
            return selectedVehicleId
        }
        throw new Error('Vehicle must be saved before creating appointment')
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        try {
            if (customerType === 'walk_in') {
                // Create walk-in appointment
                await createWalkInAppointment.mutateAsync({
                    appointment: {
                        shop_id: shopId,
                        appointment_date: formData.appointmentDate,
                        start_time: formData.startTime,
                        end_time: formData.endTime,
                        service_type: formData.serviceType.join(', '),
                        notes: formData.notes || undefined,
                        status: 'scheduled',
                        created_by_customer: false,
                    },
                    walkInVehicleInfo: walkInVehicleInfo,
                    vehicleId: walkInVehicleId,
                })
            } else {
                // Create registered customer appointment
                const customerIdValue = getCustomerId()
                const vehicleIdValue = getVehicleId()

                const appointmentData: AppointmentCreateData = {
                    shop_id: shopId,
                    customer_id: customerIdValue,
                    vehicle_id: vehicleIdValue,
                    appointment_date: formData.appointmentDate,
                    start_time: formData.startTime,
                    end_time: formData.endTime,
                    service_type: formData.serviceType.join(', '),
                    notes: formData.notes || undefined,
                    status: 'scheduled',
                    created_by_customer: false,
                    customer_type: 'registered',
                }

                await createAppointment.mutateAsync(appointmentData)
            }

            onSuccess?.()

            // Reset form
            resetForm()
        } catch (error) {
            console.error('Failed to create appointment:', error)
            setErrors({ submit: error instanceof Error ? error.message : 'Failed to create appointment' })
        }
    }

    // Reset form helper
    const resetForm = () => {
        setFormData({
            appointmentDate: format(new Date(), 'yyyy-MM-dd'),
            startTime: '',
            endTime: '',
            serviceType: [],
            notes: '',
        })
        setCustomerType('registered')
        // Reset customer state
        setCustomerId('')
        setCustomerName('')
        setCustomerEmail('')
        setCustomerPhone('')
        setCustomerAddress('')
        // Reset vehicle state
        setSelectedVehicleId('')
        setVehicleYear('')
        setVehicleMake('')
        setVehicleModel('')
        setVehicleColor('')
        setVehicleVin('')
        setVehicleLicensePlate('')
        setVehicleMileage('')
        // Reset walk-in state
        setWalkInVehicleInfo({
            year: new Date().getFullYear(),
            make: '',
            model: '',
            license_plate: '',
            color: '',
            vin: '',
            mileage: 0
        })
        setWalkInVehicleId(null)
        setHasUnsavedChanges(false)
        setShowCustomServiceInput(false)
        setCustomServiceType('')
        setErrors({})
    }

    // Generate next few days for quick date selection
    const quickDates = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const date = addDays(new Date(), i)
            return {
                value: format(date, 'yyyy-MM-dd'),
                label: format(date, i === 0 ? "'Today'" : i === 1 ? "'Tomorrow'" : 'EEE, MMM d'),
                isToday: i === 0
            }
        })
    }, [])

    // Handle dialog close - only allow via X button, not outside clicks
    const handleDialogClose = (open: boolean) => {
        // Prevent closing on outside click - only allow via X button
        if (!open) {
            return // Don't close on outside click
        }
    }

    // Handle explicit close (X button click)
    const handleExplicitClose = () => {
        if (hasUnsavedChanges) {
            const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?')
            if (!confirmed) {
                return
            }
        }
        // Reset form when closing
        resetForm()
        // Restore selected date if provided
        if (selectedDate) {
            setFormData(prev => ({ ...prev, appointmentDate: selectedDate }))
        }
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
            <DialogContent 
                className="max-w-4xl h-[90vh] bg-white dark:bg-[#1a1a1a] !grid-cols-1 flex flex-col !p-0 overflow-hidden [&>button]:!hidden"
                onInteractOutside={(e) => {
                    e.preventDefault() // Prevent closing on outside click
                }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault() // Prevent closing on ESC key
                }}
            >
                <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 relative">
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        New Appointment
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Create a new appointment for a customer
                    </DialogDescription>
                    <button
                        type="button"
                        onClick={handleExplicitClose}
                        className="custom-close-btn absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6">
                    <div className="pr-4 pb-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Submit Error */}
                            {errors.submit && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                    <p className="text-red-400 text-sm">{errors.submit}</p>
                                </div>
                            )}

                            {/* Appointment Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Appointment Details
                                </h3>

                                {/* Quick Date Selection */}
                                <div>
                                    <h3 className="text-muted-foreground text-xs mb-1">Quick Date Select</h3>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {quickDates.map((date) => (
                                            <Button
                                                key={date.value}
                                                type="button"
                                                variant={formData.appointmentDate === date.value ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => handleInputChange('appointmentDate', date.value)}
                                                className={`
                                                text-xs h-7
                                                ${formData.appointmentDate === date.value
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                                    }
                                                ${date.isToday ? 'ring-1 ring-blue-500/50' : ''}
                                            `}
                                            >
                                                {date.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Input */}
                                <div>
                                    <h3 className="text-muted-foreground text-xs mb-1">Date</h3>
                                    <Input
                                        type="date"
                                        value={formData.appointmentDate}
                                        onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                                        className="bg-background text-foreground border-border text-sm dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                    {errors.appointmentDate && (
                                        <p className="text-red-400 text-xs mt-1">{errors.appointmentDate}</p>
                                    )}
                                </div>

                                {/* Service Type */}
                                <div>
                                    <h3 className="text-muted-foreground text-xs mb-1">Service Type</h3>

                                    {/* Selected Services Display */}
                                    {formData.serviceType.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {formData.serviceType.map((service) => (
                                                <Badge
                                                    key={service}
                                                    variant="secondary"
                                                    className="bg-blue-600 text-white text-sm px-3 py-1.5 flex items-center gap-2 h-8"
                                                >
                                                    {service}
                                                    <X
                                                        className="h-4 w-4 cursor-pointer hover:text-red-300"
                                                        onClick={() => handleServiceTypeToggle(service)}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Service Type Selection - Dropdown */}
                                    <div className="space-y-2">
                                        <Select 
                                            onValueChange={handleServiceTypeToggle}
                                            value=""
                                        >
                                            <SelectTrigger className="bg-white dark:bg-[#1a1a1a] text-foreground border-border text-sm">
                                                <SelectValue placeholder="Add service type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-[#1a1a1a] border-border text-foreground">
                                                {SERVICE_TYPES.filter(service => service !== 'Other' && !formData.serviceType.includes(service)).map((service) => (
                                                    <SelectItem 
                                                        key={service} 
                                                        value={service}
                                                        className="hover:bg-accent dark:hover:bg-[#2a2a2a] cursor-pointer"
                                                    >
                                                        {service}
                                                    </SelectItem>
                                                ))}
                                                {!showCustomServiceInput && (
                                                    <SelectItem 
                                                        key="other-option"
                                                        value="Other"
                                                        className="hover:bg-accent dark:hover:bg-[#2a2a2a] cursor-pointer"
                                                    >
                                                        Other
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>

                                        {/* Custom Service Type Input (shown when "Other" is selected) */}
                                        {showCustomServiceInput && (
                                            <div className="flex gap-2">
                                                <Input
                                                    type="text"
                                                    value={customServiceType}
                                                    onChange={(e) => setCustomServiceType(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            handleAddCustomServiceType()
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setShowCustomServiceInput(false)
                                                            setCustomServiceType('')
                                                        }
                                                    }}
                                                    placeholder="Enter custom service type..."
                                                    className="bg-white dark:bg-[#1a1a1a] text-foreground border-border text-sm"
                                                    autoFocus
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={handleAddCustomServiceType}
                                                    disabled={!customServiceType.trim()}
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                                                >
                                                    Add
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCustomServiceInput(false)
                                                        setCustomServiceType('')
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-white dark:bg-[#1a1a1a] text-foreground border-border"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {errors.serviceType && (
                                        <p className="text-red-400 text-xs mt-1">{errors.serviceType}</p>
                                    )}
                                </div>

                                {/* Custom Time Input */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <h3 className="text-muted-foreground text-xs mb-1">Start Time</h3>
                                        <TimeSelect
                                            value={formData.startTime}
                                            onChange={(value) => handleInputChange('startTime', value)}
                                            className="bg-white dark:bg-[#1a1a1a] text-foreground border-border text-sm"
                                            placeholder="Select start time"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-muted-foreground text-xs mb-1">End Time</h3>
                                        <TimeSelect
                                            value={formData.endTime}
                                            onChange={(value) => handleInputChange('endTime', value)}
                                            className="bg-white dark:bg-[#1a1a1a] text-foreground border-border text-sm"
                                            placeholder="Select end time"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <Label className="text-muted-foreground text-xs">Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        placeholder="Any special requests or notes..."
                                        className="bg-background text-foreground border-border text-sm min-h-[60px]"
                                    />
                                </div>
                            </div>

                        {/* Customer Type Selection */}
                        <div className="space-y-4 border-t border-border pt-4">
                            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer Type
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    className={`p-4 border rounded-lg text-center transition-colors ${
                                        customerType === 'registered'
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                            : 'border-border hover:border-border/80 text-muted-foreground hover:text-foreground'
                                    }`}
                                    onClick={() => {
                                        setCustomerType('registered')
                                        // Reset walk-in data
                                        setWalkInVehicleInfo({
                                            year: new Date().getFullYear(),
                                            make: '',
                                            model: '',
                                            license_plate: '',
                                            color: '',
                                            vin: '',
                                            mileage: 0
                                        })
                                        setWalkInVehicleId(null)
                                        setErrors(prev => ({ ...prev, walkInVehicle: '' }))
                                    }}
                                >
                                    <div className="font-medium">Registered Customer</div>
                                    <div className="text-xs text-muted-foreground">Existing customer</div>
                                </button>

                                <button
                                    type="button"
                                    className={`p-4 border rounded-lg text-center transition-colors ${
                                        customerType === 'walk_in'
                                            ? 'border-green-500 bg-green-500/10 text-green-400'
                                            : 'border-border hover:border-border/80 text-muted-foreground hover:text-foreground'
                                    }`}
                                    onClick={() => {
                                        setCustomerType('walk_in')
                                        // Reset registered customer data
                                        setCustomerId('')
                                        setCustomerName('')
                                        setCustomerEmail('')
                                        setCustomerPhone('')
                                        setCustomerAddress('')
                                        setSelectedVehicleId('')
                                        setVehicleYear('')
                                        setVehicleMake('')
                                        setVehicleModel('')
                                        setVehicleColor('')
                                        setVehicleVin('')
                                        setVehicleLicensePlate('')
                                        setVehicleMileage('')
                                        setErrors(prev => ({ ...prev, customer: '', vehicle: '' }))
                                    }}
                                >
                                    <div className="font-medium">Vehicle Search</div>
                                    <div className="text-xs text-muted-foreground">Search by license plate</div>
                                </button>
                            </div>
                        </div>

                        {/* Customer Details - Registered Customers Only */}
                        {customerType === 'registered' && (
                            <>
                                {/* Customer Information */}
                                <div className="border-t border-border pt-4">
                                    <CustomerInformation
                                        customerId={customerId}
                                        customerName={customerName}
                                        customerEmail={customerEmail}
                                        customerPhone={customerPhone}
                                        customerAddress={customerAddress}
                                        isEditing={true}
                                        isCreating={true}
                                        onFieldChange={handleCustomerFieldChange}
                                        onCustomerChange={handleCustomerChange}
                                        onCustomerSaved={handleCustomerSaved}
                                    />
                                    {errors.customer && (
                                        <p className="text-red-400 text-xs mt-1 ml-20">{errors.customer}</p>
                                    )}
                                </div>

                                {/* Vehicle Information */}
                                <div className="border-t border-border pt-4">
                                    <VehicleInformation
                                        customerId={customerId}
                                        selectedVehicleId={selectedVehicleId}
                                        vehicleId={selectedVehicleId}
                                        vehicleYear={vehicleYear}
                                        vehicleMake={vehicleMake}
                                        vehicleModel={vehicleModel}
                                        vehicleColor={vehicleColor}
                                        vehicleVin={vehicleVin}
                                        vehicleLicensePlate={vehicleLicensePlate}
                                        vehicleMileage={vehicleMileage}
                                        isEditing={true}
                                        isCreating={true}
                                        onFieldChange={handleVehicleFieldChange}
                                        onVehicleSelect={handleVehicleSelect}
                                        onVehicleSaved={handleVehicleSaved}
                                    />
                                    {errors.vehicle && (
                                        <p className="text-red-400 text-xs mt-1">{errors.vehicle}</p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Walk-in Vehicle Information */}
                        {customerType === 'walk_in' && (
                            <div className="space-y-4 border-t border-border pt-4">
                                <WalkInVehicleForm
                                    data={walkInVehicleInfo}
                                    onDataChange={setWalkInVehicleInfo}
                                    shopId={shopId}
                                    onVehicleSelected={(vehicleId) => {
                                        setWalkInVehicleId(vehicleId)
                                        setErrors(prev => ({ ...prev, walkInVehicle: '' }))
                                    }}
                                    onVehicleCreated={(vehicleId) => {
                                        setWalkInVehicleId(vehicleId)
                                        setErrors(prev => ({ ...prev, walkInVehicle: '' }))
                                    }}
                                    isEditing={true}
                                />
                                {errors.walkInVehicle && (
                                    <p className="text-red-400 text-xs mt-1">{errors.walkInVehicle}</p>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="border-t border-border pt-4">
                            <Button
                                type="submit"
                                disabled={createAppointment.isPending || createWalkInAppointment.isPending}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {(createAppointment.isPending || createWalkInAppointment.isPending) ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                        Creating Appointment...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Create Appointment
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}