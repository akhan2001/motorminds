import { pdf } from "@react-pdf/renderer";
import { InvoiceTemplate } from "../components/InvoiceTemplate";
import { InvoiceLandscape } from "../components/invoiceLandscape";

export async function generateInvoicePDF(invoice: any, isLandscape: boolean = false) {
    try {
        // Create a PDF blob based on the selected format
        const blob = await pdf(
            isLandscape 
                ? <InvoiceLandscape invoice={invoice} /> 
                : <InvoiceTemplate invoice={invoice} />
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