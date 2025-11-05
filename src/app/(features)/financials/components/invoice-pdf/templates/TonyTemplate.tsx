import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { InvoicePDFData } from '../../../types/invoice-pdf'

const styles = StyleSheet.create({
    page: {
        padding: 15, // ~12-15mm margins on all sides
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
        width: '100%',
        height: '100%',
    },
    header: {
        backgroundColor: '#4a5568',
        padding: 12,
        paddingTop: 10,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        minHeight: 45, // ~45-50mm header height
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logoBox: {
        backgroundColor: '#ffffff',
        padding: 8,
        marginRight: 15,
        borderRadius: 4,
    },
    logoText: {
        fontSize: 14, // ~14pt for "GOOD GUYZ GARAGE"
        fontWeight: 'bold',
        color: '#2d3748',
        letterSpacing: 2,
    },
    logoSubtext: {
        fontSize: 8,
        color: '#2d3748',
        letterSpacing: 1,
        marginTop: 2,
    },
    tagline: {
        color: '#ffffff',
        fontSize: 12,
        fontStyle: 'italic',
        marginLeft: 10,
    },
    headerRight: {
        color: '#ffffff',
        textAlign: 'right',
        fontSize: 9,
    },
    businessNumber: {
        fontSize: 8,
        marginBottom: 2,
    },
    invoiceNumber: {
        fontSize: 11, // 10-11pt bold for Invoice No./Date
        fontWeight: 'bold',
        marginBottom: 2,
    },
    date: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    contactInfo: {
        backgroundColor: '#e2e8f0',
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottom: 1,
        borderBottomColor: '#cbd5e0',
        marginBottom: 8,
    },
    address: {
        fontSize: 10, // ~10pt for address/phone
        fontWeight: 'bold',
        color: '#2d3748',
        lineHeight: 1.3,
    },
    phone: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2d3748',
        marginTop: 4,
    },
    customerSection: {
        padding: 12,
        paddingTop: 10,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottom: 1,
        borderBottomColor: '#e2e8f0',
        marginBottom: 8,
    },
    customerInfo: {
        flex: 1,
    },
    vehicleInfo: {
        flex: 1,
        marginLeft: 30,
    },
    paymentInfo: {
        flex: 1,
        marginLeft: 30,
    },
    sectionLabel: {
        fontSize: 10, // ~10pt bold labels
        color: '#4a5568',
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    fieldLabel: {
        fontSize: 10,
        color: '#4a5568',
        marginBottom: 2,
        fontWeight: 'bold',
    },
    fieldValue: {
        fontSize: 10, // ~10pt for input fields
        color: '#2d3748',
        marginBottom: 6,
        borderBottom: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 2,
        minHeight: 14,
    },
    canadianOwned: {
        textAlign: 'center',
        padding: 8,
        backgroundColor: '#f7fafc',
        borderBottom: 1,
        borderBottomColor: '#e2e8f0',
    },
    canadianText: {
        fontSize: 9,
        color: '#4a5568',
        fontWeight: 'bold',
    },
    maple: {
        color: '#e53e3e',
        fontSize: 12,
        marginRight: 4,
    },
    itemsTable: {
        margin: 12,
        marginTop: 8,
        marginBottom: 0,
        flex: 1, // Table fills ~60% of page height
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4a5568',
        padding: 8,
        paddingTop: 6,
        paddingBottom: 6,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    tableHeaderText: {
        color: '#ffffff',
        fontSize: 11, // ~11pt bold for headers
        fontWeight: 'bold',
        textAlign: 'center',
    },
    itemNoHeader: {
        width: '12%', // Exact: Item No. 12%
    },
    quantityHeader: {
        width: '10%', // Updated: Quantity 10%
    },
    descriptionHeader: {
        width: '48%', // Updated: Description 48%
        textAlign: 'left',
    },
    unitPriceHeader: {
        width: '15%', // Unit Price 15%
    },
    amountHeader: {
        width: '15%', // Amount 15%
    },
    tableRow: {
        flexDirection: 'row',
        borderLeft: 1,
        borderLeftColor: '#cbd5e0',
        borderRight: 1,
        borderRightColor: '#cbd5e0',
        borderBottom: 1,
        borderBottomColor: '#cbd5e0',
        minHeight: 20, // ~18-20mm row height (20pt ≈ 18mm)
        alignItems: 'center',
        padding: 4,
        paddingTop: 6,
        paddingBottom: 6,
    },
    tableCell: {
        fontSize: 10, // ~10pt regular for table rows
        color: '#2d3748',
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    descriptionCell: {
        textAlign: 'left',
    },
    emptyRow: {
        height: 20, // Match row height
    },
    commentsSection: {
        margin: 15,
        marginTop: 0,
        marginBottom: 10,
    },
    commentsBox: {
        borderTop: 1,
        borderTopColor: '#cbd5e0',
        borderRight: 1,
        borderRightColor: '#cbd5e0',
        borderBottom: 1,
        borderBottomColor: '#cbd5e0',
        borderLeft: 1,
        borderLeftColor: '#cbd5e0',
        minHeight: 30, // ~25-30mm height for comments area
        padding: 8,
        backgroundColor: '#f7fafc',
    },
    commentsLabel: {
        fontSize: 8,
        color: '#4a5568',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    totalSection: {
        margin: 15,
        marginTop: 0,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalBox: {
        width: 150,
        borderTop: 1,
        borderTopColor: '#cbd5e0',
        borderRight: 1,
        borderRightColor: '#cbd5e0',
        borderBottom: 1,
        borderBottomColor: '#cbd5e0',
        borderLeft: 1,
        borderLeftColor: '#cbd5e0',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 6,
        borderBottom: 1,
        borderBottomColor: '#e2e8f0',
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    totalAmount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    terms: {
        margin: 15,
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f7fafc',
        borderTop: 1,
        borderTopColor: '#e2e8f0',
        borderRight: 1,
        borderRightColor: '#e2e8f0',
        borderBottom: 1,
        borderBottomColor: '#e2e8f0',
        borderLeft: 1,
        borderLeftColor: '#e2e8f0',
    },
    termsText: {
        fontSize: 9, // ~9pt italic/small for disclaimers
        color: '#4a5568',
        lineHeight: 1.3,
        marginBottom: 3,
        fontStyle: 'italic',
    },
    signature: {
        margin: 15,
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    signatureBox: {
        width: '45%',
        borderBottom: 1,
        borderBottomColor: '#2d3748',
        paddingBottom: 2,
    },
    signatureLabel: {
        fontSize: 8,
        color: '#4a5568',
        textAlign: 'center',
        marginTop: 4,
    },
})

export const TonyTemplate: React.FC<InvoicePDFData> = ({ invoice, shop }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        })
    }

    // Calculate totals - only active items
    const activeItems = invoice.invoice_items.filter(item => (item as any).active !== false)
    const subtotal = activeItems.reduce((sum, item) => {
        return sum + item.total_price
    }, 0)

    // Create empty rows to fill the table (minimum 10 rows)
    const minRows = 10
    const emptyRowsNeeded = Math.max(0, minRows - activeItems.length)
    const emptyRows = Array(emptyRowsNeeded).fill(null)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header with logo and business info */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        <View style={styles.logoBox}>
                            <Text style={styles.logoText}>GOOD</Text>
                            <Text style={styles.logoText}>GUYZ</Text>
                            <Text style={styles.logoSubtext}>G A R A G E</Text>
                        </View>
                        <Text style={styles.tagline}>"By Name. By Reputation."</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.businessNumber}>BUSINESS NO.: 894510635RT</Text>
                        <Text style={styles.invoiceNumber}>INVOICE NO.: {invoice.display_id || invoice.invoice_number}</Text>
                        <Text style={styles.date}>DATE: {formatDate(invoice.issue_date)}</Text>
                    </View>
                </View>

                {/* Contact Information */}
                <View style={styles.contactInfo}>
                    <Text style={styles.address}>
                        75 LODGE ST.,{'\n'}
                        WATERLOO, ON N2J 2V5
                    </Text>
                    <Text style={styles.phone}>(519) 885-1321</Text>
                </View>

                {/* Customer, Vehicle, and Payment Info */}
                <View style={styles.customerSection}>
                    <View style={styles.customerInfo}>
                        <Text style={styles.sectionLabel}>Customer Name</Text>
                        <Text style={styles.fieldValue}>{invoice.customer?.customer_name || ''}</Text>
                        
                        <Text style={styles.fieldLabel}>Address</Text>
                        <Text style={styles.fieldValue}>{invoice.customer?.customer_address || ''}</Text>
                        
                        <Text style={styles.fieldLabel}>City, Prov</Text>
                        <Text style={styles.fieldValue}></Text>
                        
                        <Text style={styles.fieldLabel}>Postal Code</Text>
                        <Text style={styles.fieldValue}></Text>
                        
                        <Text style={styles.fieldLabel}>Telephone</Text>
                        <Text style={styles.fieldValue}>{invoice.customer?.customer_phone || ''}</Text>
                    </View>

                    <View style={styles.vehicleInfo}>
                        <Text style={styles.sectionLabel}>Make</Text>
                        <Text style={styles.fieldValue}>{invoice.vehicle?.make || ''}</Text>
                        
                        <Text style={styles.fieldLabel}>Model</Text>
                        <Text style={styles.fieldValue}>{invoice.vehicle?.model || ''}</Text>
                        
                        <Text style={styles.fieldLabel}>Year</Text>
                        <Text style={styles.fieldValue}>{invoice.vehicle?.year || ''}</Text>
                        
                        <Text style={styles.fieldLabel}>Plate</Text>
                        <Text style={styles.fieldValue}>{invoice.vehicle?.license_plate || ''}</Text>
                        
                        <Text style={styles.fieldLabel}>Odometer</Text>
                        <Text style={styles.fieldValue}></Text>
                    </View>

                    <View style={styles.paymentInfo}>
                        <Text style={styles.sectionLabel}>Method of Payment</Text>
                        <Text style={styles.fieldLabel}>Cash ☐</Text>
                        <Text style={styles.fieldLabel}>Charge ☐</Text>
                        <Text style={styles.fieldLabel}>Debit ☐</Text>
                    </View>
                </View>

                {/* Canadian Owned Banner */}
                <View style={styles.canadianOwned}>
                    <Text style={styles.canadianText}>
                        <Text style={styles.maple}>🍁</Text>
                        100% CANADIAN OWNED & OPERATED!
                    </Text>
                </View>

                {/* Items Table */}
                <View style={styles.itemsTable}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.itemNoHeader]}>Item No.</Text>
                        <Text style={[styles.tableHeaderText, styles.quantityHeader]}>Quantity</Text>
                        <Text style={[styles.tableHeaderText, styles.descriptionHeader]}>Description</Text>
                        <Text style={[styles.tableHeaderText, styles.unitPriceHeader]}>Unit Price</Text>
                        <Text style={[styles.tableHeaderText, styles.amountHeader]}>Amount</Text>
                    </View>

                    {/* Invoice Items */}
                    {activeItems.map((item, index) => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.itemNoHeader]}>{index + 1}</Text>
                            <Text style={[styles.tableCell, styles.quantityHeader]}>{item.quantity}</Text>
                            <Text style={[styles.tableCell, styles.descriptionHeader, styles.descriptionCell]}>
                                {item.description}
                            </Text>
                            <Text style={[styles.tableCell, styles.unitPriceHeader]}>
                                {formatCurrency(item.unit_price)}
                            </Text>
                            <Text style={[styles.tableCell, styles.amountHeader]}>
                                {formatCurrency(item.total_price)}
                            </Text>
                        </View>
                    ))}

                    {/* Empty Rows */}
                    {emptyRows.map((_, index) => (
                        <View key={`empty-${index}`} style={[styles.tableRow, styles.emptyRow]}>
                            <Text style={[styles.tableCell, styles.itemNoHeader]}></Text>
                            <Text style={[styles.tableCell, styles.quantityHeader]}></Text>
                            <Text style={[styles.tableCell, styles.descriptionHeader]}></Text>
                            <Text style={[styles.tableCell, styles.unitPriceHeader]}></Text>
                            <Text style={[styles.tableCell, styles.amountHeader]}></Text>
                        </View>
                    ))}
                </View>

                {/* Comments Section */}
                <View style={styles.commentsSection}>
                    <View style={styles.commentsBox}>
                        <Text style={styles.commentsLabel}>COMMENTS</Text>
                        <Text style={styles.termsText}>{invoice.notes || ''}</Text>
                    </View>
                </View>

                {/* Total Section */}
                <View style={styles.totalSection}>
                    <View style={styles.totalBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalAmount}>{formatCurrency(invoice.total_amount)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>AMOUNT</Text>
                            <Text style={styles.totalAmount}></Text>
                        </View>
                    </View>
                </View>

                {/* Terms and Conditions */}
                <View style={styles.terms}>
                    <Text style={styles.termsText}>
                        INVOICE COMMENTS: ALL WHEELS THAT ARE REMOVED ARE HAND TORQUED TO MANUFACTURER'S SPECIFICATIONS & SHOULD BE RE-TORQUED AFTER APPROXIMATELY 100KM.
                    </Text>
                    <Text style={styles.termsText}>
                        I hereby authorize the above work to be completed along with necessary materials as permitted by law. Good Guyz Garage Inc. is not held responsible for any delays caused by delayed delivery of parts or materials required to complete the above repairs. I hereby authorize Good Guyz Garage Inc. and its employees to test drive my vehicle for the purpose of testing and/or inspection.
                    </Text>
                    <Text style={styles.termsText}>
                        I understand that the loss of theft of service or theft while left in the above. Good Guyz Garage Inc. cannot be held responsible for any delays caused by delayed delivery of parts or materials required to complete the above repairs. I acknowledge my indebtedness to Good Guyz Garage Inc. and the existence of a lien payment in full is received for the above charges. I acknowledge my indebtedness to Good Guyz Garage Inc. and the existence of a lien upon my vehicle in the amount listed above including, but not limited to labour costs, part costs, taxes, court costs and storage etc.
                    </Text>
                    <Text style={styles.termsText}>
                        I further acknowledge that the said lien shall continue at all times, whether the vehicle is in my possession or that of Good Guyz Garage Inc.
                    </Text>
                </View>

                {/* Signature Section */}
                <View style={styles.signature}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Customer Acceptance</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Date</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
