import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { InvoicePDFData } from '../../../types/invoice-pdf'

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottom: 2,
        borderBottomColor: '#2563eb',
        paddingBottom: 15,
    },
    logo: {
        width: 80,
        height: 80,
        objectFit: 'contain',
    },
    shopInfo: {
        textAlign: 'right',
    },
    shopName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 4,
    },
    shopDetail: {
        fontSize: 9,
        color: '#4b5563',
        marginBottom: 2,
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    column: {
        width: '48%',
    },
    label: {
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 10,
        color: '#111827',
        fontWeight: 'bold',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e40af',
        padding: 8,
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 9,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: 1,
        borderBottomColor: '#e5e7eb',
        padding: 8,
        fontSize: 9,
    },
    tableRowAlt: {
        backgroundColor: '#f9fafb',
    },
    col1: { width: '40%' },
    col2: { width: '15%', textAlign: 'center' },
    col3: { width: '15%', textAlign: 'center' },
    col4: { width: '15%', textAlign: 'right' },
    col5: { width: '15%', textAlign: 'right' },
    totalsSection: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalsBox: {
        width: '40%',
        borderTop: 2,
        borderTopColor: '#2563eb',
        paddingTop: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    totalLabel: {
        fontSize: 10,
        color: '#4b5563',
    },
    totalValue: {
        fontSize: 10,
        color: '#111827',
        fontWeight: 'bold',
    },
    grandTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTop: 1,
        borderTopColor: '#d1d5db',
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    notes: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
    },
    notesTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 4,
    },
    notesText: {
        fontSize: 9,
        color: '#6b7280',
        lineHeight: 1.4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
        borderTop: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
    },
})

