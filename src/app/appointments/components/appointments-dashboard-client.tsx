"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-dark-theme.css";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Car, Clock, User } from "lucide-react";
import { CreateAppointmentDialog } from "./create-appointment-dialog";
import { AppointmentDetailsDialog } from "./appointment-details-dialog";

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface Appointment {
    id: string;
    title: string;
    start: Date;
    end: Date;
    appointment_date: string;
    start_time: string;
    end_time: string;
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
    service_type: string;
    status: string;
    notes?: string;
    confirmation_code: string;
}

interface AppointmentsDashboardClientProps {
    shopId: string;
}

export default function AppointmentsDashboardClient({ shopId }: AppointmentsDashboardClientProps) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments');
            if (response.ok) {
                const data = await response.json();
                const formattedAppointments = data.map((apt: any) => ({
                    ...apt,
                    title: `${apt.customer?.customer_name || `${apt.customer?.first_name || ''} ${apt.customer?.last_name || ''}`.trim() || 'Unknown Customer'} - ${apt.service_type}`,
                    start: new Date(`${apt.appointment_date}T${apt.start_time}`),
                    end: new Date(`${apt.appointment_date}T${apt.end_time}`),
                }));
                setAppointments(formattedAppointments);
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEvent = (event: Appointment) => {
        setSelectedAppointment(event);
        setShowDetailsDialog(true);
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedDate(start);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-500';
            case 'confirmed': return 'bg-green-500';
            case 'in-progress': return 'bg-yellow-500';
            case 'completed': return 'bg-gray-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-blue-500';
        }
    };

    const eventStyleGetter = (event: Appointment) => {
        const getBackgroundColor = (status: string) => {
            switch (status) {
                case 'scheduled': return '#3b82f6'; // blue-500
                case 'confirmed': return '#22c55e'; // green-500
                case 'in-progress': return '#eab308'; // yellow-500
                case 'completed': return '#6b7280'; // gray-500
                case 'cancelled': return '#ef4444'; // red-500
                default: return '#3b82f6'; // blue-500
            }
        };
        
        return {
            style: {
                backgroundColor: getBackgroundColor(event.status),
                borderRadius: '5px',
                opacity: 0.9,
                color: 'white',
                border: 'none',
                display: 'block'
            }
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white">Loading appointments...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-black min-h-screen text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Appointments</h1>
                        <p className="text-zinc-400">Manage your shop's appointments and scheduling</p>
                    </div>
                    <Button 
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Appointment
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Calendar - Month View Only */}
                    <Card className="lg:col-span-3 bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle>Calendar View</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[600px] bg-zinc-800 rounded-lg p-4 border-none">
                                <Calendar
                                    localizer={localizer}
                                    events={appointments}
                                    startAccessor="start"
                                    endAccessor="end"
                                    view="month"
                                    views={['month']} // Restrict to month view only
                                    onSelectEvent={handleSelectEvent}
                                    onSelectSlot={handleSelectSlot}
                                    selectable
                                    eventPropGetter={eventStyleGetter}
                                    className="dark-calendar"
                                    popup={false}
                                    showMultiDayTimes
                                    step={30}
                                    timeslots={2}
                                    aria-label="Appointments calendar"
                                    role="application"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Date Appointments Sidebar */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle>
                                {selectedDate.toDateString() === new Date().toDateString() 
                                    ? "Today's Appointments" 
                                    : "Appointments"}
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                {selectedDate.toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {appointments
                                .filter(apt => {
                                    const aptDate = new Date(apt.start);
                                    return aptDate.toDateString() === selectedDate.toDateString();
                                })
                                .map((apt) => (
                                    <div 
                                        key={apt.id}
                                        className="p-3 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                                        onClick={() => handleSelectEvent(apt)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge className={`${getStatusColor(apt.status)} text-white`}>
                                                {apt.status}
                                            </Badge>
                                            <span className="text-sm text-zinc-400">
                                                {format(apt.start, 'h:mm a')}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm">
                                                <User className="w-3 h-3 mr-1" />
                                                {apt.customer?.customer_name || `${apt.customer?.first_name || ''} ${apt.customer?.last_name || ''}`.trim() || 'Unknown Customer'}
                                            </div>
                                            <div className="flex items-center text-sm text-zinc-400">
                                                <Car className="w-3 h-3 mr-1" />
                                                {apt.vehicle ? `${apt.vehicle.year || ''} ${apt.vehicle.make || ''} ${apt.vehicle.model || ''}`.trim() || 'Unknown Vehicle' : 'No vehicle info'}
                                            </div>
                                            <div className="text-sm text-zinc-300">
                                                {apt.service_type}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                            {appointments.filter(apt => {
                                const aptDate = new Date(apt.start);
                                return aptDate.toDateString() === selectedDate.toDateString();
                            }).length === 0 && (
                                <p className="text-zinc-400 text-center py-8">
                                    {selectedDate.toDateString() === new Date().toDateString() 
                                        ? "No appointments today" 
                                        : "No appointments on this date"}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Appointment Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <Clock className="w-4 h-4 text-white" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-zinc-400">Today</p>
                                    <p className="text-lg font-semibold">
                                        {appointments.filter(apt => {
                                            const today = new Date();
                                            const aptDate = new Date(apt.start);
                                            return aptDate.toDateString() === today.toDateString();
                                        }).length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-600 rounded-lg">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-zinc-400">Confirmed</p>
                                    <p className="text-lg font-semibold">
                                        {appointments.filter(apt => apt.status === 'confirmed').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-600 rounded-lg">
                                    <Car className="w-4 h-4 text-white" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-zinc-400">In Progress</p>
                                    <p className="text-lg font-semibold">
                                        {appointments.filter(apt => apt.status === 'in-progress').length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-600 rounded-lg">
                                    <Plus className="w-4 h-4 text-white" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-zinc-400">Total</p>
                                    <p className="text-lg font-semibold">{appointments.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Dialogs */}
                <CreateAppointmentDialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                    onSuccess={fetchAppointments}
                    initialDate={selectedDate}
                />

                <AppointmentDetailsDialog
                    open={showDetailsDialog}
                    onOpenChange={setShowDetailsDialog}
                    appointment={selectedAppointment && selectedAppointment.appointment_date ? selectedAppointment : null}
                    onSuccess={fetchAppointments}
                />
            </div>
        </div>
    );
}
