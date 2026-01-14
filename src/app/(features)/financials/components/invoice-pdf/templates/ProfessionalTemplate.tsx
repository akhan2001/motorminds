import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { InvoicePDFData } from '../../../types/invoice-pdf'

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
        position: 'relative',
    },
    watermark: {
        position: 'absolute',
        top: '35%',
        left: '20%',
        width: '60%',
        textAlign: 'center',
    },
    watermarkText: {
        fontSize: 90,
        fontWeight: 'bold',
        color: '#d1d5db',
        opacity: 0.15,
        letterSpacing: 10,
    },
    content: {
        position: 'relative',
        zIndex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottom: 2,
        borderBottomColor: '#2563eb',
        paddingBottom: 10,
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
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
    },
    section: {
        marginBottom: 15,
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
        marginBottom: 12,
    },
    column: {
        width: '48%',
    },
    columnThree: {
        width: '32%',
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
        padding: 6,
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 9,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: 1,
        borderBottomColor: '#e5e7eb',
        padding: 6,
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
        marginTop: 15,
        alignItems: 'flex-end',
    },
    totalsBox: {
        width: '40%',
        borderTop: 2,
        borderTopColor: '#2563eb',
        paddingTop: 8,
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
        marginTop: 6,
        paddingTop: 6,
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
        marginTop: 15,
        padding: 10,
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
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
        borderTop: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
    },
    statusBadge: {
        padding: 4,
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statusPaid: {
        backgroundColor: '#10b981',
        color: '#ffffff',
    },
    statusPartiallyPaid: {
        backgroundColor: '#f59e0b',
        color: '#ffffff',
    },
    statusUnpaid: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
    },
    paymentInfo: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
    },
    workOrderSection: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
    },
    workOrderTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 4,
    },
    workOrderDescription: {
        fontSize: 9,
        color: '#4b5563',
        lineHeight: 1.4,
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

    // Format payment method
    const formatPaymentMethod = (method: string | null) => {
        if (!method) return null
        return method.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }

    // Format status
    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
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
    const taxRate = invoice.tax_rate ?? 0
    const tax = taxRate > 0 ? subtotal * taxRate : 0
    const total = subtotal + tax - invoice.discount_amount

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Watermark - Only show if paid */}
                {invoice.status === 'paid' && (
                    <View style={styles.watermark}>
                        <Text style={styles.watermarkText}>PAID</Text>
                    </View>
                )}

                <View style={styles.content}>
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
                            {shop.hst_number && <Text style={styles.shopDetail}>HST #: {shop.hst_number}</Text>}
                        </View>
                    </View>

                    {/* Invoice Title */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        {invoice.status && invoice.status !== 'draft' && (
                            <View style={[
                                styles.statusBadge,
                                invoice.status === 'paid' ? styles.statusPaid :
                                    invoice.status === 'partially_paid' ? styles.statusPartiallyPaid :
                                        (invoice.status === 'unpaid' || invoice.status === 'overdue') ? styles.statusUnpaid :
                                            invoice.status === 'cancelled' || invoice.status === 'refunded' ? styles.statusUnpaid :
                                                { backgroundColor: '#6b7280', color: '#ffffff' }
                            ]}>
                                <Text>{formatStatus(invoice.status)}</Text>
                            </View>
                        )}
                    </View>

                    {/* Invoice Details, Bill To & Vehicle Info - Same Row */}
                    <View style={styles.row}>
                        <View style={styles.columnThree}>
                            <Text style={styles.sectionTitle}>Invoice Details</Text>
                            <View style={{ marginBottom: 4 }}>
                                <Text style={styles.label}>Invoice Number</Text>
                                <Text style={styles.value}>{invoice.display_id || invoice.invoice_number}</Text>
                            </View>
                            <View style={{ marginBottom: 4 }}>
                                <Text style={styles.label}>Issue Date</Text>
                                <Text style={styles.value}>{formatDate(invoice.issue_date)}</Text>
                            </View>
                            {invoice.due_date && (
                                <View style={{ marginBottom: 4 }}>
                                    <Text style={styles.label}>Due Date</Text>
                                    <Text style={styles.value}>{formatDate(invoice.due_date)}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.columnThree}>
                            <Text style={styles.sectionTitle}>Bill To</Text>
                            {invoice.customer_type === 'walk_in' ? (
                                <View style={{ marginBottom: 4 }}>
                                    <Text style={styles.label}>Walk-in Customer</Text>
                                    <Text style={styles.value}>(No customer record on file)</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={{ marginBottom: 4 }}>
                                        <Text style={styles.label}>Customer Name</Text>
                                        <Text style={styles.value}>{invoice.customer?.customer_name || 'N/A'}</Text>
                                    </View>
                                    {invoice.customer?.customer_email && (
                                        <View style={{ marginBottom: 4 }}>
                                            <Text style={styles.label}>Email</Text>
                                            <Text style={styles.value}>{invoice.customer.customer_email}</Text>
                                        </View>
                                    )}
                                    {invoice.customer?.customer_phone && (
                                        <View style={{ marginBottom: 4 }}>
                                            <Text style={styles.label}>Phone</Text>
                                            <Text style={styles.value}>{invoice.customer.customer_phone}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                        <View style={styles.columnThree}>
                            <Text style={styles.sectionTitle}>Vehicle Information</Text>
                            {invoice.vehicle || invoice.walk_in_vehicle_info ? (
                                invoice.customer_type === 'walk_in' && invoice.walk_in_vehicle_info ? (
                                    <View>
                                        <Text style={styles.value}>
                                            {invoice.walk_in_vehicle_info.year} {invoice.walk_in_vehicle_info.make} {invoice.walk_in_vehicle_info.model}
                                            {invoice.walk_in_vehicle_info.license_plate
                                                ? ` - ${invoice.walk_in_vehicle_info.license_plate}`
                                                : ''
                                            }
                                        </Text>
                                    </View>
                                ) : invoice.vehicle ? (
                                    <View>
                                        <Text style={styles.value}>
                                            {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                            {invoice.vehicle.license_plate && invoice.vehicle.license_plate !== 'NULL'
                                                ? ` - ${invoice.vehicle.license_plate}`
                                                : ''
                                            }
                                        </Text>
                                    </View>
                                ) : null
                            ) : (
                                <Text style={[styles.value, { color: '#9ca3af' }]}>N/A</Text>
                            )}
                        </View>
                    </View>

                    {/* Items Table */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Items & Services</Text>

                        {/* Work Order Title & Description */}
                        {(invoice.title || invoice.description || invoice.work_order) && (
                            <View style={styles.workOrderSection}>
                                {invoice.work_order && (
                                    <View style={{ marginBottom: 4 }}>
                                        <Text style={styles.label}>Work Order #</Text>
                                        <Text style={styles.value}>{invoice.work_order.work_order_number}</Text>
                                    </View>
                                )}
                                {invoice.title && (
                                    <View style={{ marginBottom: 4 }}>
                                        <Text style={styles.workOrderTitle}>{invoice.title}</Text>
                                    </View>
                                )}
                                {invoice.description && (
                                    <View>
                                        <Text style={styles.label}>Description</Text>
                                        <Text style={styles.workOrderDescription}>{invoice.description}</Text>
                                    </View>
                                )}
                            </View>
                        )}

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
                            {taxRate > 0 && (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>HST ({(taxRate * 100).toFixed(2)}%):</Text>
                                    <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
                                </View>
                            )}
                            <View style={styles.grandTotal}>
                                <Text style={styles.grandTotalLabel}>Total Amount:</Text>
                                <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
                            </View>
                            {(invoice.amount_paid !== undefined && invoice.amount_paid > 0) && (
                                <>
                                    <View style={[styles.totalRow, { marginTop: 8, paddingTop: 8, borderTop: 1, borderTopColor: '#d1d5db' }]}>
                                        <Text style={styles.totalLabel}>Amount Paid:</Text>
                                        <Text style={[styles.totalValue, { color: '#10b981' }]}>
                                            {formatCurrency(invoice.amount_paid)}
                                        </Text>
                                    </View>
                                    {(invoice.outstanding_balance !== undefined && invoice.outstanding_balance > 0) && (
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Outstanding Balance:</Text>
                                            <Text style={[styles.totalValue, { color: '#f59e0b' }]}>
                                                {formatCurrency(invoice.outstanding_balance)}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </View>

                    {/* Payment Information */}
                    {(invoice.payment_method || invoice.paid_date || invoice.payment_reference) && (
                        <View style={styles.paymentInfo}>
                            <Text style={styles.sectionTitle}>Payment Information</Text>
                            {invoice.payment_method && (
                                <View style={{ marginBottom: 4 }}>
                                    <Text style={styles.label}>Payment Method</Text>
                                    <Text style={styles.value}>{formatPaymentMethod(invoice.payment_method)}</Text>
                                </View>
                            )}
                            {invoice.paid_date && (
                                <View style={{ marginBottom: 4 }}>
                                    <Text style={styles.label}>Paid Date</Text>
                                    <Text style={styles.value}>{formatDate(invoice.paid_date)}</Text>
                                </View>
                            )}
                            {invoice.payment_reference && (
                                <View style={{ marginBottom: 4 }}>
                                    <Text style={styles.label}>Payment Reference</Text>
                                    <Text style={styles.value}>{invoice.payment_reference}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Notes */}
                    {invoice.notes && (
                        <View style={styles.notes}>
                            <Text style={styles.notesTitle}>Notes:</Text>
                            <Text style={styles.notesText}>{invoice.notes}</Text>
                        </View>
                    )}

                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Thank you for your business!</Text>
                    <Text>Generated on {new Date().toLocaleDateString()}</Text>
                </View>
            </Page>
        </Document>
    )
}

