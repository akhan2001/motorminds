import { Calendar, Clock, User, Car, Bell, CheckCircle2 } from 'lucide-react'
import { InfoContent } from '../types'

export const appointmentsInfo: InfoContent = {
    sections: [
        {
            title: 'What are Appointments?',
            description: 'Appointments help you schedule and manage customer visits, ensuring efficient workflow and better customer service.',
            icon: Calendar,
        },
        {
            title: 'Scheduling Features',
            icon: Clock,
            items: [
                'View appointments in calendar or list view',
                'Schedule appointments for registered and walk-in customers',
                'Set appointment duration and time slots',
                'Assign technicians to appointments',
                'Set appointment types (service, consultation, pickup, etc.)',
            ],
        },
        {
            title: 'Customer Management',
            icon: User,
            items: [
                'Link appointments to customer profiles',
                'View customer appointment history',
                'Send appointment reminders',
                'Track no-shows and cancellations',
            ],
        },
        {
            title: 'Vehicle Information',
            icon: Car,
            items: [
                'Link appointments to specific vehicles',
                'View vehicle service history',
                'Prepare work orders in advance',
            ],
        },
        {
            title: 'Notifications',
            icon: Bell,
            items: [
                'Automated reminder notifications',
                'Email and SMS confirmations',
                'Status change notifications',
            ],
        },
        {
            title: 'Best Practices',
            icon: CheckCircle2,
            items: [
                'Schedule appointments with buffer time',
                'Confirm appointments 24 hours in advance',
                'Update appointment status promptly',
                'Link appointments to work orders when service begins',
                'Follow up on missed appointments',
            ],
        },
    ],
}
