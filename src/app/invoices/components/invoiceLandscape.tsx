import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatPhoneNumber } from "../utils/invoice-utils";

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 25,
        fontFamily: 'Helvetica'
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    headerLeft: {
        width: '60%',
        flexDirection: 'column'
    },
    headerRight: {
        width: '35%',
        flexDirection: 'column',
        alignItems: 'flex-end'
    },
    companyInfo: {
        marginBottom: 8
    },
    companyName: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 3
    },
    detailFonts: {
        fontSize: 10,
        color: '#555',
        marginBottom: 1
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2
    },
    invoiceNumber: {
        fontSize: 15,
        color: '#555',
        marginBottom: 2
    },
    invoiceDate: {
        fontSize: 10,
        color: '#555',
        marginBottom: 2
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 10
    },
    infoColumn: {
        width: '33%',
        paddingRight: 10
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        backgroundColor: '#f0f0f0',
        padding: 4
    },
    table: {
        marginTop: 10,
        marginBottom: 8
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#cccccc',
        fontWeight: 'bold'
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee'
    },
    descCol: { width: '70%', fontSize: 10 },
    amountCol: { width: '30%', fontSize: 10, textAlign: 'right' },
    summaryRow: {
        flexDirection: 'row',
        marginTop: 8
    },
    summaryLeft: {
        width: '65%',
    },
    summaryRight: {
        width: '35%',
    },
    summaryTable: {
        width: '100%',
    },
    summaryLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
        fontSize: 10
    },
    totalLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderTopWidth: 1,
        borderTopColor: '#333',
        marginTop: 3,
        fontSize: 12,
        fontWeight: 'bold'
    },
    notes: {
        fontSize: 10,
        marginBottom: 6,
        paddingHorizontal: 4
    },
    footer: {
        marginTop: 15,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#cccccc',
        fontSize: 9,
        textAlign: 'center',
        color: '#555',
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0
    },
    detailsSection: {
        marginBottom: 6
    },
    signatureSection: {
        marginTop: 15,
        flexDirection: 'row'
    },
    agreementText: {
        fontSize: 8,
        color: '#555',
        width: '65%',
        paddingRight: 10,
        lineHeight: 1.3
    },
    signatureBox: {
        width: '35%',
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#555',
        marginBottom: 3,
        paddingBottom: 12
    },
    signatureLabel: {
        fontSize: 8,
        textAlign: 'center',
        color: '#555'
    },
    dateLabel: {
        fontSize: 8,
        marginTop: 8,
        color: '#555'
    },
    dateLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#555',
        marginBottom: 3,
        paddingBottom: 12,
        width: '60%'
    },
    businessInfo: {
        fontSize: 10,
        color: '#555',
        marginTop: 3
    }
});

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const InvoiceLandscape = ({ invoice }: { invoice: any }) => {
    // Format currency
    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) {
            return '$0.00';
        }
        return `$${amount.toFixed(2)}`;
    };

    // Format date
    const invoiceDate = formatDate(invoice.issueDate);

    // Calculate totals
    const subtotal = invoice.amount;
    const taxRate = 13;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header Row */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.companyInfo}>
                            <Text style={styles.companyName}>{invoice.shopName}</Text>
                            <Text style={styles.detailFonts}>{invoice.shopAddress}</Text>
                            <Text style={styles.detailFonts}>{formatPhoneNumber(invoice.shopPhone)}</Text>
                            <Text style={styles.detailFonts}>{invoice.shopEmail}</Text>
                            {invoice.hst_number && (
                                <Text style={styles.businessInfo}>HST#: {invoice.hst_number}</Text>
                            )}
                            {invoice.business_number && (
                                <Text style={styles.businessInfo}>Business#: {invoice.business_number}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <Text style={styles.invoiceNumber}>{invoice.displayNumber}</Text>
                        <Text style={styles.invoiceDate}>Date: {formatDate(invoiceDate)}</Text>
                    </View>
                </View>
                
                {/* Customer and Vehicle Information Row */}
                <View style={styles.infoRow}>
                    <View style={styles.infoColumn}>
                        <Text style={styles.sectionTitle}>BILL TO</Text>
                        <Text style={styles.detailFonts}>{invoice.clientName || ''}</Text>
                        <Text style={styles.detailFonts}>{invoice.clientAddress || ''}</Text>
                        <Text style={styles.detailFonts}>{formatPhoneNumber(invoice.clientPhone) || ''}</Text>
                        <Text style={styles.detailFonts}>{invoice.clientEmail || ''}</Text>
                    </View>
                    
                    <View style={styles.infoColumn}>
                        <Text style={styles.sectionTitle}>VEHICLE DETAILS</Text>
                        <Text style={styles.detailFonts}>
                            {invoice.vehicleInfo?.year || ''} {invoice.vehicleInfo?.make || ''} {invoice.vehicleInfo?.model || ''}
                        </Text>
                        <Text style={styles.detailFonts}>{invoice.vehicleInfo?.license_plate === null || invoice.vehicleInfo?.license_plate === "NULL" ? '' : invoice.vehicleInfo?.license_plate}</Text>
                        <Text style={styles.detailFonts}>{invoice.mileage || ''}</Text>
                    </View>
                    
                    <View style={styles.infoColumn}>
                        <Text style={styles.sectionTitle}>PAYMENT INFO</Text>
                        <Text style={styles.detailFonts}>Payment Due: {formatDate(invoice.issueDate)}</Text>
                        <Text style={styles.detailFonts}>Payment Method: {invoice.paymentMethod || 'TBD'}</Text>
                    </View>
                </View>
                
                {/* Items Table */}
                <View style={styles.table}>
                    {invoice.description && (
                        <Text style={styles.companyName}>{invoice.description}</Text>
                    )}
                    <View style={styles.tableHeader}>
                        <Text style={styles.descCol}>Description</Text>
                        <Text style={styles.amountCol}>Amount</Text>
                    </View>
                    
                    {/* Table Rows */}
                    {invoice.description || invoice.labour || invoice.parts || invoice.notes ? (
                        <View style={styles.detailsSection}>                            
                            {invoice.labour && (
                                <View style={styles.tableRow}>
                                    <Text style={styles.descCol}>Labour: {invoice.labour}</Text>
                                    <Text style={styles.amountCol}>{formatCurrency(invoice.labour_cost)}</Text>
                                </View>
                            )}
                            
                            {invoice.parts && (
                                <View style={styles.tableRow}>
                                    <Text style={styles.descCol}>Parts: {invoice.parts}</Text>
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
                            <Text style={styles.amountCol}>{formatCurrency(0)}</Text>
                        </View>
                    )}
                </View>
                
                {/* Summary Row */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryLeft}>
                        <Text style={styles.sectionTitle}>NOTES</Text>
                        <Text style={styles.notes}>
                            {invoice.additionalNotes || 'Thank you for your business. Please contact us if you have any questions.'}
                        </Text>
                    </View>
                    
                    <View style={styles.summaryRight}>
                        <View style={styles.summaryTable}>
                            <View style={styles.summaryLine}>
                                <Text>Subtotal:</Text>
                                <Text>{formatCurrency(invoice.amount)}</Text>
                            </View>
                            <View style={styles.summaryLine}>
                                <Text>Tax ({taxRate}%):</Text>
                                <Text>{formatCurrency(taxAmount)}</Text>
                            </View>
                            <View style={styles.totalLine}>
                                <Text>TOTAL:</Text>
                                <Text>{formatCurrency(total)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                
                {/* Signature and Agreement Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.agreementText}>
                        <Text>
                            I hereby authorize the repairs indicated by the above invoice along with the necessary materials. 
                            I grant the repair shop and its employees permission to operate the vehicle for testing, inspection, or delivery.
                            I acknowledge that the shop will not be responsible for loss or damage to the vehicle or articles left in the vehicle
                            in case of fire, theft, or any other cause beyond the shop's control. I understand that payment is due upon completion
                            of work performed.
                        </Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}></View>
                        <Text style={styles.signatureLabel}>Customer Signature</Text>
                        <Text style={styles.dateLabel}>Date:</Text>
                        <View style={styles.dateLine}></View>
                    </View>
                </View>
                
                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Thank you for your business! Powered by Motorminds</Text>
                </View>
            </Page>
        </Document>
    );
};
