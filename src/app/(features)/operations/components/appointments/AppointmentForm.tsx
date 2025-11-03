'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TimeSelect } from '@/components/ui/time-select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Calendar,
    Clock,
    User,
    Car,
    Phone,
    Mail,
    MapPin,
    Save,
    X,
    Plus,
    AlertCircle
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useAvailableSlots } from '../../hooks/appointments/useAvailbility'
import { useCreateAppointment, useCreateWalkInAppointment } from '../../hooks/appointments/useAppointments'
import { CustomerSearchBar } from '@/components/common/customers/customer-search-bar'
import { CustomerForm } from '../../../customers/components/Selection/CustomerForm'
import { VehicleDropdown } from '../../../customers/components/Selection/VehicleDropdown'
import { NewVehicleForm } from '../../../customers/components/Selection/NewVehicleForm'
import { WalkInVehicleForm } from '../work-orders/create/WalkInVehicleForm'
import type { AppointmentCreateData } from '../../types/appointment'
import type { WalkInVehicleInfo } from '../../../customers/types/vehicle'
import { createClient } from '@/utils/supabase/client'

interface AppointmentFormProps {
    shopId: string
    selectedDate?: string
    selectedTime?: string
    onClose?: () => void
    onSuccess?: () => void
}

interface Customer {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone: string
    customer_address?: string
}

