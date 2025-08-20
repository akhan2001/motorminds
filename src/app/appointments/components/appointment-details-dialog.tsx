"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { User, Car, Clock, FileText, Trash2, Edit3 } from "lucide-react";

interface Appointment {
    id: string;
    title?: string;
    start?: Date;
    end?: Date;
    customer: {
        customer_name?: string;
        first_name?: string;
        last_name?: string;
        customer_email?: string;
        email?: string;
        customer_phone?: string;
        phone_number?: string;
    };
    vehicle: {
        year?: number;
        make?: string;
        model?: string;
        vin?: string;
        license_plate?: string;
        engine_type?: string;
        color?: string;
        mileage?: number;
    };
    appointment_date: string;
    start_time: string;
    end_time: string;
    service_type: string;
    status: string;
    notes?: string;
    confirmation_code: string;
    repair_orders?: any[];
}

interface AppointmentDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: Appointment | null;
    onSuccess: () => void;
}

const STATUS_OPTIONS = [
    { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-500' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export function AppointmentDetailsDialog({
    open,
    onOpenChange,
    appointment,
    onSuccess
}: AppointmentDetailsDialogProps) {
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        appointment_date: "",
        start_time: "",
        end_time: "",
        service_type: "",
        status: "",
        notes: ""
    });

    const handleEdit = () => {
        if (appointment) {
            setFormData({
                appointment_date: appointment.appointment_date,
                start_time: appointment.start_time,
                end_time: appointment.end_time,
                service_type: appointment.service_type,
                status: appointment.status,
                notes: appointment.notes || ""
            });
            setEditing(true);
        }
    };

    const handleSave = async () => {
        if (!appointment) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/appointments/${appointment.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success('Appointment updated successfully!');
                onSuccess();
                setEditing(false);
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to update appointment');
            }
        } catch (error) {
            console.error('Failed to update appointment:', error);
            toast.error('Failed to update appointment');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!appointment) return;
        
        if (!confirm('Are you sure you want to delete this appointment?')) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/appointments/${appointment.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('Appointment deleted successfully!');
                onSuccess();
                onOpenChange(false);
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to delete appointment');
            }
        } catch (error) {
            console.error('Failed to delete appointment:', error);
            toast.error('Failed to delete appointment');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusOption = STATUS_OPTIONS.find(option => option.value === status);
        return (
            <Badge className={`${statusOption?.color || 'bg-gray-500'} text-white`}>
                {statusOption?.label || status}
            </Badge>
        );
    };

    if (!appointment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Appointment Details</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                {appointment && appointment.appointment_date && appointment.start_time 
                                    ? format(new Date(`${appointment.appointment_date}T${appointment.start_time}`), 'PPP p')
                                    : 'No date information available'
                                }
                            </DialogDescription>
                        </div>
                        {getStatusBadge(editing ? formData.status : appointment.status)}
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Customer & Vehicle Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-zinc-400" />
                                <span className="font-medium">Customer</span>
                            </div>
                            <div className="pl-6 space-y-1">
                                <div className="font-medium">
                                    {appointment.customer?.customer_name || appointment.customer?.first_name + ' ' + appointment.customer?.last_name || 'Unknown Customer'}
                                </div>
                                <div className="text-sm text-zinc-400">{appointment.customer?.customer_email || appointment.customer?.email || 'No email'}</div>
                                <div className="text-sm text-zinc-400">{appointment.customer?.customer_phone || appointment.customer?.phone_number || 'No phone'}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-zinc-400" />
                                <span className="font-medium">Vehicle</span>
                            </div>
                            <div className="pl-6 space-y-1">
                                <div className="font-medium">
                                    {appointment.vehicle 
                                        ? `${appointment.vehicle.year || ''} ${appointment.vehicle.make || ''} ${appointment.vehicle.model || ''}`.trim() || 'Unknown Vehicle'
                                        : 'No vehicle information'
                                    }
                                </div>
                                <div className="text-sm text-zinc-400">
                                    License: {appointment.vehicle?.license_plate || 'Not specified'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-400" />
                            <span className="font-medium">Appointment Details</span>
                        </div>

                        {editing ? (
                            <div className="pl-6 space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.appointment_date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                                            className="bg-zinc-800 border-zinc-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="start_time">Start Time</Label>
                                        <Input
                                            id="start_time"
                                            type="time"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                            className="bg-zinc-800 border-zinc-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end_time">End Time</Label>
                                        <Input
                                            id="end_time"
                                            type="time"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                            className="bg-zinc-800 border-zinc-600"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="service_type">Service Type</Label>
                                        <Input
                                            id="service_type"
                                            value={formData.service_type}
                                            onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
                                            className="bg-zinc-800 border-zinc-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                                        >
                                            <SelectTrigger className="bg-zinc-800 border-zinc-600">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-800 border-zinc-600">
                                                {STATUS_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="pl-6 space-y-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-zinc-400">Time:</span> {appointment.start_time} - {appointment.end_time}
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Service:</span> {appointment.service_type}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-zinc-400">Confirmation:</span> {appointment.confirmation_code}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-zinc-400" />
                            <span className="font-medium">Notes</span>
                        </div>
                        {editing ? (
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="bg-zinc-800 border-zinc-600"
                                placeholder="Additional notes..."
                            />
                        ) : (
                            <div className="pl-6 text-zinc-300">
                                {appointment.notes || 'No notes'}
                            </div>
                        )}
                    </div>

                    {/* Work Orders */}
                    {appointment.repair_orders && appointment.repair_orders.length > 0 && (
                        <div className="space-y-3">
                            <span className="font-medium">Associated Work Orders</span>
                            <div className="space-y-2">
                                {appointment.repair_orders.map((order: any) => (
                                    <div key={order.id} className="p-3 bg-zinc-800 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{order.order_number}</span>
                                            <Badge variant="outline">{order.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    {editing ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setEditing(false)}
                                className="border-zinc-600"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                disabled={loading}
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                            <Button
                                onClick={handleEdit}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