export const ProfessionalTemplate: React.FC<InvoicePDFData> = ({ invoice, shop }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    }

    // Calculate totals - only active items, handle discounts correctly
    const activeItems = invoice.invoice_items.filter(item => (item as any).active !== false)
    const subtotal = activeItems.reduce((sum, item) => {
        // Discounts subtract from subtotal, all other items add
        if ((item as any).item_type === 'discount') {
            return sum - item.total_price
        }
        return sum + item.total_price
    }, 0)
    const tax = subtotal * invoice.tax_rate
    const total = subtotal + tax - invoice.discount_amount

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.shopName}>{shop.shop_name}</Text>
                    </View>
                    <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>{shop.shop_name}</Text>
                        {shop.shop_address && <Text style={styles.shopDetail}>{shop.shop_address}</Text>}
                        {shop.shop_city && shop.shop_province && (
                            <Text style={styles.shopDetail}>{shop.shop_city}, {shop.shop_province}</Text>
                        )}
                        {shop.shop_phone && <Text style={styles.shopDetail}>Phone: {shop.shop_phone}</Text>}
                        {shop.shop_email && <Text style={styles.shopDetail}>Email: {shop.shop_email}</Text>}
                    </View>
                </View>

                {/* Invoice Title */}
                <Text style={styles.invoiceTitle}>INVOICE</Text>

                {/* Invoice Details & Customer Info */}
                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.sectionTitle}>Invoice Details</Text>
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.label}>Invoice Number</Text>
                            <Text style={styles.value}>{invoice.display_id || invoice.invoice_number}</Text>
                        </View>
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.label}>Issue Date</Text>
                            <Text style={styles.value}>{formatDate(invoice.issue_date)}</Text>
                        </View>
                        {invoice.due_date && (
                            <View style={{ marginBottom: 6 }}>
                                <Text style={styles.label}>Due Date</Text>
                                <Text style={styles.value}>{formatDate(invoice.due_date)}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.sectionTitle}>Bill To</Text>
                        {invoice.customer_type === 'walk_in' ? (
                            <View style={{ marginBottom: 6 }}>
                                <Text style={styles.label}>Walk-in Customer</Text>
                                <Text style={styles.value}>(No customer record on file)</Text>
                            </View>
                        ) : (
                            <>
                                <View style={{ marginBottom: 6 }}>
                                    <Text style={styles.label}>Customer Name</Text>
                                    <Text style={styles.value}>{invoice.customer?.customer_name || 'N/A'}</Text>
                                </View>
                                {invoice.customer?.customer_email && (
                                    <View style={{ marginBottom: 6 }}>
                                        <Text style={styles.label}>Email</Text>
                                        <Text style={styles.value}>{invoice.customer.customer_email}</Text>
                                    </View>
                                )}
                                {invoice.customer?.customer_phone && (
                                    <View style={{ marginBottom: 6 }}>
                                        <Text style={styles.label}>Phone</Text>
                                        <Text style={styles.value}>{invoice.customer.customer_phone}</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>

                {/* Vehicle Info */}
                {(invoice.vehicle || invoice.walk_in_vehicle_info) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Vehicle Information</Text>
                        {invoice.customer_type === 'walk_in' && invoice.walk_in_vehicle_info ? (
                            <Text style={styles.value}>
                                {invoice.walk_in_vehicle_info.year} {invoice.walk_in_vehicle_info.make} {invoice.walk_in_vehicle_info.model}
                                {invoice.walk_in_vehicle_info.license_plate 
                                    ? ` - ${invoice.walk_in_vehicle_info.license_plate}` 
                                    : ''
                                }
                            </Text>
                        ) : invoice.vehicle ? (
                            <Text style={styles.value}>
                                {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                {invoice.vehicle.license_plate && invoice.vehicle.license_plate !== 'NULL' 
                                    ? ` - ${invoice.vehicle.license_plate}` 
                                    : ''
                                }
                            </Text>
                        ) : null}
                    </View>
                )}

                {/* Items Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items & Services</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.col1}>Description</Text>
                            <Text style={styles.col2}>Type</Text>
                            <Text style={styles.col3}>Qty</Text>
                            <Text style={styles.col4}>Unit Price</Text>
                            <Text style={styles.col5}>Total</Text>
                        </View>
                        {activeItems.map((item, index) => {
                            const isDiscount = (item as any).item_type === 'discount'
                            return (
                                <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                                    <Text style={styles.col1}>{item.description}</Text>
                                    <Text style={styles.col2}>{(item.item_type as string).charAt(0).toUpperCase() + (item.item_type as string).slice(1)}</Text>
                                    <Text style={styles.col3}>
                                        {item.item_type === 'labor' ? item.labor_hours || item.quantity : item.quantity}
                                    </Text>
                                    <Text style={styles.col4}>{formatCurrency(item.unit_price)}</Text>
                                    <Text style={[styles.col5, isDiscount ? { color: '#dc2626' } : {}]}>
                                        {isDiscount ? '-' : ''}{formatCurrency(item.total_price)}
                                    </Text>
                                </View>
                            )
                        })}
                    </View>
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalsBox}>
                        {(() => {
                            // Calculate discount items total
                            const discountItemsTotal = activeItems
                                .filter(item => (item as any).item_type === 'discount')
                                .reduce((sum, item) => sum + item.total_price, 0)
                            const totalDiscounts = discountItemsTotal + invoice.discount_amount
                            
                            return totalDiscounts > 0 ? (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Discount:</Text>
                                    <Text style={[styles.totalValue, { color: '#dc2626' }]}>
                                        -{formatCurrency(totalDiscounts)}
                                    </Text>
                                </View>
                            ) : null
                        })()}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Tax ({(invoice.tax_rate * 100).toFixed(2)}%):</Text>
                            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
                        </View>
                        <View style={styles.grandTotal}>
                            <Text style={styles.grandTotalLabel}>Total Amount:</Text>
                            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Notes */}
                {invoice.notes && (
                    <View style={styles.notes}>
                        <Text style={styles.notesTitle}>Notes:</Text>
                        <Text style={styles.notesText}>{invoice.notes}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Thank you for your business!</Text>
                    <Text>Generated on {new Date().toLocaleDateString()}</Text>
                </View>
            </Page>
        </Document>
    )
}

