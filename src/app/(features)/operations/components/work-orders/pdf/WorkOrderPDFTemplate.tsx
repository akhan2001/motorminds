import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import type { WorkOrderItem } from '../../../types/work-order-items'
import type { ShopBranding } from '../../../../financials/types/invoice-pdf'
import { formatCurrency } from '@/lib/utils/currency'
import { format } from 'date-fns'

const TAX_RATE = 0.13

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#1a1a1a',
        backgroundColor: '#ffffff',
        paddingTop: 32,
        paddingBottom: 48,
        paddingHorizontal: 36,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#e5e7eb',
    },
    logo: { width: 70, height: 40, objectFit: 'contain' },
    shopNameAddress: { flex: 1, marginLeft: 12 },
    shopName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 2 },
    shopDetail: { fontSize: 8, color: '#6b7280', marginBottom: 1 },
    shopInfo: { alignItems: 'flex-end' },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    documentTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#111827', letterSpacing: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, fontSize: 9, fontFamily: 'Helvetica-Bold' },
    statusEstimate: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
    statusInProgress: { backgroundColor: '#fef9c3', color: '#854d0e' },
    statusWaiting: { backgroundColor: '#ffedd5', color: '#9a3412' },
    statusReady: { backgroundColor: '#f3e8ff', color: '#7e22ce' },
    infoRow: { flexDirection: 'row', marginBottom: 16, gap: 12 },
    infoColumn: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 4,
    },
    label: { fontSize: 7.5, color: '#6b7280', marginBottom: 1 },
    value: { fontSize: 8.5, color: '#111827', marginBottom: 5, fontFamily: 'Helvetica-Bold' },
    valueNormal: { fontSize: 8.5, color: '#111827', marginBottom: 5 },
    tableContainer: { marginBottom: 16 },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 3,
        marginBottom: 2,
    },
    tableHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    tableRowAlt: { backgroundColor: '#f9fafb' },
    tableCell: { fontSize: 8.5, color: '#374151' },
    tableCellBold: { fontSize: 8.5, color: '#111827', fontFamily: 'Helvetica-Bold' },
    colType: { width: '12%' },
    colDesc: { flex: 1 },
    colQty: { width: '10%', textAlign: 'right' },
    colUnit: { width: '14%', textAlign: 'right' },
    colTotal: { width: '14%', textAlign: 'right' },
    totalsContainer: { alignSelf: 'flex-end', width: '40%', marginBottom: 16 },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8 },
    totalsLabel: { fontSize: 8.5, color: '#6b7280' },
    totalsValue: { fontSize: 8.5, color: '#111827' },
    totalDivider: { borderTopWidth: 1, borderTopColor: '#d1d5db', marginVertical: 3, marginHorizontal: 8 },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        paddingHorizontal: 8,
        backgroundColor: '#111827',
        borderRadius: 3,
    },
    totalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
    totalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
    notesBox: {
        backgroundColor: '#f9fafb',
        borderRadius: 4,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 12,
    },
    notesText: { fontSize: 8.5, color: '#374151', lineHeight: 1.5 },
    pageFooter: {
        position: 'absolute',
        bottom: 20,
        left: 36,
        right: 36,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 6,
    },
    footerText: { fontSize: 7, color: '#9ca3af' },
})

export function getWorkOrderDocumentLabel(status: string): string {
    switch (status.toLowerCase()) {
        case 'pending':    return 'ESTIMATE'
        case 'approved':   return 'APPROVED ESTIMATE'
        case 'in_progress': return 'WORK IN PROGRESS'
        case 'waiting_parts': return 'WAITING FOR PARTS'
        case 'waiting_customer': return 'AWAITING APPROVAL'
        case 'ready':      return 'READY FOR PICKUP'
        default:           return 'WORK ORDER'
    }
}

function getStatusBadgeStyle(status: string) {
    const s = status.toLowerCase()
    if (s === 'pending' || s === 'approved') return styles.statusEstimate
    if (s === 'in_progress') return styles.statusInProgress
    if (s === 'waiting_parts' || s === 'waiting_customer') return styles.statusWaiting
    if (s === 'ready') return styles.statusReady
    return styles.statusEstimate
}

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A'
    try { return format(new Date(dateString), 'MMM d, yyyy') } catch { return 'N/A' }
}

