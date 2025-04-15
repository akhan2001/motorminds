import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatPhoneNumber } from "../utils/invoice-utils";
import { getShopBranding } from "@/utils/supabase/supabase-shop";
import { useState } from "react";
import { useEffect } from "react";

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 20,
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    companyInfo: {
        width: '100%'
    },
    companyName: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4
    },
    detailFonts: {
        fontSize: 10,
        color: '#555',
        marginBottom: 2
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 2
    },
    invoiceNumber: {
        fontSize: 15,
        color: '#555',
        marginBottom: 2
    },
    invoiceDetails: {
        marginBottom: 10
    },
    invoiceDate: {
        textAlign: 'right',
        fontSize: 10,
        color: '#555'
    },
    customerSection: {
        marginTop: 20,
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
        backgroundColor: '#f0f0f0',
        padding: 6
    },
    customerInfo: {
        fontSize: 12,
        marginBottom: 3
    },
    table: {
        marginTop: 20
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#cccccc',
        fontWeight: 'bold'
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee'
    },
    descCol: { width: '70%', fontSize: 10 },
    // qtyCol: { width: '15%', fontSize: 10, textAlign: 'center' },
    // rateCol: { width: '20%', fontSize: 10, textAlign: 'right' },
    amountCol: { width: '30%', fontSize: 10, textAlign: 'right' },
    summarySection: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#cccccc',
        paddingTop: 10
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        fontSize: 12,
        marginBottom: 5
    },
    summaryLabel: {
        width: '20%',
        textAlign: 'right',
        paddingRight: 10
    },
    summaryValue: {
        width: '25%',
        textAlign: 'right',
        fontWeight: 'bold'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 5,
        marginBottom: 10,
        borderTopWidth: 2,
        borderTopColor: '#333',
        paddingTop: 5
    },
    footer: {
        marginTop: 40,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#cccccc',
        fontSize: 10,
        textAlign: 'center',
        color: '#555',
        position: 'relative',
        bottom: 0
    },
    paymentInfo: {
        marginTop: 20,
        fontSize: 10,
        color: '#555'
    },
    paymentTitle: {
        fontWeight: 'bold',
        marginBottom: 3
    },
    detailsSection: {
        marginBottom: 10
    },
    detailLabel: {
        fontWeight: 'bold'
    },
    detailContent: {
        marginBottom: 5
    }
});

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const InvoiceTemplate = ({ invoice }: { invoice: any }) => {
    const [shopBranding, setShopBranding] = useState<any>(null);

    useEffect(() => {
        getShopBranding(invoice.shopId).then((data) => {
            setShopBranding(data);
        });
    }, [invoice.shopId]);
    
    // Format currency
    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) {
            return '0.00';
        }
        return `$${amount.toFixed(2)}`;
    };

    // Format date
    const invoiceDate = formatDate(invoice.issueDate);

    // Calculate totals
    const subtotal = invoice.amount; // invoice.labour_cost + invoice.parts_cost;

    const taxRate = 13;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.invoiceDetails}>
                        <Text style={styles.invoiceDate}>Date: {formatDate(invoiceDate)}</Text>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.invoiceNumber}>{invoice.displayNumber}</Text>
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{invoice.shopName}</Text>
                        <Text style={styles.detailFonts}>{invoice.shopAddress}</Text>
                        <Text style={styles.detailFonts}>{formatPhoneNumber(invoice.shopPhone)}</Text>
                        <Text style={styles.detailFonts}>{invoice.shopEmail}</Text>
                    </View>
                </View>
                
                {/* Customer Information */}
                <View style={styles.customerSection}>
                    <Text style={styles.sectionTitle}>BILL TO</Text>
                    <Text style={styles.detailFonts}>{invoice.clientName || ''}</Text>
                    <Text style={styles.detailFonts}>{invoice.clientAddress || ''}</Text>
                    <Text style={styles.detailFonts}>{formatPhoneNumber(invoice.clientPhone) || ''}</Text>
                    <Text style={styles.detailFonts}>{invoice.clientEmail || ''}</Text>
                </View>
                
                {/* Vehicle Information */}
                <View style={styles.customerSection}>
                    <Text style={styles.sectionTitle}>VEHICLE DETAILS</Text>
                    <Text style={styles.detailFonts}>
                        {invoice.vehicleInfo?.year || ''} {invoice.vehicleInfo?.make || ''} {invoice.vehicleInfo?.model || ''}
                    </Text>
                    <Text style={styles.detailFonts}>{invoice.vehicleInfo?.license_plate === null || invoice.vehicleInfo?.license_plate === "NULL" ? '' : invoice.vehicleInfo?.license_plate}</Text>
                    <Text style={styles.detailFonts}>{invoice.mileage || ''}</Text>
                </View>
                
                {/* Items Table */}
                <View style={styles.table}>
                    <Text style={styles.companyName}>{invoice.description}</Text>
                    <View style={styles.tableHeader}>
                        <Text style={styles.descCol}>Description</Text>
                        {/* <Text style={styles.qtyCol}>Quantity</Text>
                        <Text style={styles.rateCol}>Rate</Text> */}
                        <Text style={styles.amountCol}>Amount</Text>
                    </View>
                    
                    {/* Table Rows - if no items, show at least one empty row */}
                    {invoice.description || invoice.labour || invoice.parts || invoice.notes ? (
                        <View style={styles.detailsSection}>                            
                            {invoice.labour && (
                                <View style={styles.tableRow}>
                                    <Text style={styles.descCol}>Labour: {invoice.labour}</Text>
                                    {/* <Text style={styles.qtyCol}>1</Text> */}
                                    <Text style={styles.amountCol}>{formatCurrency(invoice.labour_cost)}</Text>
                                </View>
                            )}
                            
                            {invoice.parts && (
                                <View style={styles.tableRow}>
                                    <Text style={styles.descCol}>Parts: {invoice.parts}</Text>
                                    {/* <Text style={styles.qtyCol}>1</Text> */}
                                    <Text style={styles.amountCol}>{formatCurrency(invoice.parts_cost)}</Text>
                                </View>
                            )}
                            
                            {invoice.notes && (
                                <View style={styles.tableRow}>
                                    <Text style={styles.descCol}>Notes: {invoice.notes}</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.tableRow}>
                            <Text style={styles.descCol}>Service</Text>
                            {/* <Text style={styles.qtyCol}>1</Text> */}
                            {/* <Text style={styles.rateCol}>{formatCurrency(0)}</Text> */}
                            <Text style={styles.amountCol}>{formatCurrency(0)}</Text>
                        </View>
                    )}
                </View>
                
                {/* Summary */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(invoice.amount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tax</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.summaryLabel}>TOTAL</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
                    </View>
                </View>
                
                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Thank you for your business!</Text>
                    <Text>Powered by Motorminds</Text>
                </View>
            </Page>
        </Document>
    );
};