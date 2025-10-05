import { pdf } from "@react-pdf/renderer";
import { StatementTemplate } from "../components/StatementTemplate";
import { 
    StatementData, 
    StatementCustomer, 
    StatementShopInfo, 
    StatementDateRange 
} from "../types/statement";
import {
    fetchCustomerInvoices,
    fetchPreviousInvoices,
    calculateStatementTotals,
    calculateRunningBalance,
    generateStatementNumber,
    formatStatementDate
} from "./statement-utils";

/**
 * Generate customer statement PDF
 */
export async function generateCustomerStatementPDF(
    customer: StatementCustomer,
    shopInfo: StatementShopInfo,
    shopId: string,
    dateRange: StatementDateRange
): Promise<Blob> {
    try {
        console.log("Generating statement for customer:", customer.customer_name);

        // Fetch invoices in the date range
        const currentInvoices = await fetchCustomerInvoices(
            customer.id,
            shopId,
            dateRange
        );

        // Fetch previous invoices to calculate starting balance
        const previousInvoices = await fetchPreviousInvoices(
            customer.id,
            shopId,
            dateRange.start
        );

        console.log("Current invoices:", currentInvoices.length);
        console.log("Previous invoices:", previousInvoices.length);

        // Calculate totals
        const totals = calculateStatementTotals(currentInvoices, previousInvoices);

        // Calculate running balance for transactions
        const transactions = calculateRunningBalance(
            currentInvoices,
            totals.previousBalance
        );

        // Generate statement number
        const statementNumber = generateStatementNumber(shopId, customer.id);

        // Format the statement data
        const statementData: StatementData = {
            statementNumber,
            generatedDate: formatStatementDate(new Date()),
            dateRange,
            customer,
            shop: shopInfo,
            totals,
            transactions
        };

        console.log("Statement data prepared:", {
            statementNumber,
            transactionCount: transactions.length,
            currentBalance: totals.currentBalance
        });

        // Generate PDF
        const blob = await pdf(
            <StatementTemplate statement={statementData} />
        ).toBlob();

        console.log("PDF generated successfully");

        return blob;
    } catch (error) {
        console.error("Error generating statement PDF:", error);
        throw error;
    }
}

/**
 * Download the statement PDF
 */
export async function downloadStatementPDF(
    customer: StatementCustomer,
    shopInfo: StatementShopInfo,
    shopId: string,
    dateRange: StatementDateRange
): Promise<void> {
    try {
        // Generate the PDF blob
        const blob = await generateCustomerStatementPDF(
            customer,
            shopInfo,
            shopId,
            dateRange
        );

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Format filename
        const customerName = customer.customer_name.replace(/[^a-z0-9]/gi, '_');
        const startDate = dateRange.start.toISOString().split('T')[0];
        const endDate = dateRange.end.toISOString().split('T')[0];
        link.download = `statement_${customerName}_${startDate}_to_${endDate}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        console.log("Statement downloaded successfully");
    } catch (error) {
        console.error("Error downloading statement PDF:", error);
        throw error;
    }
}