export interface WorkOrderPDFData {
    workOrder: WorkOrderWithDetails
    workOrderItems?: WorkOrderItem[]
    shop: ShopBranding
}

export const WorkOrderPDFTemplate: React.FC<WorkOrderPDFData> = ({ workOrder, workOrderItems = [], shop }) => {
    const billableItems = workOrderItems.filter(
        item => item.item_type !== 'expense' && (item as any).active !== false
    )

    const subtotal = billableItems.reduce((sum, item) => {
        const qty = item.item_type === 'labor' ? (item.labor_hours || 0) : (item.quantity || 0)
        return sum + qty * (item.unit_price || 0)
    }, 0)
    const tax = subtotal * TAX_RATE
    const total = subtotal + tax

    const documentLabel = getWorkOrderDocumentLabel(workOrder.status)
    const isWalkIn = workOrder.customer_type === 'walk_in' || !workOrder.customer

    const vehicleInfo = workOrder.vehicle
        ? `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}`
        : workOrder.walk_in_vehicle_info
            ? `${workOrder.walk_in_vehicle_info.year} ${workOrder.walk_in_vehicle_info.make} ${workOrder.walk_in_vehicle_info.model}`
            : null

    return (
        <Document>
            <Page size="A4" style={styles.page} wrap>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <View>
                        {shop.logo_image_url && (
                            <Image src={shop.logo_image_url} style={styles.logo} cache={false} />
                        )}
                    </View>
                    <View style={styles.shopNameAddress}>
                        <Text style={styles.shopName}>{shop.shop_name}</Text>
                        {shop.shop_address && <Text style={styles.shopDetail}>{shop.shop_address}</Text>}
                        {shop.shop_city && shop.shop_province && (
                            <Text style={styles.shopDetail}>{shop.shop_city}, {shop.shop_province}</Text>
                        )}
                    </View>
                    <View style={styles.shopInfo}>
                        {shop.shop_phone && <Text style={styles.shopDetail}>Phone: {shop.shop_phone}</Text>}
                        {shop.shop_email && <Text style={styles.shopDetail}>Email: {shop.shop_email}</Text>}
                        {shop.hst_number && <Text style={styles.shopDetail}>HST #: {shop.hst_number}</Text>}
                    </View>
                </View>

                {/* ── Title + Badge ── */}
                <View style={styles.titleRow}>
                    <Text style={styles.documentTitle}>{documentLabel}</Text>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(workOrder.status)]}>
                        <Text>{documentLabel}</Text>
                    </View>
                </View>

                {/* ── Info Row: WO Details | Customer | Vehicle ── */}
                <View style={styles.infoRow}>
                    <View style={styles.infoColumn}>
                        <Text style={styles.sectionTitle}>Work Order Details</Text>
                        <Text style={styles.label}>Work Order #</Text>
                        <Text style={styles.value}>{workOrder.work_order_number}</Text>
                        <Text style={styles.label}>Date Created</Text>
                        <Text style={styles.value}>{formatDate(workOrder.created_at)}</Text>
                        {workOrder.started_at && (
                            <>
                                <Text style={styles.label}>Date Started</Text>
                                <Text style={styles.value}>{formatDate(workOrder.started_at)}</Text>
                            </>
                        )}
                        {workOrder.title && (
                            <>
                                <Text style={styles.label}>Title</Text>
                                <Text style={styles.valueNormal}>{workOrder.title}</Text>
                            </>
                        )}
                    </View>

                    <View style={styles.infoColumn}>
                        <Text style={styles.sectionTitle}>Customer</Text>
                        {isWalkIn ? (
                            <>
                                <Text style={styles.label}>Type</Text>
                                <Text style={styles.value}>Walk-in Customer</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.label}>Name</Text>
                                <Text style={styles.value}>{workOrder.customer?.customer_name || 'N/A'}</Text>
                                {workOrder.customer?.customer_email && (
                                    <>
                                        <Text style={styles.label}>Email</Text>
                                        <Text style={styles.valueNormal}>{workOrder.customer.customer_email}</Text>
                                    </>
                                )}
                                {workOrder.customer?.customer_phone && (
                                    <>
                                        <Text style={styles.label}>Phone</Text>
                                        <Text style={styles.valueNormal}>{workOrder.customer.customer_phone}</Text>
                                    </>
                                )}
                                {workOrder.customer?.customer_address && (
                                    <>
                                        <Text style={styles.label}>Address</Text>
                                        <Text style={styles.valueNormal}>{workOrder.customer.customer_address}</Text>
                                    </>
                                )}
                            </>
                        )}
                    </View>

                    <View style={styles.infoColumn}>
                        <Text style={styles.sectionTitle}>Vehicle</Text>
                        {vehicleInfo ? (
                            <>
                                <Text style={styles.label}>Vehicle</Text>
                                <Text style={styles.value}>{vehicleInfo}</Text>
                                {(workOrder.vehicle?.license_plate || workOrder.walk_in_vehicle_info?.license_plate) && (
                                    <>
                                        <Text style={styles.label}>License Plate</Text>
                                        <Text style={styles.valueNormal}>
                                            {workOrder.vehicle?.license_plate || workOrder.walk_in_vehicle_info?.license_plate}
                                        </Text>
                                    </>
                                )}
                                {(workOrder.vehicle?.vin || workOrder.walk_in_vehicle_info?.vin) && (
                                    <>
                                        <Text style={styles.label}>VIN</Text>
                                        <Text style={styles.valueNormal}>
                                            {workOrder.vehicle?.vin || workOrder.walk_in_vehicle_info?.vin}
                                        </Text>
                                    </>
                                )}
                                {(workOrder.vehicle?.mileage != null || workOrder.walk_in_vehicle_info?.mileage != null) && (
                                    <>
                                        <Text style={styles.label}>Mileage</Text>
                                        <Text style={styles.valueNormal}>
                                            {(workOrder.vehicle?.mileage || Number(workOrder.walk_in_vehicle_info?.mileage) || 0).toLocaleString()} km
                                        </Text>
                                    </>
                                )}
                            </>
                        ) : (
                            <Text style={styles.valueNormal}>No vehicle on file</Text>
                        )}
                    </View>
                </View>

                {/* ── Customer Request / Description ── */}
                {workOrder.description && (
                    <View style={styles.notesBox}>
                        <Text style={styles.sectionTitle}>Customer Request</Text>
                        <Text style={styles.notesText}>{workOrder.description}</Text>
                    </View>
                )}

                {/* ── Line Items Table ── */}
                {billableItems.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Services &amp; Parts</Text>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, styles.colType]}>Type</Text>
                            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
                            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty/Hrs</Text>
                            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit Price</Text>
                            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
                        </View>
                        {billableItems.map((item, index) => {
                            const isLabor = item.item_type === 'labor'
                            const qty = isLabor ? (item.labor_hours || 0) : (item.quantity || 0)
                            const itemTotal = qty * (item.unit_price || 0)
                            return (
                                <View key={item.id || index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}, index === billableItems.length - 1 ? { marginBottom: 16 } : {}]}>
                                    <Text style={[styles.tableCell, styles.colType]}>
                                        {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                                    <Text style={[styles.tableCell, styles.colQty]}>{qty}</Text>
                                    <Text style={[styles.tableCell, styles.colUnit]}>{formatCurrency(item.unit_price || 0)}</Text>
                                    <Text style={[styles.tableCellBold, styles.colTotal]}>{formatCurrency(itemTotal)}</Text>
                                </View>
                            )
                        })}
                    </>
                )}

                {/* ── Totals ── */}
                {billableItems.length > 0 && (
                    <View style={styles.totalsContainer} wrap={false}>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Subtotal</Text>
                            <Text style={styles.totalsValue}>{formatCurrency(subtotal)}</Text>
                        </View>
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Tax (13% HST)</Text>
                            <Text style={styles.totalsValue}>{formatCurrency(tax)}</Text>
                        </View>
                        <View style={styles.totalDivider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                        </View>
                    </View>
                )}

                {/* ── Technician Notes ── */}
                {workOrder.notes && (
                    <View style={styles.notesBox} wrap={false}>
                        <Text style={styles.sectionTitle}>Technician Notes</Text>
                        <Text style={styles.notesText}>{workOrder.notes}</Text>
                    </View>
                )}

                {/* ── Page Footer ── */}
                <View style={styles.pageFooter} fixed>
                    <Text style={styles.footerText}>{shop.shop_name} — {documentLabel} #{workOrder.work_order_number}</Text>
                    <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
                </View>
            </Page>
        </Document>
    )
}