interface VehicleOption {
    id: string
    displayName: string
    year?: number
    make?: string
    model?: string
    color?: string
    vin?: string
    license_plate?: string
    mileage?: number
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
    selectedDate,
    selectedTime,
    onClose,
    onSuccess
}: AppointmentFormProps) {
    const supabase = createClient()

    // Form state
    const [formData, setFormData] = useState({
        // Appointment details
        appointmentDate: selectedDate || format(new Date(), 'yyyy-MM-dd'),
        startTime: selectedTime || '',
        endTime: '',
        serviceType: [] as string[],
        notes: '',
    })

    // Customer type selection
    const [customerType, setCustomerType] = useState<'registered' | 'walk_in'>('registered')

    // Customer and vehicle selection state (for registered customers)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null)

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
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
    const [showNewVehicleForm, setShowNewVehicleForm] = useState(false)
    const [vehicleRefreshTrigger, setVehicleRefreshTrigger] = useState(0)



    // Fetch available slots for the selected date
    const {
        data: availableSlots,
        isLoading: slotsLoading
    } = useAvailableSlots(shopId, formData.appointmentDate)

    // Create appointment mutations
    const createAppointment = useCreateAppointment()
    const createWalkInAppointment = useCreateWalkInAppointment()

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

        // Clear field error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    // Handle service type multi-select
    const handleServiceTypeToggle = (serviceType: string) => {
        setFormData(prev => {
            const currentServices = prev.serviceType as string[]
            const isSelected = currentServices.includes(serviceType)

            const updatedServices = isSelected
                ? currentServices.filter(service => service !== serviceType)
                : [...currentServices, serviceType]

            return { ...prev, serviceType: updatedServices }
        })

        // Clear field error when user makes selection
        if (errors.serviceType) {
            setErrors(prev => ({ ...prev, serviceType: '' }))
        }
    }


    // Handle vehicle selection
    const handleVehicleSelect = (vehicleId: string, vehicle?: VehicleOption) => {
        setSelectedVehicleId(vehicleId)
        setSelectedVehicle(vehicle || null)
        setShowNewVehicleForm(vehicleId === 'new')

        // Clear vehicle-related errors
        setErrors(prev => ({ ...prev, vehicle: '' }))
    }

    // Handle new customer creation
    // Removed handleCreateNewCustomer - now handled by CustomerDropdown



    // Validate form
    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        // Required appointment fields
        if (!formData.appointmentDate) newErrors.appointmentDate = 'Date is required'
        if (!formData.startTime) newErrors.startTime = 'Start time is required'
        if (!formData.serviceType || formData.serviceType.length === 0) newErrors.serviceType = 'At least one service type is required'

        // Customer validation based on type
        if (customerType === 'registered') {
            // Registered customer validation
            if (!selectedCustomerId && !showNewCustomerForm) {
                newErrors.customer = 'Customer is required'
            }

            // Vehicle validation for registered customers
            if (!selectedVehicle && !showNewVehicleForm) {
                newErrors.vehicle = 'Vehicle is required'
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

    // Create customer if needed
    const createCustomerIfNeeded = async (): Promise<string> => {
        if (selectedCustomerId) {
            return selectedCustomerId
        }

        // Customer creation is now handled by CustomerForm component
        if (showNewCustomerForm) {
            throw new Error('Customer should have been created by CustomerForm component')
        }

        throw new Error('No customer selected or created')
    }

    // Create vehicle if needed
    const createVehicleIfNeeded = async (customerId: string): Promise<string> => {
        if (selectedVehicle && selectedVehicleId !== 'new') {
            return selectedVehicle.id
        }

        throw new Error('No vehicle selected or created')
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
                const customerId = await createCustomerIfNeeded()
                const vehicleId = await createVehicleIfNeeded(customerId)

                const appointmentData: AppointmentCreateData = {
                    shop_id: shopId,
                    customer_id: customerId,
                    vehicle_id: vehicleId,
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
            setFormData({
                appointmentDate: format(new Date(), 'yyyy-MM-dd'),
                startTime: '',
                endTime: '',
                serviceType: [],
                notes: '',
            })
            setCustomerType('registered')
            setSelectedCustomer(null)
            setSelectedCustomerId('')
            setSelectedVehicleId('')
            setSelectedVehicle(null)
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
            setShowNewCustomerForm(false)
            setShowNewVehicleForm(false)
        } catch (error) {
            console.error('Failed to create appointment:', error)
            setErrors({ submit: error instanceof Error ? error.message : 'Failed to create appointment' })
        }
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

    return (
        <Card className="bg-slate-50 dark:bg-card border-border h-full flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        New Appointment
                    </CardTitle>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <CardContent className="pt-2 pb-12 px-6">
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
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {formData.serviceType.map((service) => (
                                                <Badge
                                                    key={service}
                                                    variant="secondary"
                                                    className="bg-blue-600 text-white text-xs px-2 py-1 flex items-center gap-1"
                                                >
                                                    {service}
                                                    <X
                                                        className="h-3 w-3 cursor-pointer hover:text-red-300"
                                                        onClick={() => handleServiceTypeToggle(service)}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Service Type Selection */}
                                    <Select onValueChange={handleServiceTypeToggle}>
                                        <SelectTrigger className="bg-background text-foreground border-border text-sm">
                                            <SelectValue placeholder="Add service type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover text-popover-foreground border-border">
                                            {SERVICE_TYPES.filter(service => !formData.serviceType.includes(service)).map((service) => (
                                                <SelectItem key={service} value={service} className="hover:bg-accent hover:text-accent-foreground">
                                                    {service}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                            className="bg-background text-foreground border-border text-sm"
                                            placeholder="Select start time"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-muted-foreground text-xs mb-1">End Time</h3>
                                        <TimeSelect
                                            value={formData.endTime}
                                            onChange={(value) => handleInputChange('endTime', value)}
                                            className="bg-background text-foreground border-border text-sm"
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
                                        setSelectedCustomerId('')
                                        setSelectedCustomer(null)
                                        setSelectedVehicleId('')
                                        setSelectedVehicle(null)
                                        setShowNewCustomerForm(false)
                                        setShowNewVehicleForm(false)
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
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-t border-border pt-4">
                                        <User className="h-4 w-4" />
                                        Customer Information
                                    </h3>

                                    {/* Customer Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="customer-select" className="text-muted-foreground text-xs">Customer *</Label>
                                        <CustomerSearchBar
                                            onSelect={(customer) => {
                                                setSelectedCustomerId(customer.id)
                                                setSelectedCustomer({
                                                    id: customer.id,
                                                    customer_name: customer.customer_name,
                                                    customer_phone: customer.customer_phone,
                                                    customer_email: customer.customer_email,
                                                    customer_address: customer.customer_address
                                                })
                                                setShowNewCustomerForm(false)
                                                setSelectedVehicleId('') // Reset vehicle selection
                                                setSelectedVehicle(null)
                                                setShowNewVehicleForm(false)
                                                // Clear customer-related errors
                                                setErrors(prev => ({ ...prev, customer: '' }))
                                            }}
                                            onCreateNew={() => {
                                                setShowNewCustomerForm(true)
                                                setSelectedCustomerId('')
                                                setSelectedCustomer(null)
                                                setSelectedVehicleId('')
                                                setSelectedVehicle(null)
                                                setShowNewVehicleForm(false)
                                                // Clear customer-related errors
                                                setErrors(prev => ({ ...prev, customer: '' }))
                                            }}
                                            placeholder="Search customers..."
                                            className="w-full"
                                        />
                                        {errors.customer && (
                                            <p className="text-red-400 text-xs mt-1">{errors.customer}</p>
                                        )}
                                    </div>

                                    {/* New Customer Form */}
                                    <CustomerForm
                                        showNewCustomerForm={showNewCustomerForm}
                                        setShowNewCustomerForm={setShowNewCustomerForm}
                                        shopId={shopId}
                                        onCustomerCreated={(customer) => {
                                            // Set the created customer as selected
                                            setSelectedCustomerId(customer.id)
                                            setSelectedCustomer({
                                                id: customer.id,
                                                customer_name: customer.customer_name,
                                                customer_phone: customer.customer_phone,
                                                customer_email: customer.customer_email,
                                                customer_address: customer.customer_address
                                            })
                                            setShowNewCustomerForm(false)
                                            // Clear any customer errors
                                            setErrors(prev => ({ ...prev, customer: '' }))
                                        }}
                                    />
                                </div>

                                {/* Vehicle Details - Registered Customers Only */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2 border-t border-border pt-4">
                                        <Car className="h-4 w-4" />
                                        Vehicle Information
                                    </h3>

                                    {/* Vehicle Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle-select" className="text-muted-foreground text-xs">Vehicle *</Label>
                                        <VehicleDropdown
                                            customerId={selectedCustomerId || (showNewCustomerForm ? 'new' : '')}
                                            selectedVehicleId={selectedVehicleId}
                                            onVehicleSelect={handleVehicleSelect}
                                            placeholder="Select or add vehicle"
                                            disabled={!selectedCustomerId && !showNewCustomerForm}
                                            refreshTrigger={vehicleRefreshTrigger}
                                        />
                                        {errors.vehicle && (
                                            <p className="text-red-400 text-xs mt-1">{errors.vehicle}</p>
                                        )}
                                    </div>

                                    {/* New Vehicle Form */}
                                    {showNewVehicleForm && (
                                        <NewVehicleForm
                                            customerId={selectedCustomerId}
                                            onVehicleCreated={(vehicle) => {
                                                setSelectedVehicle(vehicle)
                                                setSelectedVehicleId(vehicle.id)
                                                setShowNewVehicleForm(false)
                                                // Trigger vehicle list refresh
                                                setVehicleRefreshTrigger(prev => prev + 1)
                                                // Clear any vehicle errors
                                                setErrors(prev => ({ ...prev, vehicle: '' }))
                                            }}
                                            onCancel={() => setShowNewVehicleForm(false)}
                                        />
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
                </CardContent>
            </ScrollArea>
        </div>
    </Card>
    )
}