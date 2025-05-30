'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface VehicleServiceFormProps {
    vehicleId: string
    vehicleName: string
    serviceTypes: string[]
}

export function VehicleServiceForm({ vehicleId, vehicleName, serviceTypes }: VehicleServiceFormProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [serviceType, setServiceType] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const { error } = await supabase
                .from('shop_contact_requests')
                .insert({
                    vehicle_id: vehicleId,
                    message: `Service Request for ${vehicleName}
Type: ${serviceType}
Customer: ${name}
Contact: ${email} / ${phone}
Details: ${description}`
                })

            if (error) throw error

            toast.success('Service request submitted successfully')
            setName('')
            setEmail('')
            setPhone('')
            setServiceType('')
            setDescription('')
        } catch (error) {
            console.error('Error submitting service request:', error)
            toast.error('Failed to submit service request')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Input
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                />
            </div>
            <div>
                <Select value={serviceType} onValueChange={setServiceType} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Service Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {serviceTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Textarea
                    placeholder="Describe your service needs..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                    required
                />
            </div>
            <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Submitting...' : 'Schedule Service'}
            </Button>
        </form>
    )
} 