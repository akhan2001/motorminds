import React from 'react'
import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import type { InvoicePDFData } from '../../../types/invoice-pdf'
import { modernTemplateStyles } from './modern-template-styles'

export const ModernTemplate: React.FC<InvoicePDFData> = ({ invoice, shop }) => {
    const styles = modernTemplateStyles

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

    const formatPhoneNumber = (phone: string | null | undefined): string => {
        if (!phone) return ''
        const cleaned = phone.replace(/\D/g, '')
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
        }
        return phone
    }

    // Calculate totals - only active items
    const activeItems = invoice.invoice_items?.filter(item => (item as any).active !== false) || []

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

    // Header Component
    const InvoiceHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                {shop.logo_image_url ? (
                    <Image
                        src={shop.logo_image_url}
                        style={styles.logo}
                        cache={false}
                    />
                ) : null}
                <Text style={styles.companyName}>{shop.shop_name || 'SHOP NAME'}</Text>
                <Text style={styles.businessInfo}>{shop.shop_address || ''}</Text>
                <Text style={styles.businessInfo}>{shop.shop_city ? `${shop.shop_city}, ${shop.shop_province || ''}` : ''}</Text>
                <Text style={styles.businessInfo}>{formatPhoneNumber(shop.shop_phone) || ''}</Text>
                <Text style={styles.businessInfo}>Business #: {shop.business_number || ''}</Text>
            </View>

            <View style={styles.headerRight}>
                <View style={styles.invoiceFields}>
                    <Text style={styles.fieldLabel}>Invoice No:</Text>
                    <Text style={styles.sectionContent}>{invoice.display_id || invoice.invoice_number || ''}</Text>
                    <Text style={styles.fieldLabel}>Date:</Text>
                    <Text style={styles.sectionContent}>{formatDate(invoice.issue_date) || ''}</Text>
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
    )

    // Customer and Vehicle Info Component
    const CustomerVehicleInfo = () => (
        <View style={styles.customerVehicleRow}>
            <View style={styles.customerSection}>
                <Text style={styles.sectionTitle}>Customer Information</Text>
                {invoice.customer_type === 'walk_in' ? (
                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabelSmall}>Name:</Text>
                        <Text style={styles.sectionContent}>WALK-IN CUSTOMER</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Name:</Text>
                            <Text style={styles.sectionContent}>{invoice.customer?.customer_name || ''}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Address:</Text>
                            <Text style={styles.sectionContent}>{invoice.customer?.customer_address || ''}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Telephone:</Text>
                            <Text style={styles.sectionContent}>{formatPhoneNumber(invoice.customer?.customer_phone) || ''}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Email:</Text>
                            <Text style={styles.sectionContent}>{invoice.customer?.customer_email || ''}</Text>
                        </View>
                    </>
                )}
            </View>

            <View style={styles.vehicleSection}>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>
                {invoice.customer_type === 'walk_in' && invoice.walk_in_vehicle_info ? (
                    <>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Make:</Text>
                            <Text style={styles.sectionContent}>{invoice.walk_in_vehicle_info.make || ''}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Model:</Text>
                            <Text style={styles.sectionContent}>{invoice.walk_in_vehicle_info.model || ''}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Year:</Text>
                            <Text style={styles.sectionContent}>{invoice.walk_in_vehicle_info.year || ''}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Plate:</Text>
                            <Text style={styles.sectionContent}>{invoice.walk_in_vehicle_info.license_plate || ''}</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Make:</Text>
                            <Text style={styles.sectionContent}>{invoice.vehicle?.make || ''}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Model:</Text>
                            <Text style={styles.sectionContent}>{invoice.vehicle?.model || ''}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Year:</Text>
                            <Text style={styles.sectionContent}>{invoice.vehicle?.year || ''}</Text>
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabelSmall}>Plate:</Text>
                            <Text style={styles.sectionContent}>
                                {invoice.vehicle?.license_plate === null || invoice.vehicle?.license_plate === "NULL"
                                    ? ''
                                    : invoice.vehicle?.license_plate || ''}
                            </Text>
                        </View>
                    </>
                )}
            </View>
        </View>
    )

    // Service Items Table Component
    const ServiceItemsTable = () => {
        // Use invoice_items from the invoice
        const items = activeItems.map((item, index) => ({
            itemNumber: index + 1,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            amount: item.total_price,
            type: item.item_type
        }))

        // Fill remaining rows with empty lines to total 10 rows
        const emptyRows = Math.max(0, 10 - items.length)

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
                {items.map((item, index) => (
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
                    <View key={`empty-${index}`} style={(items.length + index) % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                        <Text style={styles.itemNoCol}></Text>
                        <Text style={styles.qtyCol}></Text>
                        <Text style={styles.descCol}></Text>
                        <Text style={styles.unitPriceCol}></Text>
                        <Text style={styles.amountCol}></Text>
                    </View>
                ))}
            </View>
        )
    }

    // Summary Component - using calculated values from parent
    const PaymentSummary = () => {
        const taxLabel = taxRate > 0 ? `HST (${(taxRate * 100).toFixed(0)}%)` : 'HST'

        return (
            <View style={styles.summarySection}>
                <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal:</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                    </View>
                    {taxAmount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{taxLabel}:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
                        </View>
                    )}
                    {discountAmount > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Discount:</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(-discountAmount)}</Text>
                        </View>
                    )}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                    </View>
                </View>
            </View>
        )
    }

    // Notes Component
    const NotesSection = () => {
        if (!invoice.notes) return null

        return (
            <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Notes</Text>
                <Text style={styles.notesContent}>
                    {invoice.notes}
                </Text>
            </View>
        )
    }

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
    )

    // Main Template Component
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <InvoiceHeader />

                <CustomerVehicleInfo />

                <ServiceItemsTable />

                <NotesSection />

                <PaymentSummary />

                <SignatureSection />
            </Page>
        </Document>
    )
}
