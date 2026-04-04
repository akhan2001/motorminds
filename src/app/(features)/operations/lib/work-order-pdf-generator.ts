import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { WorkOrderPDFTemplate, getWorkOrderDocumentLabel } from '../components/work-orders/pdf/WorkOrderPDFTemplate'
import type { WorkOrderWithDetails } from '../types/work-order'
import type { WorkOrderItem } from '../types/work-order-items'
import type { ShopBranding } from '../../financials/types/invoice-pdf'
import { blobToBase64 } from '@/lib/utils/blob'

export function getWorkOrderFilename(workOrder: WorkOrderWithDetails): string {
    const label = getWorkOrderDocumentLabel(workOrder.status).toLowerCase().replace(/\s+/g, '-')
    return `${label}-${workOrder.work_order_number}.pdf`
}

export async function generateWorkOrderPDF(
    workOrder: WorkOrderWithDetails,
    workOrderItems: WorkOrderItem[],
    shop: ShopBranding
): Promise<Blob> {
    const doc = pdf(
        createElement(WorkOrderPDFTemplate, { workOrder, workOrderItems, shop })
    )
    return doc.toBlob()
}

export async function downloadWorkOrderPDF(
    workOrder: WorkOrderWithDetails,
    workOrderItems: WorkOrderItem[],
    shop: ShopBranding
): Promise<void> {
    const blob = await generateWorkOrderPDF(workOrder, workOrderItems, shop)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = getWorkOrderFilename(workOrder)
    link.click()
    URL.revokeObjectURL(url)
}

export async function generateWorkOrderPDFBase64(
    workOrder: WorkOrderWithDetails,
    workOrderItems: WorkOrderItem[],
    shop: ShopBranding
): Promise<string> {
    const blob = await generateWorkOrderPDF(workOrder, workOrderItems, shop)
    return blobToBase64(blob)
}
