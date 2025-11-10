import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { getTemplate } from './template-registry'
import type { InvoiceWithDetails } from '../../types/invoice'
import type { ShopBranding, InvoicePDFData } from '../../types/invoice-pdf'
import { generateInvoicePDFFromHTML } from './html-pdf-generator'
import { hasTemplateAccess } from './template-restrictions'

/**
 * Generate PDF blob from invoice data
 * For 'tony' template, uses HTML-to-PDF conversion for exact match with preview
 * For other templates, uses @react-pdf/renderer
 * Optimized for performance - generates on-demand, no caching
 */
export async function generateInvoicePDF(
    invoice: InvoiceWithDetails,
    shop: ShopBranding,
    templateId: string = 'professional',
    htmlElement?: HTMLElement // Optional HTML element for HTML-to-PDF conversion (tony template)
): Promise<Blob> {
    // Validate template access restrictions using shop_id
    if (!hasTemplateAccess(templateId, shop.id)) {
        throw new Error(`Template "${templateId}" is not available for this shop`)
    }
    
    // Special handling for tony template - use HTML-to-PDF
    if (templateId === 'tony' && htmlElement) {
        // For HTML-to-PDF, we need to generate the PDF directly (not return a blob)
        // This is handled differently - see generateInvoicePDFFromHTMLElement
        throw new Error('Use generateInvoicePDFFromHTMLElement for tony template')
    }

    // Standard React-PDF generation for other templates
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
 * Generate PDF from HTML element (specifically for tony template)
 * This ensures the PDF matches the preview exactly
 */
export async function generateInvoicePDFFromHTMLElement(
    htmlElement: HTMLElement,
    invoice: InvoiceWithDetails
): Promise<void> {
    const filename = getInvoiceFilename(invoice)
    await generateInvoicePDFFromHTML(htmlElement, filename)
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

