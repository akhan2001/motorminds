'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Import utility functions
import { createNewCustomer } from '@/app/customers/api/customer-utils'
import { createCustomerInvoice } from '../utils/customer-invoice-utils'
import { v4 as uuidv4 } from 'uuid'

// UI components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search } from 'lucide-react'

// Form validation schema
const formSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name is too long' }),
  
  email: z.string()
    .email({ message: 'Please enter a valid email address' })
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .min(10, { message: 'Phone number must have at least 10 digits' }),
  
  make: z.string()
    .min(1, { message: 'Vehicle make is required' }),
  
  model: z.string()
    .min(1, { message: 'Vehicle model is required' }),
  
  year: z.string()
    .min(4, { message: 'Vehicle year is required' }),
  
  licensePlate: z.string()
    .min(1, { message: 'License plate is required' })
    .max(10, { message: 'License plate is too long' }),
  
  serviceDescription: z.string()
    .min(10, { message: 'Please provide a detailed service description (minimum 10 characters)' })
    .max(500, { message: 'Service description is too long' }),

  estimatedAmount: z.string()
    .optional()
    .default('0')
})

type FormValues = z.infer<typeof formSchema>

interface CustomerInvoiceIntakeFormProps {
  shopId: string
  user: any
}

export default function CustomerInvoiceIntakeForm({ shopId, user }: CustomerInvoiceIntakeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [existingCustomers, setExistingCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('new')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)
  const [customerVehicles, setCustomerVehicles] = useState<any[]>([])
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      serviceDescription: '',
      estimatedAmount: '0',
    },
    mode: 'onBlur',
  })

  // Fetch existing customers for the dropdown
  useEffect(() => {
    async function fetchCustomers() {
      if (!shopId) return
      
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, customer_name, customer_email, customer_phone')
          .eq('shop_id', shopId)
          .order('customer_name')
        
        if (error) throw error
        setExistingCustomers(data || [])
        setFilteredCustomers(data || [])
      } catch (error) {
        console.error('Error fetching customers:', error)
      }
    }
    
    fetchCustomers()
  }, [shopId])

  // Show form errors if any
  const errors = form.formState.errors;
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      if (firstError && firstError.message) {
        setFormError(firstError.message as string);
      }
    } else {
      setFormError(null);
    }
  }, [errors]);

  // Handle customer search
  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    
    if (!query) {
      setFilteredCustomers(existingCustomers)
      return
    }
    
    const filtered = existingCustomers.filter(customer => 
      (customer.customer_name && customer.customer_name.toLowerCase().includes(query)) ||
      (customer.customer_phone && customer.customer_phone.includes(query)) ||
      (customer.customer_email && customer.customer_email.toLowerCase().includes(query))
    )
    
    setFilteredCustomers(filtered)
  }

  // Handle existing customer selection
  const handleCustomerSelect = async (customerId: string) => {
    setSelectedCustomerId(customerId)
    setSelectedVehicle(null)
    
    try {
      // Fetch customer details
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()
      
      if (customerError) throw customerError
      
      // Update form with customer details
      form.setValue('name', customer.customer_name || '')
      form.setValue('email', customer.customer_email || '')
      form.setValue('phone', customer.customer_phone || '')
      
      // Fetch customer's vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('customer_vehicles')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      
      if (vehiclesError) {
        console.error("Error fetching customer vehicles:", vehiclesError)
      }
      
      setCustomerVehicles(vehicles || [])
      
      // Clear vehicle form fields until one is selected
      form.setValue('make', '')
      form.setValue('model', '')
      form.setValue('year', '')
      form.setValue('licensePlate', '')
      
    } catch (error) {
      console.error('Error fetching customer details:', error)
      toast.error('Failed to load customer details')
    }
  }

  // Handle vehicle selection
  const handleVehicleSelect = (vehicleId: string) => {
    if (vehicleId === 'new') {
      setSelectedVehicle(null)
      form.setValue('make', '')
      form.setValue('model', '')
      form.setValue('year', '')
      form.setValue('licensePlate', '')
    } else {
      const vehicle = customerVehicles.find(v => v.id === vehicleId)
      if (vehicle) {
        setSelectedVehicle(vehicle)
        form.setValue('make', vehicle.make || '')
        form.setValue('model', vehicle.model || '')
        form.setValue('year', vehicle.year ? vehicle.year.toString() : '')
        form.setValue('licensePlate', vehicle.license_plate || '')
      }
    }
  }

  // Auto-reset success screen
  useEffect(() => {
    if (showSuccess) {
      const timeoutId = setTimeout(() => {
        setShowSuccess(false);
        form.reset();
        setSelectedCustomerId(null);
        setActiveTab('new');
        setCreatedInvoiceId(null);
      }, 40000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [showSuccess, form]);

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    setFormError(null)
    
    try {
      let customerId: string;
      let vehicleId: string;
      
      // Handle customer creation/selection
      if (activeTab === 'existing' && selectedCustomerId) {
        // Update existing customer
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            customer_name: data.name,
            customer_email: data.email || null,
            customer_phone: data.phone,
          })
          .eq('id', selectedCustomerId)
        
        if (updateError) throw updateError
        customerId = selectedCustomerId
        
        // Check if using existing vehicle
        if (selectedVehicle && 
            selectedVehicle.make === data.make && 
            selectedVehicle.model === data.model && 
            selectedVehicle.year.toString() === data.year && 
            selectedVehicle.license_plate === data.licensePlate) {
          vehicleId = selectedVehicle.id;
        } else {
          // Create new vehicle for existing customer
          const { data: newVehicle, error: vehicleError } = await supabase
            .from('customer_vehicles')
            .insert({
              customer_id: customerId,
              make: data.make,
              model: data.model,
              year: parseInt(data.year),
              license_plate: data.licensePlate,
              created_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (vehicleError) throw vehicleError
          vehicleId = newVehicle.id;
        }
      } else {
        // Create new customer
        const customerData = {
          customer_name: data.name,
          customer_email: data.email || null,
          customer_phone: data.phone,
          customer_address: "",
        }
        
        const newCustomer = await createNewCustomer(customerData, shopId)
        if (!newCustomer) throw new Error('Failed to create customer')
        customerId = newCustomer.id
        
        // Create vehicle for new customer
        const { data: newVehicle, error: vehicleError } = await supabase
          .from('customer_vehicles')
          .insert({
            customer_id: customerId,
            make: data.make,
            model: data.model,
            year: parseInt(data.year),
            license_plate: data.licensePlate,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (vehicleError) throw vehicleError
        vehicleId = newVehicle.id;
      }
      
      // Create the customer-generated invoice
      const invoiceId = await createCustomerInvoice({
        shopId,
        customerId,
        vehicleId,
        serviceDescription: data.serviceDescription,
        estimatedAmount: parseFloat(data.estimatedAmount) || 0
      });
      
      setCreatedInvoiceId(invoiceId);
      setShowSuccess(true);
      toast.success('Service request submitted successfully!');
      
    } catch (error: any) {
      setFormError(error.message || 'Failed to submit service request')
      toast.error(`Error: ${error.message || 'Failed to submit service request'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success screen
  if (showSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-[#0d0d0d] border-[#1f1f1f] text-white">
        <CardHeader className="border-b border-[#1f1f1f]">
          <CardTitle className="text-xl font-semibold text-center">Thank You!</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-4 sm:px-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Your Service Request Was Submitted Successfully</h3>
            <p className="text-gray-400 mb-4">Our team will review your request and contact you shortly with pricing and availability.</p>
            
            {createdInvoiceId && (
              <div className="bg-[#1A1A1A] rounded-lg p-3 sm:p-4 mb-6 max-w-md mx-auto text-sm sm:text-base">
                <h4 className="text-green-500 text-base sm:text-lg font-medium mb-2">Service Request Created!</h4>
                <p className="text-gray-300 mb-2">
                  <span className="font-semibold">Customer:</span> {form.getValues().name}
                </p>
                <p className="text-gray-300 mb-2">
                  <span className="font-semibold">Vehicle:</span> {form.getValues().year} {form.getValues().make} {form.getValues().model}
                </p>
                <p className="text-gray-300 mb-2">
                  <span className="font-semibold">Service:</span> {form.getValues().serviceDescription.substring(0, 50)}...
                </p>
                <p className="text-xs text-gray-500 mt-3 break-all">
                  Reference ID: {createdInvoiceId}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => {
                setShowSuccess(false);
                form.reset();
                setSelectedCustomerId(null);
                setActiveTab('new');
                setCreatedInvoiceId(null);
              }}
              className="bg-[#b22222] hover:bg-[#8c1c1c] text-white border-none px-4 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto max-w-xs"
            >
              Submit Another Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-[#0d0d0d] border-[#1f1f1f] text-white">
      <CardHeader className="border-b border-[#1f1f1f]">
        <CardTitle className="text-xl font-semibold">Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 px-3 sm:px-6">
        {formError && (
          <div className="mb-4 p-3 bg-[#3a0505] border border-[#b22222] rounded-md text-white">
            <p className="text-sm">{formError}</p>
          </div>
        )}
        
        <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2 mb-4 bg-[#131313]">
            <TabsTrigger value="new" className="data-[state=active]:bg-[#222] data-[state=active]:text-white">
              New Customer
            </TabsTrigger>
            <TabsTrigger value="existing" className="data-[state=active]:bg-[#222] data-[state=active]:text-white">
              Existing Customer
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="mt-0">
            <div className="mb-6">
              <label className="text-gray-300 mb-2 block">Select Existing Customer</label>
              
              <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  placeholder="Search customers by name, phone, or email..."
                  value={searchQuery}
                  onChange={handleCustomerSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 200)
                  }}
                  className="pl-10 bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]"
                />
              </div>
              
              <div 
                className={`max-h-[200px] overflow-y-auto border border-[#222] rounded-md transition-all duration-200 ${
                  isSearchFocused || searchQuery ? 'opacity-100 visible' : 'opacity-0 invisible h-0 border-0'
                }`}
              >
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      className={`p-3 cursor-pointer hover:bg-[#1A1A1A] border-b border-[#222] last:border-b-0 ${
                        selectedCustomerId === customer.id ? 'bg-[#222] text-white' : 'text-gray-300'
                      }`}
                      onClick={() => handleCustomerSelect(customer.id)}
                    >
                      <div className="font-medium">{customer.customer_name}</div>
                      <div className="text-xs text-gray-400 flex flex-wrap gap-x-4">
                        <span>{customer.customer_phone}</span>
                        {customer.customer_email && <span>{customer.customer_email}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400">No customers found</div>
                )}
              </div>
              
              {selectedCustomerId && (
                <div className="mt-4 p-3 bg-[#1A1A1A] rounded-md border border-[#333]">
                  <div className="text-sm text-white font-medium">
                    Selected: {existingCustomers.find(c => c.id === selectedCustomerId)?.customer_name}
                  </div>
                </div>
              )}
              
              {/* Vehicle Selector for existing customers */}
              {selectedCustomerId && customerVehicles.length > 0 && (
                <div className="mt-4">
                  <label className="text-gray-300 mb-2 block">Select Vehicle</label>
                  <Select onValueChange={handleVehicleSelect}>
                    <SelectTrigger className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]">
                      <SelectValue placeholder="Choose a vehicle or add a new one" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#222] text-white">
                      {customerVehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate || 'No plate'}
                        </SelectItem>
                      ))}
                      <SelectItem value="new" className="text-[#b22222]">+ Add New Vehicle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <p className="text-xs text-gray-400 mt-2">
                {selectedCustomerId 
                  ? customerVehicles.length > 0 
                    ? "Select a vehicle or add a new one." 
                    : "This customer has no vehicles. Please add one."
                  : "Select a customer to proceed with their information."
                }
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#b22222]">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Full Name <span className="text-[#b22222]">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                          className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]"
                          required
                        />
                      </FormControl>
                      <FormMessage className="text-[#b22222]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email <span className="text-gray-500 text-sm">(optional)</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          {...field} 
                          className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]"
                        />
                      </FormControl>
                      <FormMessage className="text-[#b22222]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Phone Number <span className="text-[#b22222]">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(123) 456-7890" 
                          {...field} 
                          className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]"
                          required
                        />
                      </FormControl>
                      <FormMessage className="text-[#b22222]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#b22222]">Vehicle Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Make <span className="text-[#b22222]">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Toyota" 
                          {...field} 
                          className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]"
                          required
                        />
                      </FormControl>
                      <FormMessage className="text-[#b22222]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Model <span className="text-[#b22222]">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Camry" 
                          {...field} 
                          className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]"
                          required
                        />
                      </FormControl>
                      <FormMessage className="text-[#b22222]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Year <span className="text-[#b22222]">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="2022" 
                          {...field} 
                          className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]"
                          required
                        />
                      </FormControl>
                      <FormMessage className="text-[#b22222]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">License Plate <span className="text-[#b22222]">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ABC123" 
                          {...field} 
                          className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]"
                          required
                        />
                      </FormControl>
                      <FormMessage className="text-[#b22222]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Service Description */}
            <FormField
              control={form.control}
              name="serviceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Service Description <span className="text-[#b22222]">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe the service you need in detail. Include any symptoms, issues, or specific work you'd like done..."
                      rows={4}
                      {...field} 
                      className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222] resize-none"
                      required
                    />
                  </FormControl>
                  <FormMessage className="text-[#b22222]" />
                  <p className="text-xs text-gray-400 mt-1">
                    {field.value.length}/500 characters
                  </p>
                </FormItem>
              )}
            />

            {/* Estimated Amount (optional) */}
            <FormField
              control={form.control}
              name="estimatedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Budget Range <span className="text-gray-500 text-sm">(optional)</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="text-gray-300 text-md self-center absolute left-2 top-1/2 -translate-y-1/2">$</span>
                      <Input 
                        type="number"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        {...field} 
                        className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222] pl-6"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[#b22222]" />
                  <p className="text-xs text-gray-400 mt-1">
                    This helps us provide accurate estimates
                  </p>
                </FormItem>
              )}
            />

            <div className="pt-6 flex flex-col space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-[#b22222] hover:bg-[#8c1c1c] text-white border-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Service Request'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 