import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatPhoneNumber } from "../utils/invoice-utils";

// Create styles for landscape
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 15,
        fontFamily: 'Helvetica',
        fontSize: 9,
        position: 'relative'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#1e3a8a',
        paddingBottom: 8
    },
    headerLeft: {
        width: '50%',
        flexDirection: 'column'
    },
    headerRight: {
        width: '45%',
        flexDirection: 'column',
        alignItems: 'flex-end'
    },
    logo: {
        width: 100,
        height: 40,
        objectFit: 'contain',
        marginBottom: 6
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 2
    },
    companyTagline: {
        fontSize: 9,
        fontStyle: 'italic',
        color: '#6b7280',
        marginBottom: 3,
        textAlign: 'center'
    },
    companyDetails: {
        fontSize: 8,
        color: '#374151',
        marginBottom: 1
    },
    businessInfo: {
        fontSize: 7,
        color: '#6b7280',
        marginTop: 2
    },
    invoiceTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 4
    },
    invoiceDetails: {
        fontSize: 8,
        color: '#374151',
        marginBottom: 1
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8
    },
    billToSection: {
        width: '30%',
        backgroundColor: '#f8fafc',
        padding: 6,
        borderRadius: 4
    },
    vehicleSection: {
        width: '30%',
        backgroundColor: '#f8fafc',
        padding: 6,
        borderRadius: 4
    },
    paymentSection: {
        width: '30%',
        backgroundColor: '#f8fafc',
        padding: 6,
        borderRadius: 4
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 3,
        textTransform: 'uppercase'
    },
    sectionContent: {
        fontSize: 8,
        color: '#374151',
        marginBottom: 1
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2
    },
    checkbox: {
        width: 6,
        height: 6,
        borderWidth: 1,
        borderColor: '#374151',
        marginRight: 3,
        backgroundColor: '#ffffff'
    },
    paymentLabel: {
        fontSize: 7,
        color: '#374151'
    },
    serviceDescription: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 6,
        textAlign: 'center',
        backgroundColor: '#eff6ff',
        padding: 4,
        borderRadius: 4
    },
    table: {
        marginBottom: 12,
        width: '60%',
        alignSelf: 'center'
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 4,
        paddingVertical: 4,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4
    },
    tableHeaderText: {
        color: '#ffffff',
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        paddingVertical: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#ffffff'
    },
    tableRowAlt: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        paddingVertical: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#f9fafb'
    },
    itemNumberCol: { width: '10%', fontSize: 7, textAlign: 'center' },
    qtyCol: { width: '8%', fontSize: 7, textAlign: 'center' },
    descCol: { width: '52%', fontSize: 7, paddingRight: 3 },
    unitPriceCol: { width: '15%', fontSize: 7, textAlign: 'right' },
    amountCol: { width: '15%', fontSize: 7, textAlign: 'right', fontWeight: 'bold' },
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 12,
        position: 'absolute',
        bottom: 100,
        right: 0,
        width: '30%'
    },
    summaryBox: {
        width: '100%',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2
    },
    summaryLabel: {
        fontSize: 8,
        color: '#374151'
    },
    summaryValue: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 2,
        borderTopColor: '#1e3a8a',
        paddingTop: 3,
        marginTop: 3
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e3a8a'
    },
    totalValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e3a8a'
    },
    notesSection: {
        marginBottom: 12,
        backgroundColor: '#f8fafc',
        padding: 6,
        borderRadius: 4
    },
    notesTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 3
    },
    notesContent: {
        fontSize: 7,
        color: '#374151',
        lineHeight: 1.2
    },
    authorizationSection: {
        flexDirection: 'row',
        marginBottom: 12
    },
    authorizationText: {
        width: '70%',
        fontSize: 6,
        color: '#6b7280',
        lineHeight: 1.1,
        paddingRight: 8
    },
    signatureSection: {
        width: '30%',
        flexDirection: 'column'
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        marginBottom: 2,
        paddingBottom: 6
    },
    signatureLabel: {
        fontSize: 6,
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 6
    },
    dateLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        marginBottom: 2,
        paddingBottom: 6
    },
    dateLabel: {
        fontSize: 6,
        textAlign: 'center',
        color: '#6b7280'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 6,
        marginTop: 8
    },
    footerLeft: {
        fontSize: 7,
        color: '#6b7280'
    },
    footerRight: {
        fontSize: 7,
        color: '#6b7280',
        fontWeight: 'bold'
    }
});

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) {
        return '$0.00';
    }
    return `$${amount.toFixed(2)}`;
};

