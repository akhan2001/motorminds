'use client'

import { useSearchParams } from 'next/navigation'
import InvoiceDashboard from './invoice-dashboard'

export default function InvoiceDashboardClient({ shopId }: { shopId: string }) {
    const searchParams = useSearchParams()
    return <InvoiceDashboard shopId={shopId} searchParams={searchParams} />
} 