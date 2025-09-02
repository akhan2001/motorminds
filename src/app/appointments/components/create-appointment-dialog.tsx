"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface Customer {
    id: string;
    customer_name?: string;
    first_name?: string;
    last_name?: string;
    customer_email?: string;
    email?: string;
    customer_phone?: string;
    phone_number?: string;
}

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
}

interface CreateAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialDate?: Date;
}

const SERVICE_TYPES = [
    "Oil Change",
    "Brake Inspection",
    "Tire Rotation",
    "Engine Diagnostic",
    "Transmission Service",
    "AC Repair",
    "Battery Service",
    "General Inspection",
    "Custom Service"
];

export function CreateAppointmentDialog({
    open,
    onOpenChange,
    onSuccess,
    initialDate
}: CreateAppointmentDialogProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [formData, setFormData] = useState({
        customer_id: "",
        vehicle_id: "",
        appointment_date: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
        start_time: "",
        end_time: "",
        service_type: "",
        notes: ""
    });

    useEffect(() => {
        if (open) {
            fetchCustomers();
        }
    }, [open]);

    useEffect(() => {
        if (formData.customer_id) {
            fetchCustomerVehicles(formData.customer_id);
        }
    }, [formData.customer_id]);

    useEffect(() => {
        if (formData.appointment_date) {
            fetchAvailableSlots(formData.appointment_date);
        }
    }, [formData.appointment_date]);

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        }
    };

    const fetchCustomerVehicles = async (customerId: string) => {
        try {
            const response = await fetch(`/api/customers/${customerId}/vehicles`);
            if (response.ok) {
                const data = await response.json();
                setVehicles(data);
            }
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
        }
    };

    const fetchAvailableSlots = async (date: string) => {
        setLoadingSlots(true);
        try {
            const response = await fetch(`/api/appointments/availability?date=${date}`);
            if (response.ok) {
                const data = await response.json();
                setAvailableSlots(data.availableSlots || []);
            }
        } catch (error) {
            console.error('Failed to fetch available slots:', error);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success('Appointment created successfully!');
                onSuccess();
                onOpenChange(false);
                resetForm();
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to create appointment');
            }
        } catch (error) {
            console.error('Failed to create appointment:', error);
            toast.error('Failed to create appointment');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            customer_id: "",
            vehicle_id: "",
            appointment_date: "",
            start_time: "",
            end_time: "",
            service_type: "",
            notes: ""
        });
        setVehicles([]);
        setAvailableSlots([]);
    };

    const handleTimeSlotSelect = (slot: any) => {
        setFormData(prev => ({
            ...prev,
            start_time: slot.start_time,
            end_time: slot.end_time
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Appointment</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Schedule a new appointment for a customer
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_id">Customer</Label>
                            <Select
                                value={formData.customer_id}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-600">
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-600">
                                    {Array.isArray(customers) && customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.customer_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicle_id">Vehicle</Label>
                            <Select
                                value={formData.vehicle_id}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
                                disabled={!formData.customer_id}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-600">
                                    <SelectValue placeholder="Select vehicle" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-600">
                                    {vehicles.map((vehicle) => (
                                        <SelectItem key={vehicle.id} value={vehicle.id}>
                                            {vehicle.year} {vehicle.make} {vehicle.model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="appointment_date">Date</Label>
                            <Input
                                id="appointment_date"
                                type="date"
                                value={formData.appointment_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                                className="bg-zinc-800 border-zinc-600"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="service_type">Service Type</Label>
                            <Select
                                value={formData.service_type}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-600">
                                    <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-600">
                                    {SERVICE_TYPES.map((service) => (
                                        <SelectItem key={service} value={service}>
                                            {service}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Available Time Slots */}
                    {formData.appointment_date && (
                        <div className="space-y-2">
                            <Label>Available Time Slots</Label>
                            {loadingSlots ? (
                                <div className="text-zinc-400">Loading available slots...</div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                                    {availableSlots.map((slot, index) => (
                                        <Button
                                            key={index}
                                            type="button"
                                            variant={formData.start_time === slot.start_time ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleTimeSlotSelect(slot)}
                                            className="text-xs"
                                        >
                                            {slot.start_time}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="bg-zinc-800 border-zinc-600"
                            placeholder="Additional notes about the appointment..."
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-zinc-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.customer_id || !formData.vehicle_id || !formData.start_time}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? 'Creating...' : 'Create Appointment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