// Header Component
const InvoiceHeader = ({ invoice }: { invoice: any }) => (
    <View style={styles.header}>
        <View style={styles.headerLeft}>
            {invoice.shopLogo && (
                <Image 
                    src={invoice.shopLogo}
                    style={styles.logo}
                    cache={false}
                />
            )}
            <Text style={styles.companyName}>{invoice.shopName}</Text>
            {invoice.shop_tagline && (
                <Text style={styles.companyTagline}>{invoice.shop_tagline}</Text>
            )}
            <Text style={styles.companyDetails}>{invoice.shopAddress}</Text>
            <Text style={styles.companyDetails}>{formatPhoneNumber(invoice.shopPhone)}</Text>
            <Text style={styles.companyDetails}>{invoice.shopEmail}</Text>
            {invoice.hst_number && (
                <Text style={styles.businessInfo}>HST#: {invoice.hst_number}</Text>
            )}
            {invoice.business_number && (
                <Text style={styles.businessInfo}>Business#: {invoice.business_number}</Text>
            )}
        </View>
        
        <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceDetails}>Invoice #: {invoice.displayNumber}</Text>
            <Text style={styles.invoiceDetails}>Date: {formatDate(invoice.issueDate)}</Text>
            <Text style={styles.invoiceDetails}>Status: {invoice.status}</Text>
        </View>
    </View>
);

// Customer, Vehicle, and Payment Info Component
const CustomerVehiclePaymentInfo = ({ invoice }: { invoice: any }) => (
    <View style={styles.infoRow}>
        <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.sectionContent}>{invoice.clientName || ''}</Text>
            <Text style={styles.sectionContent}>{invoice.clientAddress || ''}</Text>
            <Text style={styles.sectionContent}>{formatPhoneNumber(invoice.clientPhone) || ''}</Text>
            <Text style={styles.sectionContent}>{invoice.clientEmail || ''}</Text>
        </View>
        
        <View style={styles.vehicleSection}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            <Text style={styles.sectionContent}>
                {invoice.vehicleInfo?.year || ''} {invoice.vehicleInfo?.make || ''} {invoice.vehicleInfo?.model || ''}
            </Text>
            <Text style={styles.sectionContent}>
                {invoice.mileage ? `Odometer: ${invoice.mileage}` : ''}
            </Text>
        </View>
        
        <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Method of Payment</Text>
            <View style={styles.paymentMethod}>
                <View style={styles.checkbox}></View>
                <Text style={styles.paymentLabel}>Cash</Text>
            </View>
            <View style={styles.paymentMethod}>
                <View style={styles.checkbox}></View>
                <Text style={styles.paymentLabel}>Charge</Text>
            </View>
            <View style={styles.paymentMethod}>
                <View style={styles.checkbox}></View>
                <Text style={styles.paymentLabel}>Debit</Text>
            </View>
        </View>
    </View>
);

