import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { InvoicePDFData } from '../../../types/invoice-pdf'

const styles = StyleSheet.create({
    page: {
        padding: 12,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    // Top section container
    topSection: {
        marginBottom: 8,
    },
    // Top row: logo | tagline+address | business info
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 45,
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    topCol1: {
        width: '33%',
        paddingLeft: 4,
        backgroundColor: '#000000',
    },
    topCol2: {
        width: '33%',
        paddingHorizontal: 4,
        flexDirection: 'column',
        alignItems: 'center',
    },
    topCol3: {
        width: '30%',
        textAlign: 'left',
    },
    logoText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e40af',
        letterSpacing: 2,
    },
    logoSubtext: {
        fontSize: 8,
        color: '#1e40af',
        letterSpacing: 1,
        marginTop: 2,
    },
    tagline: {
        color: '#1e40af',
        fontSize: 12,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    address: {
        color: '#1e40af',
        fontSize: 12,
        lineHeight: 1.4,
        fontWeight: 'bold',
    },
    businessNumber: {
        fontSize: 8,
        color: '#1e40af',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    invoiceNumber: {
        fontSize: 8,
        color: '#1e40af',
    },
    date: {
        fontSize: 8,
        color: '#1e40af',
    },
    // Customer/Vehicle/Payment row
    infoRow: {
        flexDirection: 'row',
        padding: 8,
        marginBottom: 6,
    },
    infoCol1: {
        width: '40%',
        paddingRight: 8,
    },
    infoCol2: {
        width: '35%',
        paddingHorizontal: 8,
    },
    infoCol3: {
        width: '25%',
        paddingLeft: 8,
    },
    sectionLabel: {
        fontSize: 8,
        color: '#1e40af',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    fieldRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    fieldLabel: {
        fontSize: 8,
        color: '#1e40af',
    },
    fieldValue: {
        fontSize: 8,
        color: '#1e40af',
        flex: 1,
        minHeight: 12,
        marginLeft: 4,
    },
    checkboxRow: {
        flexDirection: 'column',
        marginBottom: 4,
    },
    checkbox: {
        fontSize: 8,
        color: '#1e40af',
    },
    // Canadian banner
    canadianBanner: {
        textAlign: 'center',
        paddingVertical: 4,
        marginBottom: 6,
    },
    canadianText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    maple: {
        color: '#e53e3e',
        fontSize: 12,
        marginRight: 4,
    },
    // Middle section - Items table
    middleSection: {
        flex: 1,
        marginBottom: 6,
        flexDirection: 'column',
    },
    itemsTable: {
        marginBottom: 6,
        flex: 1,
        flexDirection: 'column',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#c7d2fe',
        padding: 6,
        borderWidth: 1,
        borderColor: '#a5b4fc',
    },
    tableHeaderText: {
        color: '#1e3a8a',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 6,
    },
    tableHeaderCell: {
        borderRightWidth: 1,
        borderRightColor: '#a5b4fc',
    },
    itemNoHeader: {
        width: '12%',
    },
    quantityHeader: {
        width: '10%',
    },
    descriptionHeader: {
        width: '48%',
        textAlign: 'center',
    },
    unitPriceHeader: {
        width: '15%',
    },
    amountHeader: {
        width: '15%',
    },
    tableRow: {
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderLeftColor: '#cbd5e0',
        borderRightWidth: 1,
        borderRightColor: '#cbd5e0',
        height: 24,
        alignItems: 'center',
        padding: 4,
    },
    tableCell: {
        fontSize: 9,
        color: '#1e40af',
        textAlign: 'center',
    },
    tableCellBorder: {
        borderRightWidth: 1,
        borderRightColor: '#cbd5e0',
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    descriptionCell: {
        textAlign: 'left',
    },
    emptyRow: {
        height: 24,
    },
    // Unified grid layout for comments, totals, invoice comments, signature
    unifiedGrid: {
        marginTop: 8,
        flexDirection: 'column',
    },
    // Row 1: Comments and Totals
    commentsTotalsRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    commentsCol: {
        width: '70%',
        paddingRight: 8,
    },
    totalsCol: {
        width: '30%',
    },
    commentsBox: {
        borderWidth: 1,
        borderColor: '#cbd5e0',
        padding: 6,
        flexDirection: 'column',
        minHeight: 40,
    },
    commentsLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 4,
    },
    commentsText: {
        fontSize: 7,
        color: '#1e40af',
        lineHeight: 1.2,
        fontStyle: 'italic',
        flex: 1,
    },
    totalsBox: {
        borderWidth: 1,
        borderColor: '#cbd5e0',
        flexDirection: 'column',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e0',
    },
    totalRowLast: {
        flex: 1,
        backgroundColor: '#c7d2fe',
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    totalAmount: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    // Row 2: Invoice Comments
    invoiceCommentsBox: {
        padding: 6,
        borderWidth: 1,
        borderColor: '#cbd5e0',
        marginBottom: 8,
    },
    invoiceCommentsText: {
        fontSize: 9,
        color: '#1e40af',
        lineHeight: 1.2,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    invoiceCommentsTextRegular: {
        fontSize: 8,
        color: '#1e40af',
        lineHeight: 1.2,
        marginBottom: 4,
    },
    // Row 3: Signature and Date - 4 columns
    signatureRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 8,
    },
    signatureCol1: {
        // Customer Acceptance text - auto width
    },
    signatureCol2: {
        width: '50%',
        borderBottomWidth: 1,
        borderBottomColor: '#2d3748',
        paddingBottom: 2,
    },
    signatureCol3: {
        // Date text - auto width
    },
    signatureCol4: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#2d3748',
        paddingBottom: 2,
    },
    signatureLabel: {
        fontSize: 8,
        color: '#1e40af',
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
    
    // Calculate subtotal - discounts subtract from subtotal, all other items add
    const subtotal = activeItems.reduce((sum, item) => {
        if ((item as any).item_type === 'discount') {
            return sum - item.total_price
        }
        return sum + item.total_price
    }, 0)

    // Calculate tax - tax_rate can be 0 or null if tax is disabled
    const taxRate = invoice.tax_rate ?? 0
    const taxAmount = taxRate > 0 ? subtotal * taxRate : 0
    
    // Get discount amount from invoice (separate from discount items)
    const discountAmount = invoice.discount_amount || 0
    
    // Calculate total: subtotal + tax - discount
    const total = subtotal + taxAmount - discountAmount

    // Create empty rows to fill the table (max 20 rows)
    const maxRows = 20
    const rowsToShow = Math.min(activeItems.length, maxRows)
    const emptyRowsNeeded = Math.max(0, maxRows - rowsToShow)
    const emptyRows = Array(emptyRowsNeeded).fill(null)
    const displayedItems = activeItems.slice(0, maxRows)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* TOP SECTION */}
                <View style={styles.topSection}>
                    {/* Row 1: Logo | Tagline+Address | Business Info */}
                    <View style={styles.topRow}>
                        <View style={styles.topCol1}>
                            <Text style={styles.logoText}>GOOD</Text>
                            <Text style={styles.logoText}>GUYZ</Text>
                            <Text style={styles.logoSubtext}>G A R A G E</Text>
                        </View>
                        <View style={styles.topCol2}>
                            <Text style={styles.tagline}>"By Name. By Reputation."</Text>
                            <Text style={styles.address}>
                                75 LODGE ST.,{'\n'}
                                WATERLOO, ON N2J 2V5{'\n'}
                                (519) 885-1321
                            </Text>
                        </View>
                        <View style={styles.topCol3}>
                            <Text style={styles.businessNumber}>BUSINESS NO.: 894510635RT</Text>
                            <Text style={styles.invoiceNumber}>INVOICE NO.: {invoice.display_id || invoice.invoice_number}</Text>
                            <Text style={styles.date}>DATE: {formatDate(invoice.issue_date)}</Text>
                        </View>
                    </View>

                    {/* Row 2: Customer | Vehicle | Payment Method */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol1}>
                            <Text style={styles.sectionLabel}>Customer Information</Text>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>CUSTOMER NAME:</Text>
                                <Text style={styles.fieldValue}>{invoice.customer?.customer_name || ''}</Text>
                            </View>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>ADDRESS:</Text>
                                <Text style={styles.fieldValue}>{invoice.customer?.customer_address || ''}</Text>
                            </View>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>CITY, PROV:</Text>
                                <Text style={styles.fieldValue}></Text>
                            </View>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>POSTAL CODE:</Text>
                                <Text style={styles.fieldValue}></Text>
                            </View>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>TELEPHONE:</Text>
                                <Text style={styles.fieldValue}>{invoice.customer?.customer_phone || ''}</Text>
                            </View>
                        </View>

                        <View style={styles.infoCol2}>
                            <Text style={styles.sectionLabel}>Vehicle Information</Text>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>MAKE:</Text>
                                <Text style={styles.fieldValue}> {invoice.vehicle?.make || ''}</Text>
                            </View>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>MODEL:</Text>
                                <Text style={styles.fieldValue}> {invoice.vehicle?.model || ''}</Text>
                            </View>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>YEAR:</Text>
                                <Text style={styles.fieldValue}> {invoice.vehicle?.year || ''}</Text>
                            </View>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>PLATE:</Text>
                                <Text style={styles.fieldValue}> {invoice.vehicle?.license_plate || ''}</Text>
                            </View>
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>ODOMETER:</Text>
                                <Text style={styles.fieldValue}></Text>
                            </View>
                        </View>

                        <View style={styles.infoCol3}>
                            <Text style={styles.sectionLabel}>Method of Payment</Text>
                            <View style={styles.checkboxRow}>
                                <Text style={styles.checkbox}>☐     Cash</Text>
                            </View>
                            <View style={styles.checkboxRow}>
                                <Text style={styles.checkbox}>☐     Charge</Text>
                            </View>
                            <View style={styles.checkboxRow}>
                                <Text style={styles.checkbox}>☐     Debit</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Canadian Owned Banner */}
                <View style={styles.canadianBanner}>
                    <Text style={styles.canadianText}>
                        <Text style={styles.maple}>🍁</Text>
                        100% CANADIAN OWNED & OPERATED!
                    </Text>
                </View>

                {/* MIDDLE SECTION - Items Table */}
                <View style={styles.middleSection}>
                    <View style={styles.itemsTable}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <View style={[styles.itemNoHeader, styles.tableHeaderCell]}>
                                <Text style={styles.tableHeaderText}>Item No.</Text>
                            </View>
                            <View style={[styles.quantityHeader, styles.tableHeaderCell]}>
                                <Text style={styles.tableHeaderText}>Quantity</Text>
                            </View>
                            <View style={[styles.descriptionHeader, styles.tableHeaderCell]}>
                                <Text style={styles.tableHeaderText}>Description</Text>
                            </View>
                            <View style={[styles.unitPriceHeader, styles.tableHeaderCell]}>
                                <Text style={styles.tableHeaderText}>Unit Price</Text>
                            </View>
                            <View style={styles.amountHeader}>
                                <Text style={styles.tableHeaderText}>Amount</Text>
                            </View>
                        </View>

                        {/* Invoice Items */}
                        {displayedItems.map((item, index) => (
                            <View key={item.id} style={styles.tableRow}>
                                <View style={[styles.itemNoHeader, styles.tableCellBorder]}>
                                    <Text style={styles.tableCell}>{item.item_type || ''}</Text>
                                </View>
                                <View style={[styles.quantityHeader, styles.tableCellBorder]}>
                                    <Text style={styles.tableCell}>
                                        {item.item_type === 'labor' ? item.labor_hours || item.quantity : item.quantity}
                                    </Text>
                                </View>
                                <View style={[styles.descriptionHeader, styles.tableCellBorder]}>
                                    <Text style={[styles.tableCell, styles.descriptionCell]}>{item.description}</Text>
                                </View>
                                <View style={[styles.unitPriceHeader, styles.tableCellBorder]}>
                                    <Text style={styles.tableCell}>{formatCurrency(item.unit_price)}</Text>
                                </View>
                                <View style={styles.amountHeader}>
                                    <Text style={styles.tableCell}>{formatCurrency(item.total_price)}</Text>
                                </View>
                            </View>
                        ))}

                        {/* Empty Rows */}
                        {emptyRows.map((_, index) => (
                            <View key={`empty-${index}`} style={[styles.tableRow, styles.emptyRow]}>
                                <View style={[styles.itemNoHeader, styles.tableCellBorder]}>
                                    <Text style={styles.tableCell}></Text>
                                </View>
                                <View style={[styles.quantityHeader, styles.tableCellBorder]}>
                                    <Text style={styles.tableCell}></Text>
                                </View>
                                <View style={[styles.descriptionHeader, styles.tableCellBorder]}>
                                    <Text style={[styles.tableCell, styles.descriptionCell]}></Text>
                                </View>
                                <View style={[styles.unitPriceHeader, styles.tableCellBorder]}>
                                    <Text style={styles.tableCell}></Text>
                                </View>
                                <View style={styles.amountHeader}>
                                    <Text style={styles.tableCell}></Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Unified Grid Layout - Comments, Totals, Invoice Comments, Signature */}
                    <View style={styles.unifiedGrid}>
                        {/* Row 1: Comments and Totals */}
                        <View style={styles.commentsTotalsRow}>
                            <View style={styles.commentsCol}>
                                <View style={styles.commentsBox}>
                                    <Text style={styles.commentsLabel}>COMMENTS</Text>
                                    <Text style={styles.commentsText}>{invoice.notes || ''}</Text>
                                </View>
                            </View>
                            <View style={styles.totalsCol}>
                                <View style={styles.totalsBox}>
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>SUBTOTAL</Text>
                                        <Text style={styles.totalAmount}>{formatCurrency(subtotal)}</Text>
                                    </View>
                                    {taxRate > 0 && (
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>TAX (HST)</Text>
                                            <Text style={styles.totalAmount}>{formatCurrency(taxAmount)}</Text>
                                        </View>
                                    )}
                                    {discountAmount > 0 && (
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>DISCOUNT</Text>
                                            <Text style={styles.totalAmount}>-{formatCurrency(discountAmount)}</Text>
                                        </View>
                                    )}
                                    <View style={[styles.totalRow, styles.totalRowLast]}>
                                        <Text style={styles.totalLabel}>TOTAL</Text>
                                        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Row 2: Invoice Comments */}
                        <View style={styles.invoiceCommentsBox}>
                            <Text style={styles.invoiceCommentsText}>
                                INVOICE COMMENTS: ALL WHEELS THAT ARE REMOVED ARE HAND TORQUED TO MANUFACTURER'S SPECIFICATIONS & SHOULD BE RE-TORQUED AFTER APPROXIMATELY 100KM.
                            </Text>
                            <Text style={styles.invoiceCommentsTextRegular}>
                                I hereby authorize the above work to be completed along with necessary materials as permitted by law. Good Guyz Garage Inc. is not held responsible for any delays caused by delayed delivery of parts or materials required to complete the above repairs. I hereby authorize Good Guyz Garage Inc. and its employees to test drive my vehicle for the purpose of testing and/or inspection.
                            </Text>
                            <Text style={styles.invoiceCommentsTextRegular}>
                                I understand that the loss of theft of service or theft while left in the above. Good Guyz Garage Inc. cannot be held responsible for any delays caused by delayed delivery of parts or materials required to complete the above repairs. I acknowledge my indebtedness to Good Guyz Garage Inc. and the existence of a lien payment in full is received for the above charges. I acknowledge my indebtedness to Good Guyz Garage Inc. and the existence of a lien upon my vehicle in the amount listed above including, but not limited to labour costs, part costs, taxes, court costs and storage etc.
                            </Text>
                            <Text style={styles.invoiceCommentsTextRegular}>
                                I further acknowledge that the said lien shall continue at all times, whether the vehicle is in my possession or that of Good Guyz Garage Inc.
                            </Text>

                            {/* Row 3: Signature and Date - 4 Column Grid */}
                            <View style={styles.signatureRow}>
                                <View style={styles.signatureCol1}>
                                    <Text style={styles.signatureLabel}>Customer Acceptance</Text>
                                </View>
                                <View style={styles.signatureCol2}></View>
                                <View style={styles.signatureCol3}>
                                    <Text style={styles.signatureLabel}>Date</Text>
                                </View>
                                <View style={styles.signatureCol4}></View>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
