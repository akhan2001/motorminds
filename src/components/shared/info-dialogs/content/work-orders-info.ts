import { FileText, Users, Wrench, DollarSign, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { InfoContent } from '../types'

export const workOrdersInfo: InfoContent = {
    sections: [
        {
            title: 'What is a Work Order?',
            description: 'A work order is a document that tracks all service work performed on a customer\'s vehicle, from initial request to completion and invoicing.',
            icon: FileText,
        },
        {
            title: 'Work Order Lifecycle',
            description: 'Work orders progress through several stages:',
            icon: ArrowRight,
            steps: [
                'Pending: Initial work order created, awaiting technician assignment',
                'In Progress: Work has begun on the vehicle',
                'Ready: Vehicle is ready for customer pickup',
                'Completed: All work is finished and invoice is generated',
            ],
        },
        {
            title: 'Key Features',
            icon: Wrench,
            items: [
                'Track labor, parts, expenses, and discounts',
                'Link to customer and vehicle information',
                'Assign technicians and set priorities',
                'Generate invoices directly from work orders',
                'Add recommendations and notes for future reference',
                'View complete work history per customer',
            ],
        },
        {
            title: 'Customer Types',
            icon: Users,
            items: [
                'Registered Customers: Existing customers with saved profiles',
                'Walk-In Customers: One-time customers without accounts',
            ],
        },
        {
            title: 'Invoicing',
            icon: DollarSign,
            items: [
                'Convert work orders to invoices automatically',
                'Sync work order items to invoice items',
                'Include work order recommendations in invoices',
                'Track payments and outstanding balances',
            ],
        },
        {
            title: 'Best Practices',
            icon: CheckCircle2,
            items: [
                'Always add a clear title and description',
                'Set appropriate priority levels',
                'Assign technicians for better tracking',
                'Add recommendations for future service',
                'Keep notes updated throughout the process',
                'Review cost summary before completing',
            ],
        },
    ],
}
