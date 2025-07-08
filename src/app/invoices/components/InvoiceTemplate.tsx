import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatCurrency } from '@/app/financials/utils/formatting';
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
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%'
    },
    headerLeft: {
        width: '60%',
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    headerRight: {
        width: '50%',
        flexDirection: 'column',
        alignItems: 'flex-end'
    },
    logo: {
        width: 160,
        height: 70,
        objectFit: 'contain',
        marginBottom: 10
    },
    companyInfo: {
        width: '100%',
        marginTop: 5
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
        fontSize: 18,
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
        textAlign: 'right',
        marginBottom: 2
    },
    invoiceDetails: {
        marginBottom: 10
    },
    customerSection: {
        marginTop: 10,
        marginBottom: 10
    },
    sectionTitle: {
        fontSize: 11,
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
    },
    signatureSection: {
        marginTop: 10,
        flexDirection: 'row'
    },
    agreementText: {
        fontSize: 8,
        color: '#555',
        width: '60%',
        paddingRight: 15,
        lineHeight: 1.5
    },
    signatureBox: {
        width: '40%',
        alignItems: 'flex-end'
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#555',
        marginBottom: 5,
        paddingBottom: 15,
        width: '100%'
    },
    signatureLabel: {
        fontSize: 8,
        textAlign: 'center',
        color: '#555'
    },
    dateLabel: {
        fontSize: 8,
        marginTop: 10,
        color: '#555'
    },
    dateLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#555',
        marginBottom: 5,
        paddingBottom: 15,
        width: '60%'
    },
    logoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
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

export const InvoiceTemplate = ({ invoice }: { invoice: any }) => {
    // Format currency
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
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            {invoice.shopLogo && (
                                <Image 
                                    src={invoice.shopLogo}
                                    style={styles.logo}
                                    cache={false}
                                />
                            )}
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
                            <Text style={styles.invoiceTitle}>{invoice.description} Invoice</Text>
                            <Text style={styles.invoiceNumber}>{invoice.displayNumber}</Text>
                            <Text style={styles.invoiceDate}>Date: {formatDate(invoiceDate)}</Text>
                        </View>
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
                    <View style={styles.tableHeader}>
                        <Text style={styles.descCol}>Description</Text>
                        <Text style={styles.amountCol}>Amount</Text>
                    </View>
                    
                    {/* --- Labour Items --- */}
                    {(invoice.labour || (invoice.labour_items && invoice.labour_items.length > 0)) && (
                        <View style={styles.tableRow}>
                            <Text style={styles.descCol}>
                                <Text style={{ fontWeight: 'bold' }}>Labour:</Text>
                                {invoice.labour ? `\n- ${invoice.labour}` : ''}
                                {invoice.labour_items && invoice.labour_items.map((item: any) => 
                                    item.description ? `\n- ${item.description}` : ''
                                )}
                            </Text>
                            <Text style={styles.amountCol}>
                                {'\n'}
                                {invoice.labour ? `${formatCurrency(invoice.labour_cost)}\n` : ''}
                                {invoice.labour_items && invoice.labour_items.map((item: any) => 
                                    item.description ? `${formatCurrency(item.cost)}\n` : ''
                                )}
                            </Text>
                        </View>
                    )}

                    {/* --- Parts Items --- */}
                    {(invoice.parts || (invoice.parts_items && invoice.parts_items.length > 0)) && (
                        <View style={styles.tableRow}>
                            <Text style={styles.descCol}>
                                <Text style={{ fontWeight: 'bold' }}>Parts:</Text>
                                {invoice.parts ? `\n- ${invoice.parts}` : ''}
                                {invoice.parts_items && invoice.parts_items.map((item: any) => 
                                    item.description ? `\n- ${item.description}` : ''
                                )}
                            </Text>
                            <Text style={styles.amountCol}>
                                {'\n'}
                                {invoice.parts ? `${formatCurrency(invoice.parts_cost)}\n` : ''}
                                {invoice.parts_items && invoice.parts_items.map((item: any) => 
                                    item.description ? `${formatCurrency(item.cost)}\n` : ''
                                )}
                            </Text>
                        </View>
                    )}

                    {/* --- Notes --- */}
                    {invoice.notes && (
                        <View style={styles.tableRow}>
                            <Text style={styles.descCol}>
                                <Text style={{ fontWeight: 'bold' }}>Notes:</Text>
                                {`\n${invoice.notes}`}
                            </Text>
                            <Text style={styles.amountCol}></Text>
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