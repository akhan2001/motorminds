import { pdf } from "@react-pdf/renderer";
import { InvoiceTemplate } from "../components/InvoiceTemplate";
import { getShopBranding } from "@/utils/supabase/supabase-shop";

export async function generateInvoicePDF(invoice: any) {
    try {   
        // Create a PDF blob
        let shopBranding = null;
        
        // console.log("Invoice data:", JSON.stringify({
        //     shopId: invoice.shopId,
        //     invoiceNumber: invoice.invoiceNumber,
        //     shopName: invoice.shopName
        // }));
        
        // Only try to fetch shop branding if shopId exists and is valid
        if (invoice.shopId && typeof invoice.shopId === 'string' && invoice.shopId.trim() !== '') {
            try {
                // console.log("Fetching shop branding for shopId:", invoice.shopId);
                shopBranding = await getShopBranding(invoice.shopId);
                // console.log("Shop branding fetched:", shopBranding);
            } catch (error) {
                // console.error("Error fetching shop branding:", error);
                // Continue without branding if there's an error
            }
        } else {
            // console.log("No valid shopId found for branding");
        }
        
        // console.log("Generating PDF with shopBranding:", shopBranding);
        const blob = await pdf(<InvoiceTemplate invoice={invoice} shopBranding={shopBranding} />).toBlob();

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
        // console.error("Error generating invoice PDF:", error);
        throw error;
    }
}