/**
 * HTML-to-PDF generator for Tony template
 * Uses html2canvas and jsPDF to convert HTML to PDF
 * This ensures the PDF matches the preview exactly
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Generate PDF from HTML element using html2canvas and jsPDF
 * @param element - HTML element to convert to PDF
 * @param filename - Name of the PDF file
 * @param options - Additional options for PDF generation
 */
export async function generatePDFFromHTML(
    element: HTMLElement,
    filename: string = 'invoice.pdf',
    options: {
        width?: number // A4 width in mm (default: 210)
        height?: number // A4 height in mm (default: 297)
        marginHorizontal?: number // Left/right margin in mm (default: 3)
        marginVertical?: number // Top/bottom margin in mm (default: 4)
        scale?: number // Scale factor (default: 3 for better quality - higher = sharper but larger file)
    } = {}
): Promise<void> {
    const {
        width = 210, // A4 width in mm
        height = 297, // A4 height in mm
        marginHorizontal = 3, // Default left/right padding (under 5mm)
        marginVertical = 4, // Default top/bottom padding (under 5mm)
        scale = 3, // Higher scale for better quality (3x = sharp, 2x = acceptable)
    } = options

    try {
        // Wait a bit to ensure fonts and images are fully loaded
        await new Promise(resolve => setTimeout(resolve, 100))

        // Convert HTML to canvas with high quality
        // Higher scale = better quality but larger file size
        const canvas = await html2canvas(element, {
            scale: scale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: element.scrollWidth,
            height: element.scrollHeight,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            allowTaint: false,
            removeContainer: false,
            imageTimeout: 15000,
            // Quality improvements
            onclone: (clonedDoc) => {
                // Ensure fonts are loaded and rendered properly
                const clonedElement = (clonedDoc.querySelector('[data-pdf-element]') || clonedDoc.body) as HTMLElement
                if (clonedElement && clonedElement.style) {
                    // Improve font rendering
                    clonedElement.style.setProperty('font-smoothing', 'antialiased')
                    clonedElement.style.setProperty('-webkit-font-smoothing', 'antialiased')
                    clonedElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale')
                    // Ensure sharp rendering
                    clonedElement.style.setProperty('image-rendering', 'crisp-edges')
                    clonedElement.style.setProperty('text-rendering', 'optimizeLegibility')
                }
            },
        })

        // Calculate PDF dimensions
        const imgWidth = width - marginHorizontal * 2
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Create PDF
        const pdf = new jsPDF({
            orientation: imgHeight > width ? 'portrait' : 'landscape',
            unit: 'mm',
            format: [width, height] as [number, number],
        })

        // Add image to PDF with high quality
        // Use maximum quality (1.0) for PNG
        const imgData = canvas.toDataURL('image/png', 1.0)
        
        // Calculate position with separate horizontal and vertical margins
        const x = marginHorizontal
        const y = marginVertical

        // If content is taller than one page, split across multiple pages
        let heightLeft = imgHeight
        let position = 0
        const pageHeight = height - marginVertical * 2

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
        heightLeft -= pageHeight

        // Add additional pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', x, marginVertical + position, imgWidth, imgHeight)
            heightLeft -= pageHeight
        }

        // Save PDF
        pdf.save(filename)
    } catch (error) {
        console.error('Error generating PDF from HTML:', error)
        throw error
    }
}

/**
 * Generate PDF from HTML element with A4 dimensions
 * Specifically for invoice templates
 */
export async function generateInvoicePDFFromHTML(
    element: HTMLElement,
    filename: string
): Promise<void> {
    return generatePDFFromHTML(element, filename, {
        width: 210, // A4 width
        height: 297, // A4 height
        marginHorizontal: 3, // 3mm left/right padding (under 5mm)
        marginVertical: 4, // 4mm top/bottom padding (under 5mm)
        scale: 3, // High quality (3x scale for sharp text and images)
    })
}

