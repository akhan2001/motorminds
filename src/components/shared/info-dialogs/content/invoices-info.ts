import { Receipt, DollarSign, FileText, CreditCard, CheckCircle2, TrendingUp } from 'lucide-react'
import { InfoContent } from '../types'

export const invoicesInfo: InfoContent = {
    sections: [
        {
            title: 'What are Invoices?',
            description: 'Invoices are billing documents generated from work orders, detailing all services, parts, and charges for customer payment.',
            icon: Receipt,
        },
        {
            title: 'Invoice Creation',
            icon: FileText,
            items: [
                'Automatically generated from completed work orders',
                'Includes all work order items (labor, parts, expenses)',
                'Contains work order recommendations and notes',
                'Links to customer and vehicle information',
                'Supports both registered and walk-in customers',
            ],
        },
        {
            title: 'Payment Tracking',
            icon: CreditCard,
            items: [
                'Track payment status (draft, sent, viewed, paid)',
                'Record partial payments',
                'Calculate outstanding balances',
                'Support multiple payment methods',
                'Track payment dates and references',
            ],
        },
        {
            title: 'Financial Features',
            icon: DollarSign,
            items: [
                'Automatic tax calculations (HST)',
                'Discount and fee management',
                'Multiple invoice templates',
                'PDF generation and email sending',
                'SMS invoice sharing',
            ],
        },
        {
            title: 'Reporting',
            icon: TrendingUp,
            items: [
                'View invoice history per customer',
                'Track revenue and outstanding amounts',
                'Generate financial reports',
                'Export invoice data',
            ],
        },
        {
            title: 'Best Practices',
            icon: CheckCircle2,
            items: [
                'Review invoice details before sending',
                'Send invoices promptly after work completion',
                'Follow up on overdue invoices',
                'Keep payment records updated',
                'Use professional invoice templates',
                'Include clear payment instructions',
            ],
        },
    ],
}
