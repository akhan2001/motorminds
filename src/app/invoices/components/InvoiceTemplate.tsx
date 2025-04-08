// src/app/invoices/components/InvoiceTemplate.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    companyInfo: {
        width: '50%'
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4
    },
    companyDetail: {
        fontSize: 10,
        color: '#555',
        marginBottom: 2
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'right'
    },
    invoiceInfo: {
        textAlign: 'right',
        fontSize: 12
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
    descCol: { width: '40%', fontSize: 10 },
    qtyCol: { width: '15%', fontSize: 10, textAlign: 'center' },
    rateCol: { width: '20%', fontSize: 10, textAlign: 'right' },
    amountCol: { width: '25%', fontSize: 10, textAlign: 'right' },
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
        color: '#555'
    },
    paymentInfo: {
        marginTop: 20,
        fontSize: 10,
        color: '#555'
    },
    paymentTitle: {
        fontWeight: 'bold',
        marginBottom: 3
    }
});

export const InvoiceTemplate = ({ invoice }: { invoice: any }) => {
    // Format currency
    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    // Ensure we have a date object
    const invoiceDate = invoice.date ? new Date(invoice.date) : new Date();
    
    // Format date
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Calculate totals
    const subtotal = invoice.items?.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.rate), 0) || 0;
        
    const taxRate = invoice.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>MotorMinds Auto Service</Text>
                        <Text style={styles.companyDetail}>123 Repair Lane</Text>
                        <Text style={styles.companyDetail}>Automotive City, AC 12345</Text>
                        <Text style={styles.companyDetail}>Phone: (555) 123-4567</Text>
                        <Text style={styles.companyDetail}>Email: service@motorminds.com</Text>
                    </View>
                    <View>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.invoiceInfo}>Invoice #: {invoice.id || 'INV-12345'}</Text>
                        <Text style={styles.invoiceInfo}>Date: {formatDate(invoiceDate)}</Text>
                    </View>
                </View>
                
                {/* Customer Information */}
                <View style={styles.customerSection}>
                    <Text style={styles.sectionTitle}>BILL TO</Text>
                    <Text style={styles.customerInfo}>{invoice.customer?.name || 'Customer Name'}</Text>
                    <Text style={styles.customerInfo}>{invoice.customer?.address || 'Customer Address'}</Text>
                    <Text style={styles.customerInfo}>{invoice.customer?.phone || 'Phone Number'}</Text>
                    <Text style={styles.customerInfo}>{invoice.customer?.email || 'Email Address'}</Text>
                </View>
                
                {/* Vehicle Information */}
                <View style={styles.customerSection}>
                    <Text style={styles.sectionTitle}>VEHICLE DETAILS</Text>
                    <Text style={styles.customerInfo}>
                        {invoice.vehicle?.year || ''} {invoice.vehicle?.make || ''} {invoice.vehicle?.model || ''}
                    </Text>
                    <Text style={styles.customerInfo}>VIN: {invoice.vehicle?.vin || ''}</Text>
                    <Text style={styles.customerInfo}>Mileage: {invoice.vehicle?.mileage || ''}</Text>
                </View>
                
                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.descCol}>Description</Text>
                        <Text style={styles.qtyCol}>Quantity</Text>
                        <Text style={styles.rateCol}>Rate</Text>
                        <Text style={styles.amountCol}>Amount</Text>
                    </View>
                    
                    {/* Table Rows - if no items, show at least one empty row */}
                    {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item: any, index: number) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.descCol}>{item.description}</Text>
                                <Text style={styles.qtyCol}>{item.quantity}</Text>
                                <Text style={styles.rateCol}>{formatCurrency(item.rate)}</Text>
                                <Text style={styles.amountCol}>{formatCurrency(item.quantity * item.rate)}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.tableRow}>
                            <Text style={styles.descCol}>Service</Text>
                            <Text style={styles.qtyCol}>1</Text>
                            <Text style={styles.rateCol}>{formatCurrency(0)}</Text>
                            <Text style={styles.amountCol}>{formatCurrency(0)}</Text>
                        </View>
                    )}
                </View>
                
                {/* Summary */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.summaryLabel}>TOTAL</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
                    </View>
                </View>
                
                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Thank you for your business!</Text>
                </View>
            </Page>
        </Document>
    );
};