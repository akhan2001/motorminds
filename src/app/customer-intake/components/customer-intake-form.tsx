'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Import the utility functions
import { createNewCustomer } from '@/app/customers/api/customer-utils'

// UI components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Form validation schema
const formSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name is too long' }),
  
  email: z.string()
    .email({ message: 'Please enter a valid email address' })
    .optional()
    .or(z.literal('')), // Allow empty string
  
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
})

type FormValues = z.infer<typeof formSchema>

interface CustomerIntakeFormProps {
  shopId: string
  user: any
}

export default function CustomerIntakeForm({ shopId, user }: CustomerIntakeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
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
    },
    mode: 'onBlur',
  })

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

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    setFormError(null)
    
    try {
      // Create the customer 
      const customerData = {
        customer_name: data.name,
        customer_email: data.email || null,
        customer_phone: data.phone,
        customer_address: "",
      };
      
      // Use the existing utility function
      const newCustomer = await createNewCustomer(customerData, shopId);
      
      if (!newCustomer) {
        throw new Error('Failed to create customer');
      }
      
      // Update the customer to add the license plate
      const customerId = newCustomer.id;
      const { error: updateError } = await supabase
        .from('customers')
        .update({ license_plate: data.licensePlate })
        .eq('id', customerId);
        
      if (updateError) {
        console.error("Error updating customer with license plate:", updateError);
      }
      
      // Create the vehicle in the customer_vehicles table
      const { error: vehicleError } = await supabase
        .from('customer_vehicles')
        .insert({
          customer_id: customerId,
          make: data.make,
          model: data.model,
          year: parseInt(data.year),
          license_plate: data.licensePlate,
          created_at: new Date().toISOString()
        });
      
      if (vehicleError) {
        throw new Error(`Vehicle creation failed: ${vehicleError.message || 'Unknown error'}`);
      }
      
      toast.success('Customer and vehicle added successfully')
      form.reset();
      
    } catch (error: any) {
      setFormError(error.message || 'Failed to submit form');
      toast.error(`Error: ${error.message || 'Failed to submit form'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-[#0d0d0d] border-[#1f1f1f] text-white">
      <CardHeader className="border-b border-[#1f1f1f]">
        <CardTitle className="text-xl font-semibold">Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {formError && (
          <div className="mb-4 p-3 bg-[#3a0505] border border-[#b22222] rounded-md text-white">
            <p className="text-sm">{formError}</p>
          </div>
        )}
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
            <div className="space-y-4 pt-4">
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

            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full bg-[#b22222] hover:bg-[#8c1c1c] text-white border-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 