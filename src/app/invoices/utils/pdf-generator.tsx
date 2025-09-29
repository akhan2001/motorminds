import { pdf } from "@react-pdf/renderer";
import { InvoiceTemplate } from "../components/InvoiceTemplate";
import { InvoiceLandscape } from "../components/invoiceLandscape";
import { ModernInvoiceTemplate } from "../components/ModernInvoiceTemplate";
import { ModernInvoiceLandscape } from "../components/ModernInvoiceLandscape";

export async function generateInvoicePDF(invoice: any, isLandscape: boolean = false) {
    try {
        // Handle potential logo loading errors gracefully
        if (invoice.shopLogo) {
            // Try to load the image before generating the PDF
            await new Promise((resolve) => {
                // Try both JPEG and PNG formats
                const tryLoadImage = (format: string) => {
                    const img = new Image();
                    const url = `${invoice.shopLogo}.${format}?t=${Date.now()}`;
                    
                    img.onload = () => {
                        console.log(`${format.toUpperCase()} logo loaded successfully`);
                        invoice.shopLogo = url;
                        resolve(void 0);
                    };
                    
                    img.onerror = () => {
                        if (format === 'jpeg') {
                            console.log("JPEG logo not found, trying PNG format");
                            tryLoadImage('png');
                        } else {
                            console.warn("Neither JPEG nor PNG logo could be loaded, using fallback");
                            invoice.shopLogo = null;
                            resolve(void 0);
                        }
                    };
                    
                    img.src = url;
                };
                
                // Start with JPEG
                tryLoadImage('jpeg');
            });
        }
        
        // Now create the PDF after image loading is complete
        const blob = await pdf(
            isLandscape 
                ? <ModernInvoiceLandscape invoice={invoice} /> 
                : <ModernInvoiceTemplate invoice={invoice} />
        ).toBlob();

        // Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.invoiceNumber}.pdf`;

        // Trigger the download
        link.click();

        // Clean up the URL object
        URL.revokeObjectURL(url);

        // Return the blob
        return blob;
    } catch (error) {
        console.error("Error generating invoice PDF:", error);
        throw error;
    }
}