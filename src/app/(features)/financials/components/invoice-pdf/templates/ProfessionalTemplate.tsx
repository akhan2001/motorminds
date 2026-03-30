import React from 'react'
import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import type { InvoicePDFData } from '../../../types/invoice-pdf'
import { professionalTemplateStyles as styles } from './ProfessionalTemplate.styles'
import { formatDate, formatTime, formatDateTime } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'

export const ProfessionalTemplate: React.FC<InvoicePDFData> = ({ invoice, shop }) => {

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

    // Calculate totals - only active items, exclude expenses (tracking only), handle discounts correctly
    const activeItems = invoice.invoice_items.filter(
        item => (item as any).active !== false && (item as any).item_type !== 'expense'
    )

    // Order line items by type (stable within each type)
    const ITEM_TYPE_ORDER: Record<string, number> = {
        labor: 0,
        part: 1,
        service: 2,
        fee: 3,
        package: 4,
        discount: 5,
    }

    const orderedItems = activeItems
        .map((item, originalIndex) => ({ item, originalIndex }))
        .sort((a, b) => {
            const aType = (a.item as any).item_type as string | undefined
            const bType = (b.item as any).item_type as string | undefined
            const aRank = ITEM_TYPE_ORDER[aType ?? ''] ?? 999
            const bRank = ITEM_TYPE_ORDER[bType ?? ''] ?? 999

            if (aRank !== bRank) return aRank - bRank
            return a.originalIndex - b.originalIndex
        })
        .map(({ item }) => item)
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
            <Page size="A4" style={styles.page} wrap>
                {/* Watermark - Only show if paid */}
                {invoice.status === 'paid' && (
                    <View style={styles.watermark}>
                        <Text style={styles.watermarkText}>PAID</Text>
                    </View>
                )}

                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        {/* Logo - Left */}
                        <View>
                            {shop.logo_image_url && (
                                <Image
                                    src={shop.logo_image_url}
                                    style={styles.logo}
                                    cache={false}
                                />
                            )}
                        </View>
                        {/* Shop Name & Address - Middle */}
                        <View style={styles.shopNameAddress}>
                            <Text style={styles.shopName}>{shop.shop_name}</Text>
                            {shop.shop_address && <Text style={styles.shopDetail}>{shop.shop_address}</Text>}
                            {shop.shop_city && shop.shop_province && (
                                <Text style={styles.shopDetail}>{shop.shop_city}, {shop.shop_province}</Text>
                            )}
                        </View>
                        {/* Phone, Email, HST - Right */}
                        <View style={styles.shopInfo}>
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
                            <View style={{ marginBottom: 4 }}>
                                <Text style={styles.label}>Issue Time</Text>
                                <Text style={styles.value}>{formatTime(invoice.issue_date)}</Text>
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
                                        {invoice.walk_in_vehicle_info.year && invoice.walk_in_vehicle_info.make && invoice.walk_in_vehicle_info.model && (
                                            <View style={styles.vehicleInfoRow}>
                                                <Text style={styles.value}>
                                                    {invoice.walk_in_vehicle_info.year} {invoice.walk_in_vehicle_info.make} {invoice.walk_in_vehicle_info.model}
                                                </Text>
                                            </View>
                                        )}
                                        {invoice.walk_in_vehicle_info.license_plate && (
                                            <View style={styles.vehicleInfoRow}>
                                                <Text style={styles.label}>License Plate</Text>
                                                <Text style={styles.value}>{invoice.walk_in_vehicle_info.license_plate}</Text>
                                            </View>
                                        )}
                                        {invoice.walk_in_vehicle_info.vin && (
                                            <View style={styles.vehicleInfoRow}>
                                                <Text style={styles.label}>VIN</Text>
                                                <Text style={styles.value}>{invoice.walk_in_vehicle_info.vin}</Text>
                                            </View>
                                        )}
                                        {invoice.walk_in_vehicle_info.mileage !== undefined && invoice.walk_in_vehicle_info.mileage !== null && (
                                            <View style={styles.vehicleInfoRow}>
                                                <Text style={styles.label}>Mileage</Text>
                                                <Text style={styles.value}>{invoice.walk_in_vehicle_info.mileage.toLocaleString()} km</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : invoice.vehicle ? (
                                    <View>
                                        {invoice.vehicle.year && invoice.vehicle.make && invoice.vehicle.model && (
                                            <View style={styles.vehicleInfoRow}>
                                                <Text style={styles.label}>Vehicle</Text>
                                                <Text style={styles.value}>
                                                    {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model} {invoice.vehicle.engine_type ? `(${invoice.vehicle.engine_type})` : ''}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.vehicleInfoRow}>
                                            <Text style={styles.label}>VIN</Text>
                                            {invoice.vehicle.vin && (
                                                <Text style={styles.value}>{invoice.vehicle.vin}</Text>
                                            )}
                                        </View>
                                        <View style={styles.vehicleInfoRow}>
                                            <Text style={styles.label}>Mileage</Text>
                                            {invoice.vehicle.mileage !== undefined && invoice.vehicle.mileage !== null && (
                                                <Text style={styles.value}>{invoice.vehicle.mileage.toLocaleString()} km</Text>
                                            )}
                                        </View>
                                        <View style={styles.vehicleInfoRow}>
                                            <Text style={styles.label}>License Plate</Text>
                                            {invoice.vehicle.license_plate && invoice.vehicle.license_plate !== 'NULL' && (
                                                <Text style={styles.value}>{invoice.vehicle.license_plate}</Text>
                                            )}
                                        </View>
                                    </View>
                                ) : null
                            ) : (
                                <Text style={[styles.value, { color: '#9ca3af' }]}>N/A</Text>
                            )}
                        </View>
                    </View>

                    {/* Items Table */}
                    <View style={styles.section}>
                        {/* Work Order Title & Description */}
                        {(invoice.title || invoice.description || invoice.work_order) && (
                            <View style={styles.workOrderSection}>
                                {invoice.title && (
                                    <View style={{ marginBottom: 4 }}>
                                        <Text style={styles.workOrderTitle}>{invoice.title}</Text>
                                    </View>
                                )}
                                {invoice.description && (
                                    <View>
                                        <Text style={styles.label}>Customer Request</Text>
                                        <Text style={styles.workOrderDescription}>{invoice.description}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.table}>
                            <Text style={styles.sectionTitle}>Items & Services</Text>
                            <View style={styles.tableHeader}>
                                <Text style={styles.col1}>Description</Text>
                                <Text style={styles.col2}>Type</Text>
                                <Text style={styles.col3}>Qty</Text>
                                <Text style={styles.col4}>Unit Price</Text>
                                <Text style={styles.col5}>Total</Text>
                            </View>
                            {orderedItems.map((item, index) => {
                                const isDiscount = (item as any).item_type === 'discount'
                                const itemNotes = (item as any).invoice_specific_notes
                                return (
                                    <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                                        <View style={styles.col1}>
                                            <Text>{item.description}</Text>
                                            {itemNotes && (
                                                <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{itemNotes}</Text>
                                            )}
                                        </View>
                                        <Text style={styles.col2}>{(item.item_type as string).charAt(0).toUpperCase() + (item.item_type as string).slice(1)}</Text>
                                        <Text style={styles.col3}>
                                            {item.item_type === 'labor' ? item.labor_hours || item.quantity : item.quantity}
                                        </Text>
                                        <Text style={styles.col4}>{formatCurrency(item.unit_price)}</Text>
                                        <Text style={styles.col5}>
                                            {isDiscount ? '-' : ''}{formatCurrency(item.total_price)}
                                        </Text>
                                    </View>
                                )
                            })}
                        </View>
                    </View>

                    {/* Totals */}
                    <View style={styles.totalsSection} wrap={false}>
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
                                        <Text style={styles.totalValue}>
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
                        </View>
                    </View>

                    {/* Payment Info */}
                    {(invoice.status === 'paid' || invoice.status === 'partially_paid' ||
                        invoice.payment_method || invoice.paid_date || invoice.payment_reference ||
                        (invoice.payments && invoice.payments.length > 0)) && (
                        <View style={styles.paymentInfo} wrap={false}>
                            <Text style={styles.sectionTitle}>Payments</Text>

                            {invoice.payments && invoice.payments.length > 0 ? (
                                <View style={styles.paymentHistory}>
                                    <View style={styles.paymentHistoryHeader}>
                                        <Text style={[styles.paymentHistoryHeaderText, { width: '25%' }]}>Date</Text>
                                        <Text style={[styles.paymentHistoryHeaderText, { width: '25%' }]}>Method</Text>
                                        <Text style={[styles.paymentHistoryHeaderText, { width: '25%', textAlign: 'right' }]}>Amount</Text>
                                        <Text style={[styles.paymentHistoryHeaderText, { width: '25%', textAlign: 'right' }]}>Reference</Text>
                                    </View>
                                    {invoice.payments
                                        .filter(payment => !payment.deleted)
                                        .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
                                        .map((payment, index) => (
                                            <View key={payment.id || index} style={styles.paymentHistoryRow}>
                                                <Text style={{ fontSize: 9, width: '25%' }}>
                                                    {formatDate(payment.payment_date)}
                                                </Text>
                                                <Text style={{ fontSize: 9, width: '25%' }}>
                                                    {formatPaymentMethod(payment.payment_method)}
                                                </Text>
                                                <Text style={{ fontSize: 9, width: '25%', textAlign: 'right' }}>
                                                    {formatCurrency(payment.amount)}
                                                </Text>
                                                <Text style={{ fontSize: 9, width: '25%', textAlign: 'right', color: '#6b7280' }}>
                                                    {payment.payment_reference || '-'}
                                                </Text>
                                            </View>
                                        ))}
                                </View>
                            ) : (
                                <>
                                    {(() => {
                                        const latestPayment = invoice.payments && invoice.payments.length > 0
                                            ? invoice.payments.filter(p => !p.deleted).sort((a, b) =>
                                                new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
                                            )[0]
                                            : null
                                        const displayPaymentMethod = invoice.payment_method || latestPayment?.payment_method

                                        return displayPaymentMethod ? (
                                            <View style={{ marginBottom: 4 }}>
                                                <Text style={styles.label}>Payment Method</Text>
                                                <Text style={styles.value}>{formatPaymentMethod(displayPaymentMethod)}</Text>
                                            </View>
                                        ) : null
                                    })()}

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
                                </>
                            )}
                        </View>
                    )}

                    {/* Recommendations */}
                    {invoice.notes && (
                        <View style={styles.notes} wrap={false}>
                            <Text style={styles.notesTitle}>Recommendation:</Text>
                            <Text style={styles.notesText}>{invoice.notes}</Text>
                        </View>
                    )}

                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    />
                    <Text
                        render={({ pageNumber, totalPages }) =>
                            pageNumber === totalPages ? 'Thank you for your business!' : ''
                        }
                    />
                </View>
            </Page>
        </Document>
    )
}

