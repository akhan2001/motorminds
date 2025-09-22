'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useCreateAppointment } from '../../hooks/appointments/useAppointments'
import CustomerDropdown from '../../../customers/components/Selection/CustomerDropdown'
import { VehicleDropdown } from '../../../customers/components/Selection/VehicleDropdown'
import type { AppointmentCreateData } from '../../types/appointment'
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
        serviceType: '',
        notes: '',
    })

    // Customer and vehicle selection state
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null)
    
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
    const [showNewVehicleForm, setShowNewVehicleForm] = useState(false)
    
    // New customer form state
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    })
    
    // New vehicle form state  
    const [newVehicleData, setNewVehicleData] = useState({
        year: new Date().getFullYear().toString(),
        make: '',
        model: '',
        color: '',
        vin: '',
        licensePlate: '',
        mileage: ''
    })

    // Fetch available slots for the selected date
    const { 
        data: availableSlots, 
        isLoading: slotsLoading 
    } = useAvailableSlots(shopId, formData.appointmentDate)

    // Create appointment mutation
    const createAppointment = useCreateAppointment()

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

    // Handle customer selection
    const handleCustomerSelect = (customerId: string, customerData?: any) => {
        if (customerId === "new") {
            setShowNewCustomerForm(true)
            setSelectedCustomer(null)
            setSelectedCustomerId('')
        } else {
            setSelectedCustomerId(customerId)
            if (customerData) {
                const customer: Customer = {
                    id: customerData.id,
                    customer_name: customerData.name,
                    customer_phone: customerData.phone,
                    customer_email: customerData.email,
                    customer_address: customerData.address
                }
                setSelectedCustomer(customer)
            }
            setShowNewCustomerForm(false)
        }
        
        setSelectedVehicleId('') // Reset vehicle selection
        setSelectedVehicle(null)
        setShowNewVehicleForm(false)
        
        // Clear customer-related errors
        setErrors(prev => ({ ...prev, customer: '' }))
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

    // Handle new customer data changes
    const handleNewCustomerChange = (field: string, value: string) => {
        setNewCustomerData(prev => ({ ...prev, [field]: value }))
        
        // Clear field error when user starts typing
        if (errors[`newCustomer.${field}`]) {
            setErrors(prev => ({ ...prev, [`newCustomer.${field}`]: '' }))
        }
    }

    // Handle new vehicle data changes  
    const handleNewVehicleChange = (field: string, value: string) => {
        setNewVehicleData(prev => ({ ...prev, [field]: value }))
        
        // Clear field error when user starts typing
        if (errors[`newVehicle.${field}`]) {
            setErrors(prev => ({ ...prev, [`newVehicle.${field}`]: '' }))
        }
    }

    // Validate form
    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        // Required appointment fields
        if (!formData.appointmentDate) newErrors.appointmentDate = 'Date is required'
        if (!formData.startTime) newErrors.startTime = 'Start time is required'
        if (!formData.serviceType) newErrors.serviceType = 'Service type is required'
        
        // Customer validation
        if (!selectedCustomerId && !showNewCustomerForm) {
            newErrors.customer = 'Customer is required'
        }
        
        // New customer validation if creating new customer
        if (showNewCustomerForm) {
            if (!newCustomerData.name.trim()) newErrors['newCustomer.name'] = 'Customer name is required'
            if (!newCustomerData.phone.trim()) newErrors['newCustomer.phone'] = 'Customer phone is required'
            if (newCustomerData.email && !/\S+@\S+\.\S+/.test(newCustomerData.email)) {
                newErrors['newCustomer.email'] = 'Invalid email format'
            }
        }
        
        // Vehicle validation
        if (!selectedVehicle && !showNewVehicleForm) {
            newErrors.vehicle = 'Vehicle is required'
        }
        
        // New vehicle validation if creating new vehicle  
        if (showNewVehicleForm) {
            if (!newVehicleData.make.trim()) newErrors['newVehicle.make'] = 'Vehicle make is required'
            if (!newVehicleData.model.trim()) newErrors['newVehicle.model'] = 'Vehicle model is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Create customer if needed
    const createCustomerIfNeeded = async (): Promise<string> => {
        if (selectedCustomerId) {
            return selectedCustomerId
        }
        
        if (showNewCustomerForm) {
            const { data: newCustomer, error } = await supabase
                .from('customers')
                .insert([{
                    shop_id: shopId,
                    customer_name: newCustomerData.name.trim(),
                    customer_email: newCustomerData.email.trim() || null,
                    customer_phone: newCustomerData.phone.trim(),
                    customer_address: newCustomerData.address.trim() || null,
                }])
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create customer: ${error.message}`)
            }

            return newCustomer.id
        }
        
        throw new Error('No customer selected or created')
    }

    // Create vehicle if needed
    const createVehicleIfNeeded = async (customerId: string): Promise<string> => {
        if (selectedVehicle && selectedVehicleId !== 'new') {
            return selectedVehicle.id
        }
        
        if (showNewVehicleForm) {
            const { data: newVehicle, error } = await supabase
                .from('customer_vehicles')
                .insert([{
                    customer_id: customerId,
                    year: parseInt(newVehicleData.year) || new Date().getFullYear(),
                    make: newVehicleData.make.trim(),
                    model: newVehicleData.model.trim(),
                    color: newVehicleData.color.trim() || null,
                    vin: newVehicleData.vin.trim() || null,
                    license_plate: newVehicleData.licensePlate.trim() || null,
                    mileage: newVehicleData.mileage ? parseInt(newVehicleData.mileage) : null,
                }])
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create vehicle: ${error.message}`)
            }

            return newVehicle.id
        }
        
        throw new Error('No vehicle selected or created')
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateForm()) return

        try {
            // Create customer and vehicle if needed
            const customerId = await createCustomerIfNeeded()
            const vehicleId = await createVehicleIfNeeded(customerId)
            
            const appointmentData: AppointmentCreateData = {
                shop_id: shopId,
                customer_id: customerId,
                vehicle_id: vehicleId,
                appointment_date: formData.appointmentDate,
                start_time: formData.startTime,
                end_time: formData.endTime,
                service_type: formData.serviceType,
                notes: formData.notes || undefined,
                status: 'scheduled',
                created_by_customer: false,
            }

            await createAppointment.mutateAsync(appointmentData)
            onSuccess?.()
            
            // Reset form
            setFormData({
                appointmentDate: format(new Date(), 'yyyy-MM-dd'),
                startTime: '',
                endTime: '',
                serviceType: '',
                notes: '',
            })
            setSelectedCustomer(null)
            setSelectedCustomerId('')
            setSelectedVehicleId('')
            setSelectedVehicle(null)
            setShowNewCustomerForm(false)
            setShowNewVehicleForm(false)
            setNewCustomerData({ name: '', email: '', phone: '', address: '' })
            setNewVehicleData({
                year: new Date().getFullYear().toString(),
                make: '',
                model: '',
                color: '',
                vin: '',
                licensePlate: '',
                mileage: ''
            })
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
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] h-full flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        New Appointment
                    </CardTitle>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
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
                            <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Appointment Details
                            </h3>

                            {/* Quick Date Selection */}
                            <div>
                                <Label className="text-gray-300 text-xs">Quick Date Select</Label>
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
                                                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
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
                                <Label className="text-gray-300 text-xs">Date</Label>
                                <Input
                                    type="date"
                                    value={formData.appointmentDate}
                                    onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                />
                                {errors.appointmentDate && (
                                    <p className="text-red-400 text-xs mt-1">{errors.appointmentDate}</p>
                                )}
                            </div>

                            {/* Service Type */}
                            <div>
                                <Label className="text-gray-300 text-xs">Service Type</Label>
                                <Select 
                                    value={formData.serviceType} 
                                    onValueChange={(value) => handleInputChange('serviceType', value)}
                                >
                                    <SelectTrigger className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm">
                                        <SelectValue placeholder="Select service type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                        {SERVICE_TYPES.map((service) => (
                                            <SelectItem key={service} value={service} className="text-white hover:bg-[#2a2a2a]">
                                                {service}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.serviceType && (
                                    <p className="text-red-400 text-xs mt-1">{errors.serviceType}</p>
                                )}
                            </div>

                            {/* Available Time Slots */}
                            {formData.serviceType && (
                                <div>
                                    <Label className="text-gray-300 text-xs">Available Times</Label>
                                    {slotsLoading ? (
                                        <div className="grid grid-cols-3 gap-2 mt-1">
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <Skeleton key={i} className="h-8 bg-[#2a2a2a]" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 mt-1">
                                            {availableSlots?.filter(slot => slot.isAvailable).slice(0, 12).map((slot, index) => (
                                                <Button
                                                    key={index}
                                                    type="button"
                                                    variant={formData.startTime === slot.time ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => handleInputChange('startTime', slot.time)}
                                                    className={`
                                                        text-xs h-8
                                                        ${formData.startTime === slot.time 
                                                            ? 'bg-blue-600 text-white' 
                                                            : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                                                        }
                                                    `}
                                                >
                                                    {slot.time}
                                                </Button>
                                            )) || []}
                                        </div>
                                    )}
                                    {errors.startTime && (
                                        <p className="text-red-400 text-xs mt-1">{errors.startTime}</p>
                                    )}
                                </div>
                            )}

                            {/* Custom Time Input */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-gray-300 text-xs">Start Time</Label>
                                    <Input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                                        className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-300 text-xs">End Time</Label>
                                    <Input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                                        className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <Label className="text-gray-300 text-xs">Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Any special requests or notes..."
                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm min-h-[60px]"
                                />
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-white flex items-center gap-2 border-t border-[#2a2a2a] pt-4">
                                <User className="h-4 w-4" />
                                Customer Information
                            </h3>

                            {/* Customer Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="customer-select" className="text-gray-300 text-xs">Customer *</Label>
                                <CustomerDropdown
                                    shopId={shopId}
                                    selectedCustomerId={selectedCustomerId}
                                    onCustomerSelect={handleCustomerSelect}
                                    placeholder="Select Customer"
                                    disabled={false}
                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a]"
                                />
                                {errors.customer && (
                                    <p className="text-red-400 text-xs mt-1">{errors.customer}</p>
                                )}
                            </div>

                            {/* New Customer Form */}
                            {showNewCustomerForm && (
                                <Card className="bg-[#0d0d0d] border-[#2a2a2a] p-4 mt-4">
                                    <CardTitle className="text-md font-medium text-white mb-3 flex items-center justify-between">
                                        New Customer Details
                                        <Button variant="ghost" size="sm" onClick={() => setShowNewCustomerForm(false)} className="text-gray-400 hover:text-white">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </CardTitle>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-gray-300 text-xs">Name *</Label>
                                            <Input
                                                value={newCustomerData.name}
                                                onChange={(e) => handleNewCustomerChange('name', e.target.value)}
                                                placeholder="John Doe"
                                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                            />
                                            {errors['newCustomer.name'] && (
                                                <p className="text-red-400 text-xs mt-1">{errors['newCustomer.name']}</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-gray-300 text-xs">Email</Label>
                                                <Input
                                                    type="email"
                                                    value={newCustomerData.email}
                                                    onChange={(e) => handleNewCustomerChange('email', e.target.value)}
                                                    placeholder="john@example.com"
                                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                                />
                                                {errors['newCustomer.email'] && (
                                                    <p className="text-red-400 text-xs mt-1">{errors['newCustomer.email']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label className="text-gray-300 text-xs">Phone *</Label>
                                                <Input
                                                    type="tel"
                                                    value={newCustomerData.phone}
                                                    onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
                                                    placeholder="555-123-4567"
                                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                                />
                                                {errors['newCustomer.phone'] && (
                                                    <p className="text-red-400 text-xs mt-1">{errors['newCustomer.phone']}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-gray-300 text-xs">Address</Label>
                                            <Input
                                                value={newCustomerData.address}
                                                onChange={(e) => handleNewCustomerChange('address', e.target.value)}
                                                placeholder="123 Main St"
                                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                            />
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Vehicle Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-white flex items-center gap-2 border-t border-[#2a2a2a] pt-4">
                                <Car className="h-4 w-4" />
                                Vehicle Information
                            </h3>

                            {/* Vehicle Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="vehicle-select" className="text-gray-300 text-xs">Vehicle *</Label>
                                <VehicleDropdown
                                    customerId={selectedCustomerId || (showNewCustomerForm ? 'new' : '')}
                                    selectedVehicleId={selectedVehicleId}
                                    onVehicleSelect={handleVehicleSelect}
                                    placeholder="Select or add vehicle"
                                    disabled={!selectedCustomerId && !showNewCustomerForm}
                                />
                                {errors.vehicle && (
                                    <p className="text-red-400 text-xs mt-1">{errors.vehicle}</p>
                                )}
                            </div>

                            {/* New Vehicle Form */}
                            {showNewVehicleForm && (
                                <Card className="bg-[#0d0d0d] border-[#2a2a2a] p-4 mt-4">
                                    <CardTitle className="text-md font-medium text-white mb-3 flex items-center justify-between">
                                        New Vehicle Details
                                        <Button variant="ghost" size="sm" onClick={() => setShowNewVehicleForm(false)} className="text-gray-400 hover:text-white">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </CardTitle>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label className="text-gray-300 text-xs">Year</Label>
                                                <Input
                                                    type="number"
                                                    value={newVehicleData.year}
                                                    onChange={(e) => handleNewVehicleChange('year', e.target.value)}
                                                    placeholder="2023"
                                                    min="1900"
                                                    max={new Date().getFullYear() + 1}
                                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-gray-300 text-xs">Make *</Label>
                                                <Input
                                                    value={newVehicleData.make}
                                                    onChange={(e) => handleNewVehicleChange('make', e.target.value)}
                                                    placeholder="Toyota"
                                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                                />
                                                {errors['newVehicle.make'] && (
                                                    <p className="text-red-400 text-xs mt-1">{errors['newVehicle.make']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label className="text-gray-300 text-xs">Model *</Label>
                                                <Input
                                                    value={newVehicleData.model}
                                                    onChange={(e) => handleNewVehicleChange('model', e.target.value)}
                                                    placeholder="Camry"
                                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                                />
                                                {errors['newVehicle.model'] && (
                                                    <p className="text-red-400 text-xs mt-1">{errors['newVehicle.model']}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-gray-300 text-xs">Color</Label>
                                            <Input
                                                value={newVehicleData.color}
                                                onChange={(e) => handleNewVehicleChange('color', e.target.value)}
                                                placeholder="Red"
                                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-300 text-xs">VIN</Label>
                                            <Input
                                                value={newVehicleData.vin}
                                                onChange={(e) => handleNewVehicleChange('vin', e.target.value)}
                                                placeholder="17-digit VIN"
                                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-gray-300 text-xs">License Plate</Label>
                                                <Input
                                                    value={newVehicleData.licensePlate}
                                                    onChange={(e) => handleNewVehicleChange('licensePlate', e.target.value)}
                                                    placeholder="ABC-123"
                                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-gray-300 text-xs">Mileage</Label>
                                                <Input
                                                    type="number"
                                                    value={newVehicleData.mileage}
                                                    onChange={(e) => handleNewVehicleChange('mileage', e.target.value)}
                                                    placeholder="50000"
                                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="border-t border-[#2a2a2a] pt-4">
                            <Button
                                type="submit"
                                disabled={createAppointment.isPending}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {createAppointment.isPending ? (
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