import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatPhoneNumber } from "../utils/invoice-utils";

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontFamily: 'Helvetica',
        fontSize: 10
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#1e3a8a',
        paddingBottom: 10
    },
    headerLeft: {
        width: '70%',
        flexDirection: 'column'
    },
    headerRight: {
        width: '25%',
        flexDirection: 'column',
        alignItems: 'flex-end'
    },
    logo: {
        width: 120,
        height: 50,
        objectFit: 'contain',
        marginBottom: 8
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 3
    },
    companyTagline: {
        fontSize: 10,
        fontStyle: 'italic',
        color: '#6b7280',
        marginBottom: 4,
        textAlign: 'center'
    },
    companyDetails: {
        fontSize: 9,
        color: '#374151',
        marginBottom: 1
    },
    businessInfo: {
        fontSize: 8,
        color: '#6b7280',
        marginTop: 2
    },
    invoiceTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 5
    },
    invoiceDetails: {
        fontSize: 9,
        color: '#374151',
        marginBottom: 2
    },
    customerVehicleRow: {
        flexDirection: 'row',
        marginBottom: 15,
        gap: 10
    },
    customerSection: {
        width: '35%',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 4
    },
    vehicleSection: {
        width: '35%',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 4
    },
    paymentSection: {
        width: '25%',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 4
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    sectionContent: {
        fontSize: 9,
        color: '#374151',
        marginBottom: 2
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3
    },
    checkbox: {
        width: 8,
        height: 8,
        borderWidth: 1,
        borderColor: '#374151',
        marginRight: 4,
        backgroundColor: '#ffffff'
    },
    paymentLabel: {
        fontSize: 8,
        color: '#374151'
    },
    serviceDescription: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
        textAlign: 'center',
        backgroundColor: '#eff6ff',
        padding: 6,
        borderRadius: 4
    },
    table: {
        marginBottom: 15,
        width: '100%'
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4
    },
    tableHeaderText: {
        color: '#ffffff',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#ffffff'
    },
    tableRowAlt: {
        flexDirection: 'row',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#f9fafb'
    },
    itemNumberCol: { width: '12%', fontSize: 8, textAlign: 'center' },
    qtyCol: { width: '10%', fontSize: 8, textAlign: 'center' },
    descCol: { width: '48%', fontSize: 8, paddingRight: 4 },
    unitPriceCol: { width: '15%', fontSize: 8, textAlign: 'right' },
    amountCol: { width: '15%', fontSize: 8, textAlign: 'right', fontWeight: 'bold' },
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 15,
        position: 'absolute',
        bottom: 120,
        right: 0,
        width: '35%'
    },
    summaryBox: {
        width: '100%',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3
    },
    summaryLabel: {
        fontSize: 9,
        color: '#374151'
    },
    summaryValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#374151'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 2,
        borderTopColor: '#1e3a8a',
        paddingTop: 5,
        marginTop: 5
    },
    totalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e3a8a'
    },
    totalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e3a8a'
    },
    notesSection: {
        marginBottom: 15,
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 4
    },
    notesTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 4
    },
    notesContent: {
        fontSize: 8,
        color: '#374151',
        lineHeight: 1.3
    },
    commentsSection: {
        marginBottom: 15,
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 4,
        minHeight: 60
    },
    commentsTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 4
    },
    authorizationSection: {
        flexDirection: 'row',
        marginBottom: 15
    },
    authorizationText: {
        width: '65%',
        fontSize: 7,
        color: '#6b7280',
        lineHeight: 1.2,
        paddingRight: 10
    },
    signatureSection: {
        width: '35%',
        flexDirection: 'column'
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        marginBottom: 3,
        paddingBottom: 8
    },
    signatureLabel: {
        fontSize: 7,
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: 8
    },
    dateLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        marginBottom: 3,
        paddingBottom: 8
    },
    dateLabel: {
        fontSize: 7,
        textAlign: 'center',
        color: '#6b7280'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
        marginTop: 10
    },
    footerLeft: {
        fontSize: 8,
        color: '#6b7280'
    },
    footerRight: {
        fontSize: 8,
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
            <Text style={styles.companyName}>{invoice.shopName || 'Shop Name'}</Text>
            <Text style={styles.companyTagline}>{invoice.shop_tagline || 'Shop Tagline'}</Text>
            <Text style={styles.companyDetails}>Address: {invoice.shopAddress || ''}</Text>
            <Text style={styles.companyDetails}>Phone: {formatPhoneNumber(invoice.shopPhone) || ''}</Text>
            <Text style={styles.companyDetails}>Email: {invoice.shopEmail || ''}</Text>
            <Text style={styles.businessInfo}>HST#: {invoice.hst_number || ''}</Text>
            <Text style={styles.businessInfo}>Business#: {invoice.business_number || ''}</Text>
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
    <View style={styles.customerVehicleRow}>
        <View style={styles.customerSection}>
            <Text style={styles.sectionTitle}>Customer Name</Text>
            <Text style={styles.sectionContent}>{invoice.clientName || ''}</Text>
            <Text style={styles.sectionTitle}>Address</Text>
            <Text style={styles.sectionContent}>{invoice.clientAddress || ''}</Text>
            <Text style={styles.sectionTitle}>City, Prov</Text>
            <Text style={styles.sectionContent}>{invoice.clientCity || ''}</Text>
            <Text style={styles.sectionTitle}>Postal Code</Text>
            <Text style={styles.sectionContent}>{invoice.clientPostalCode || ''}</Text>
            <Text style={styles.sectionTitle}>Telephone</Text>
            <Text style={styles.sectionContent}>{formatPhoneNumber(invoice.clientPhone) || ''}</Text>
        </View>
        
        <View style={styles.vehicleSection}>
            <Text style={styles.sectionTitle}>Make</Text>
            <Text style={styles.sectionContent}>{invoice.vehicleInfo?.make || ''}</Text>
            <Text style={styles.sectionTitle}>Model</Text>
            <Text style={styles.sectionContent}>{invoice.vehicleInfo?.model || ''}</Text>
            <Text style={styles.sectionTitle}>Year</Text>
            <Text style={styles.sectionContent}>{invoice.vehicleInfo?.year || ''}</Text>
            <Text style={styles.sectionTitle}>Plate</Text>
            <Text style={styles.sectionContent}>
                {invoice.vehicleInfo?.license_plate === null || invoice.vehicleInfo?.license_plate === "NULL" 
                    ? '' 
                    : invoice.vehicleInfo?.license_plate || ''}
            </Text>
            <Text style={styles.sectionTitle}>Odometer</Text>
            <Text style={styles.sectionContent}>{invoice.mileage || ''}</Text>
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
                quantity: 1,
                unitPrice: item.cost,
                amount: item.cost,
                type: 'Labour'
            });
        });
    } else if (invoice.labour_total_price > 0) {
        allItems.push({
            itemNumber: itemNumber++,
            description: invoice.labour || 'General Labour',
            quantity: 1,
            unitPrice: invoice.labour_total_price,
            amount: invoice.labour_total_price,
            type: 'Labour'
        });
    }

    // Add parts items
    if (invoice.parts_items && invoice.parts_items.length > 0) {
        invoice.parts_items.forEach((item: any) => {
            allItems.push({
                itemNumber: itemNumber++,
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.cost,
                amount: item.cost * (item.quantity || 1),
                type: 'Parts'
            });
        });
    } else if (invoice.parts_total_price > 0) {
        allItems.push({
            itemNumber: itemNumber++,
            description: invoice.parts || 'General Parts',
            quantity: 1,
            unitPrice: invoice.parts_total_price,
            amount: invoice.parts_total_price,
            type: 'Parts'
        });
    }

    return (
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.itemNumberCol]}>Item #</Text>
                <Text style={[styles.tableHeaderText, styles.qtyCol]}>Qty</Text>
                <Text style={[styles.tableHeaderText, styles.descCol]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.unitPriceCol]}>Unit Price</Text>
                <Text style={[styles.tableHeaderText, styles.amountCol]}>Amount</Text>
            </View>
            
            {allItems.map((item, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={styles.itemNumberCol}>{item.itemNumber}</Text>
                    <Text style={styles.qtyCol}>{item.quantity}</Text>
                    <Text style={styles.descCol}>{item.description}</Text>
                    <Text style={styles.unitPriceCol}>{formatCurrency(item.unitPrice)}</Text>
                    <Text style={styles.amountCol}>{formatCurrency(item.amount)}</Text>
                </View>
            ))}
            
            {/* Add empty lines for manual filling */}
            {Array.from({ length: 8 }, (_, index) => (
                <View key={`empty-${index}`} style={styles.tableRow}>
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

// Comments Component
const CommentsSection = () => (
    <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Comments</Text>
        <Text style={styles.notesContent}>
            {/* Empty space for manual comments */}
        </Text>
    </View>
);

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
            🇨🇦 100% CANADIAN OWNED & OPERATED!{'\n'}
            Thank you for choosing {invoice.shopName || 'our shop'}!
        </Text>
        <Text style={styles.footerRight}>Powered by MotorMinds</Text>
    </View>
);

// Main Template Component
export const ModernInvoiceTemplate = ({ invoice }: { invoice: any }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <InvoiceHeader invoice={invoice} />
                
                <Text style={styles.serviceDescription}>
                    {invoice.description || 'Automotive Service'}
                </Text>
                
                <CustomerVehiclePaymentInfo invoice={invoice} />
                
                <ServiceItemsTable invoice={invoice} />
                
                <CommentsSection />
                
                <NotesSection invoice={invoice} />
                
                <AuthorizationSection />
                
                <PaymentSummary invoice={invoice} />
                
                <InvoiceFooter invoice={invoice} />
            </Page>
        </Document>
    );
};
