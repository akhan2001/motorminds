import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { getTemplate } from './template-registry'
import type { InvoiceWithDetails } from '../../types/invoice'
import type { ShopBranding, InvoicePDFData } from '../../types/invoice-pdf'

/**
 * Generate PDF blob from invoice data
 * Optimized for performance - generates on-demand, no caching
 */
export async function generateInvoicePDF(
    invoice: InvoiceWithDetails,
    shop: ShopBranding,
    templateId: string = 'professional'
): Promise<Blob> {
    const template = getTemplate(templateId)
    const TemplateComponent = template.component

    // Create PDF data object
    const pdfData: InvoicePDFData = { invoice, shop }

    // Generate PDF using @react-pdf/renderer
    // @ts-ignore - TemplateComponent returns Document but TypeScript can't infer this
    const doc = pdf(createElement(TemplateComponent, pdfData))
    const blob = await doc.toBlob()

    return blob
}

/**
 * Download PDF to user's device
 */
export function downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Generate filename for invoice PDF
 */
export function getInvoiceFilename(invoice: InvoiceWithDetails): string {
    const invoiceNumber = invoice.display_id || invoice.invoice_number
    const date = new Date(invoice.issue_date).toISOString().split('T')[0]
    return `Invoice_${invoiceNumber}_${date}.pdf`
}

