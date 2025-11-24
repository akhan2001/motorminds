import { StyleSheet } from '@react-pdf/renderer'

// Create styles
export const modernTemplateStyles = StyleSheet.create({
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