// Service Items Table Component
const ServiceItemsTable = ({ invoice }: { invoice: any }) => {
    const allItems = [];
    let itemNumber = 1;

    // Add labour items
    if (invoice.labour_items && invoice.labour_items.length > 0) {
        invoice.labour_items.forEach((item: any) => {
            allItems.push({
                itemNumber: itemNumber++,
                description: item.description,
                quantity: '-',
                unitPrice: '-',
                amount: formatCurrency(item.cost)
            });
        });
    } else if (invoice.labour && invoice.labour_total_price > 0) {
        allItems.push({
            itemNumber: itemNumber++,
            description: invoice.labour,
            quantity: '-',
            unitPrice: '-',
            amount: formatCurrency(invoice.labour_total_price)
        });
    }

    // Add parts items
    if (invoice.parts_items && invoice.parts_items.length > 0) {
        invoice.parts_items.forEach((item: any) => {
            allItems.push({
                itemNumber: itemNumber++,
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: formatCurrency(item.cost),
                amount: formatCurrency(item.cost * (item.quantity || 1))
            });
        });
    } else if (invoice.parts && invoice.parts_total_price > 0) {
        allItems.push({
            itemNumber: itemNumber++,
            description: invoice.parts,
            quantity: '-',
            unitPrice: '-',
            amount: formatCurrency(invoice.parts_total_price)
        });
    }

    // Fill remaining rows with empty lines
    const emptyRows = Math.max(0, 15 - allItems.length);

    return (
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.itemNumberCol]}>Item #</Text>
                <Text style={[styles.tableHeaderText, styles.qtyCol]}>Qty</Text>
                <Text style={[styles.tableHeaderText, styles.descCol]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.unitPriceCol]}>Unit Price</Text>
                <Text style={[styles.tableHeaderText, styles.amountCol]}>Amount</Text>
            </View>
            
            {/* Actual invoice items */}
            {allItems.map((item, index) => (
                <View key={`item-${index}`} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={styles.itemNumberCol}>{item.itemNumber}</Text>
                    <Text style={styles.qtyCol}>{item.quantity}</Text>
                    <Text style={styles.descCol}>{item.description}</Text>
                    <Text style={styles.unitPriceCol}>{item.unitPrice}</Text>
                    <Text style={styles.amountCol}>{item.amount}</Text>
                </View>
            ))}
            
            {/* Empty lines for manual filling */}
            {Array.from({ length: emptyRows }, (_, index) => (
                <View key={`empty-${index}`} style={(allItems.length + index) % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={styles.itemNumberCol}></Text>
                    <Text style={styles.qtyCol}></Text>
                    <Text style={styles.descCol}></Text>
                    <Text style={styles.unitPriceCol}></Text>
                    <Text style={styles.amountCol}></Text>
                </View>
            ))}
        </View>
    );
};

// Summary Component
const PaymentSummary = ({ invoice }: { invoice: any }) => {
    const subtotal = invoice.amount;
    const taxRate = 0.13;
    const taxAmount = subtotal * taxRate;
    const total = subtotal * (1 + taxRate);

    return (
        <View style={styles.summarySection}>
            <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>HST (13%):</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
            </View>
        </View>
    );
};

// Notes Component
const NotesSection = ({ invoice }: { invoice: any }) => {
    if (!invoice.notes) return null;

    return (
        <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes & Terms</Text>
            <Text style={styles.notesContent}>
                • All work performed to manufacturer specifications{'\n'}
                • 90-day warranty on parts and labor{'\n'}
                • Payment due upon completion of work{'\n\n'}
                Additional Notes: {invoice.notes}
            </Text>
        </View>
    );
};

// Authorization Component
const AuthorizationSection = () => (
    <View style={styles.authorizationSection}>
        <View style={styles.authorizationText}>
            <Text>
                I hereby authorize the repairs indicated above and grant permission for the shop to operate my vehicle for testing and inspection purposes. I acknowledge that the shop will not be responsible for loss or damage to the vehicle or articles left in the vehicle in case of fire, theft, or any other cause beyond the shop's control.
            </Text>
        </View>
        <View style={styles.signatureSection}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>Customer Signature</Text>
            <View style={styles.dateLine}></View>
            <Text style={styles.dateLabel}>Date</Text>
        </View>
    </View>
);

// Footer Component
const InvoiceFooter = ({ invoice }: { invoice: any }) => (
    <View style={styles.footer}>
        <Text style={styles.footerLeft}>
            Thank you for choosing {invoice.shopName}!{'\n'}
            Quality service you can trust • 100% Canadian Owned & Operated
        </Text>
        <Text style={styles.footerRight}>Powered by MotorMinds</Text>
    </View>
);

// Main Template Component
export const ModernInvoiceLandscape = ({ invoice }: { invoice: any }) => {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <InvoiceHeader invoice={invoice} />
                
                <Text style={styles.serviceDescription}>
                    {invoice.description || 'Automotive Service'}
                </Text>
                
                <CustomerVehiclePaymentInfo invoice={invoice} />
                
                <ServiceItemsTable invoice={invoice} />
                
                <NotesSection invoice={invoice} />
                
                <AuthorizationSection />
                
                <PaymentSummary invoice={invoice} />
                
                <InvoiceFooter invoice={invoice} />
            </Page>
        </Document>
    );
};
