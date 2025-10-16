import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatPhoneNumber } from "../utils/invoice-utils";

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: '12mm', // 12-15mm margins as specified
        fontSize: 10, // Base 10pt as per specs
        fontFamily: "Helvetica",
        backgroundColor: "#FFFFFF",
        position: 'relative'
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: '4mm',
        borderBottomWidth: 2,
        borderBottomColor: "#1e3a8a",
        paddingBottom: '2mm',
        height: '35mm' // Reduced header height to fit one page
    },
    headerLeft: {
        width: "55%" // 55% as per specs
    },
    headerRight: {
        width: "45%", // 45% as per specs
        alignItems: "flex-end"
    },
    logoBox: {
        width: 100,
        height: 40,
        borderWidth: 2,
        borderColor: "#1e3a8a",
        backgroundColor: "#1e3a8a",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4
    },
    logoText: {
        color: "#FFFFFF",
        fontSize: 14, // 14pt as specified for shop name
        fontWeight: "bold"
    },
    logo: {
        width: 100,
        height: 40,
        objectFit: 'contain',
        marginBottom: 4
    },
    companyName: {
        fontSize: 14, // 14pt as specified
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 2
    },
    companyTagline: {
        fontSize: 10, // 10pt as specified for subtext
        fontStyle: 'italic',
        color: '#1e3a8a',
        marginBottom: 2
    },
    companyDetails: {
        fontSize: 10, // 10pt as specified for address/phone
        color: '#374151',
        marginBottom: 1
    },
    businessInfo: {
        fontSize: 10, // 10pt as specified for address/phone
        color: '#374151',
        marginBottom: 1
    },
    invoiceFields: {
        marginBottom: 6
    },
    fieldLabel: {
        fontSize: 11, // 10-11pt bold as specified
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 1
    },
    fieldLine: {
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
        marginBottom: 4,
        paddingBottom: 1
    },
    paymentSection: {
        marginTop: 6
    },
    paymentTitle: {
        fontSize: 11, // 10-11pt for payment method labels
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 2
    },
    paymentOptions: {
        flexDirection: "row",
        gap: 15
    },
    paymentOption: {
        flexDirection: "row",
        alignItems: "center"
    },
    checkbox: {
        width: 8,
        height: 8,
        borderWidth: 1,
        borderColor: "#374151",
        marginRight: 4,
        backgroundColor: "#ffffff"
    },
    paymentLabel: {
        fontSize: 11, // 10-11pt for checkbox labels
        color: "#374151"
    },
    customerVehicleRow: {
        flexDirection: "row",
        marginBottom: 8,
        gap: 15
    },
    customerSection: {
        width: "45%"
    },
    vehicleSection: {
        width: "45%"
    },
    sectionTitle: {
        fontSize: 10, // 10pt bold labels as specified
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 2,
        textTransform: "uppercase"
    },
    fieldRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 3
    },
    fieldLabelSmall: {
        fontSize: 10, // 10pt bold labels as specified
        fontWeight: "bold",
        color: "#374151",
        width: 70
    },
    fieldLineSmall: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
        marginLeft: 8,
        paddingBottom: 2
    },
    sectionContent: {
        fontSize: 10,
        color: '#374151',
        marginBottom: 2
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3
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
        marginTop: '3mm',
        marginBottom: '3mm',
        width: '100%'
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1e3a8a",
        paddingVertical: 6,
        paddingHorizontal: 4
    },
    tableHeaderText: {
        color: "#FFFFFF",
        fontSize: 11, // 11pt bold for headers as specified
        fontWeight: "bold",
        textAlign: "center"
    },
    // Column widths as specified in the breakdown
    itemNoCol: { width: "12%", fontSize: 10, textAlign: "center" }, // 10pt regular for rows
    qtyCol: { width: "10%", fontSize: 10, textAlign: "center" }, // Adjusted to 10% as specified
    descCol: { width: "48%", fontSize: 10, paddingRight: 4 },
    unitPriceCol: { width: "15%", fontSize: 10, textAlign: "right" }, // Adjusted to 15%
    amountCol: { width: "15%", fontSize: 10, textAlign: "right" }, // Adjusted to 15%
    tableRow: {
        flexDirection: "row",
        paddingVertical: 3,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        backgroundColor: "#ffffff",
        minHeight: '8mm' // Reduced to fit one page
    },
    tableRowAlt: {
        flexDirection: "row",
        paddingVertical: 3,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        backgroundColor: "#f9fafb",
        minHeight: '8mm' // Reduced to fit one page
    },
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 15,
        marginTop: 10
    },
    summaryBox: {
        width: '35%',
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
        fontSize: 10,
        color: '#374151',
        lineHeight: 1.3
    },
    commentsSection: {
        position: 'absolute',
        bottom: '25mm', // Adjusted position for one page fit
        left: '12mm',
        right: '12mm',
        backgroundColor: "#f8fafc",
        padding: 4,
        borderRadius: 4,
        minHeight: '15mm' // Reduced height for one page fit
    },
    commentsTitle: {
        fontSize: 9, // 9pt for comments title
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 2
    },
    authorizationSection: {
        flexDirection: 'row',
        marginBottom: 15
    },
    legalText: {
        fontSize: 7, // Reduced to fit one page
        color: "#374151",
        lineHeight: 1.0,
        marginTop: 2,
        marginBottom: 2,
        fontStyle: "italic" // Italic for disclaimers as specified
    },
    signatureSection: {
        position: 'absolute',
        bottom: '10mm', // Adjusted position for one page fit
        left: '12mm',
        right: '12mm',
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb"
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
        width: 100,
        marginBottom: 1
    },
    signatureLabel: {
        fontSize: 8,
        color: "#6b7280"
    },
    dateLine: {
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
        width: 60,
        marginBottom: 1
    },
    dateLabel: {
        fontSize: 8,
        color: "#6b7280"
    },
    footer: {
        position: 'absolute',
        bottom: '5mm', // Very bottom with 5mm margin
        left: '12mm',
        right: '12mm',
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb"
    },
    footerLeft: {
        fontSize: 8,
        color: "#6b7280"
    },
    footerRight: {
        fontSize: 8,
        color: "#6b7280",
        fontWeight: "bold"
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
            {invoice.shopLogo ? (
                <Image 
                    src={invoice.shopLogo}
                    style={styles.logo}
                    cache={false}
                />
            ) : (
                <View style={styles.logoBox}>
                    <Text style={styles.logoText}>{invoice.shopName || 'SHOP NAME'}</Text>
                </View>
            )}
            {invoice.shop_tagline && (
                <Text style={styles.companyTagline}>"{invoice.shop_tagline}"</Text>
            )}
            <Text style={styles.businessInfo}>{invoice.shopAddress || ''}</Text>
            <Text style={styles.businessInfo}>{formatPhoneNumber(invoice.shopPhone) || ''}</Text>
            <Text style={styles.businessInfo}>Business #: {invoice.business_number || ''}</Text>
        </View>
        
        <View style={styles.headerRight}>
            <View style={styles.invoiceFields}>
                <Text style={styles.fieldLabel}>Invoice No:</Text>
                <Text style={styles.sectionContent}>{invoice.displayNumber || ''}</Text>
                {invoice.po_number && (
                    <>
                        <Text style={styles.fieldLabel}>PO Number:</Text>
                        <Text style={styles.sectionContent}>{invoice.po_number}</Text>
                    </>
                )}
                <Text style={styles.fieldLabel}>Date:</Text>
                <Text style={styles.sectionContent}>{formatDate(invoice.issueDate) || ''}</Text>
            </View>
            
            <View style={styles.paymentSection}>
                <Text style={styles.paymentTitle}>Method of Payment:</Text>
                <View style={styles.paymentOptions}>
                    <View style={styles.paymentOption}>
                        <View style={styles.checkbox}></View>
                        <Text style={styles.paymentLabel}>Cash</Text>
                    </View>
                    <View style={styles.paymentOption}>
                        <View style={styles.checkbox}></View>
                        <Text style={styles.paymentLabel}>Charge</Text>
                    </View>
                    <View style={styles.paymentOption}>
                        <View style={styles.checkbox}></View>
                        <Text style={styles.paymentLabel}>Debit</Text>
                    </View>
                </View>
            </View>
        </View>
    </View>
);

// Customer and Vehicle Info Component
const CustomerVehicleInfo = ({ invoice }: { invoice: any }) => (
    <View style={styles.customerVehicleRow}>
        <View style={styles.customerSection}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>Name:</Text>
                <Text style={styles.sectionContent}>{invoice.clientName || ''}</Text>
            </View>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>Address:</Text>
                <Text style={styles.sectionContent}>{invoice.clientAddress || ''}</Text>
            </View>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>City, Prov:</Text>
                <Text style={styles.sectionContent}>{invoice.clientCity || ''}, {invoice.clientProvince || ''}</Text>
            </View>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>Postal Code:</Text>
                <Text style={styles.sectionContent}>{invoice.clientPostalCode || ''}</Text>
            </View>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>Telephone:</Text>
                <Text style={styles.sectionContent}>{formatPhoneNumber(invoice.clientPhone) || ''}</Text>
            </View>
        </View>
        
        <View style={styles.vehicleSection}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>Make:</Text>
                <Text style={styles.sectionContent}>{invoice.vehicleInfo?.make || ''}</Text>
            </View>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>Model:</Text>
                <Text style={styles.sectionContent}>{invoice.vehicleInfo?.model || ''}</Text>
            </View>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>Year:</Text>
                <Text style={styles.sectionContent}>{invoice.vehicleInfo?.year || ''}</Text>
            </View>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>Plate:</Text>
                <Text style={styles.sectionContent}>
                    {invoice.vehicleInfo?.license_plate === null || invoice.vehicleInfo?.license_plate === "NULL" 
                        ? '' 
                        : invoice.vehicleInfo?.license_plate || ''}
                </Text>
            </View>
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSmall}>Odometer:</Text>
                <Text style={styles.sectionContent}>{invoice.mileage || ''}</Text>
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

    // Fill remaining rows with empty lines to total 10 rows
    const emptyRows = Math.max(0, 10 - allItems.length);

    return (
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.itemNoCol]}>Item No.</Text>
                <Text style={[styles.tableHeaderText, styles.qtyCol]}>Quantity</Text>
                <Text style={[styles.tableHeaderText, styles.descCol]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.unitPriceCol]}>Unit Price</Text>
                <Text style={[styles.tableHeaderText, styles.amountCol]}>Amount</Text>
            </View>
            
            {/* Actual invoice items */}
            {allItems.map((item, index) => (
                <View key={`item-${index}`} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={styles.itemNoCol}>{item.itemNumber}</Text>
                    <Text style={styles.qtyCol}>{item.quantity}</Text>
                    <Text style={styles.descCol}>{item.description}</Text>
                    <Text style={styles.unitPriceCol}>{formatCurrency(item.unitPrice)}</Text>
                    <Text style={styles.amountCol}>{formatCurrency(item.amount)}</Text>
                </View>
            ))}
            
            {/* Empty lines for manual filling */}
            {Array.from({ length: emptyRows }, (_, index) => (
                <View key={`empty-${index}`} style={(allItems.length + index) % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={styles.itemNoCol}></Text>
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
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesContent}>
                {invoice.notes}
            </Text>
        </View>
    );
};

// Legal Text Component
const LegalTextSection = () => (
    <View>
        <Text style={styles.legalText}>
            INVOICE COMMENTS: ALL WHEELS THAT ARE REMOVED ARE HAND TORQUED TO MANUFACTURER'S SPECIFICATIONS & SHOULD BE RE-TORQUED AFTER APPROXIMATELY 60KM.
        </Text>
        <Text style={styles.legalText}>
            I hereby authorize the above work to be completed along with necessary materials as permitted by law. I acknowledge that the shop will not be responsible for loss or damage to the vehicle or articles left in the vehicle in case of fire, theft, or any other cause beyond the shop's control. I further acknowledge that the said lien shall continue at all times, whether the vehicle is in my possession or that of the shop.
        </Text>
        <Text style={styles.legalText}>
            I further acknowledge that the said lien shall continue at all times, whether the vehicle is in my possession or that of the shop. The lien covers all labour, parts, taxes, and court costs until full payment is received.
        </Text>
    </View>
);

// Signature Section Component
const SignatureSection = () => (
    <View style={styles.signatureSection}>
        <View>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>Customer Acceptance</Text>
        </View>
        <View>
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
                
                <CustomerVehicleInfo invoice={invoice} />
                
                <ServiceItemsTable invoice={invoice} />
                
                <NotesSection invoice={invoice} />

                <PaymentSummary invoice={invoice} />
                
                
                {/* <LegalTextSection /> */}
                
                {/* <CommentsSection /> */}
                
                <SignatureSection />
                
                {/* <InvoiceFooter invoice={invoice} /> */}
            </Page>
        </Document>
    );
};
