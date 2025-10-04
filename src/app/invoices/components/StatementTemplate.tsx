import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { StatementData } from "../types/statement";
import { formatStatementDate, formatStatementCurrency } from "../utils/statement-utils";

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        backgroundColor: "#FFFFFF"
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: "#1e3a8a",
        paddingBottom: 10
    },
    headerLeft: {
        width: "50%"
    },
    headerRight: {
        width: "50%",
        alignItems: "flex-end"
    },
    logo: {
        width: 120,
        height: 50,
        objectFit: 'contain',
        marginBottom: 10
    },
    statementTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 5
    },
    statementNumber: {
        fontSize: 10,
        color: "#374151",
        marginBottom: 2
    },
    companyName: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 3
    },
    companyDetails: {
        fontSize: 9,
        color: "#374151",
        marginBottom: 1
    },
    infoSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20
    },
    infoBox: {
        width: "48%",
        padding: 12,
        backgroundColor: "#f8fafc",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#e5e7eb"
    },
    infoTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 6,
        textTransform: "uppercase"
    },
    infoText: {
        fontSize: 9,
        color: "#374151",
        marginBottom: 2
    },
    infoTextBold: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 3
    },
    summaryBox: {
        backgroundColor: "#eff6ff",
        padding: 15,
        borderRadius: 4,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: "#1e3a8a"
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 8,
        textTransform: "uppercase"
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5
    },
    summaryLabel: {
        fontSize: 10,
        color: "#374151"
    },
    summaryValue: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#374151"
    },
    summaryTotal: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 2,
        borderTopColor: "#1e3a8a",
        paddingTop: 8,
        marginTop: 5
    },
    summaryTotalLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e3a8a"
    },
    summaryTotalValue: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e3a8a"
    },
    table: {
        marginBottom: 20
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1e3a8a",
        paddingVertical: 8,
        paddingHorizontal: 4
    },
    tableHeaderText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "bold",
        textAlign: "center"
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        minHeight: 35
    },
    tableRowAlt: {
        flexDirection: "row",
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        backgroundColor: "#f9fafb",
        minHeight: 35
    },
    tableRowPrevBalance: {
        flexDirection: "row",
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#1e3a8a",
        backgroundColor: "#dbeafe",
        fontWeight: "bold",
        minHeight: 25
    },
    dateCol: { width: "12%", fontSize: 9 },
    refCol: { width: "10%", fontSize: 9, flexDirection: "column" },
    descCol: { width: "40%", fontSize: 8, flexDirection: "column" },
    statusCol: { width: "10%", fontSize: 8, textAlign: "center" },
    chargesCol: { width: "14%", fontSize: 9, textAlign: "right" },
    balanceCol: { width: "14%", fontSize: 9, textAlign: "right", fontWeight: "bold" },
    footer: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb"
    },
    footerText: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 3,
        textAlign: "center"
    },
    footerBold: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#374151",
        marginBottom: 3,
        textAlign: "center"
    }
});

// Header Component
const StatementHeader = ({ statement }: { statement: StatementData }) => (
    <View style={styles.header}>
        <View style={styles.headerLeft}>
            {statement.shop.shop_logo ? (
                <Image 
                    src={statement.shop.shop_logo}
                    style={styles.logo}
                    cache={false}
                />
            ) : (
                <Text style={styles.companyName}>{statement.shop.shop_name}</Text>
            )}
            <Text style={styles.companyDetails}>{statement.shop.shop_address}</Text>
            <Text style={styles.companyDetails}>{statement.shop.shop_phone}</Text>
            <Text style={styles.companyDetails}>{statement.shop.shop_email}</Text>
            {statement.shop.business_number && (
                <Text style={styles.companyDetails}>Business #: {statement.shop.business_number}</Text>
            )}
            {statement.shop.hst_number && (
                <Text style={styles.companyDetails}>HST #: {statement.shop.hst_number}</Text>
            )}
        </View>
        
        <View style={styles.headerRight}>
            <Text style={styles.statementTitle}>STATEMENT</Text>
            <Text style={styles.statementNumber}>Statement #: {statement.statementNumber}</Text>
            <Text style={styles.statementNumber}>Generated: {statement.generatedDate}</Text>
            <Text style={styles.statementNumber}>
                Period: {formatStatementDate(statement.dateRange.start)} to {formatStatementDate(statement.dateRange.end)}
            </Text>
        </View>
    </View>
);

// Info Section (Shop & Customer)
const InfoSection = ({ statement }: { statement: StatementData }) => (
    <View style={styles.infoSection}>
        <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Account Statement For:</Text>
            <Text style={styles.infoTextBold}>{statement.customer.customer_name}</Text>
            <Text style={styles.infoText}>{statement.customer.customer_address || ''}</Text>
            <Text style={styles.infoText}>{statement.customer.customer_phone || ''}</Text>
            <Text style={styles.infoText}>{statement.customer.customer_email || ''}</Text>
            {/* <Text style={styles.infoText}>Account #: {statement.customer.id.substring(0, 8)}</Text> */}
        </View>
    </View>
);

// Account Summary Box
const AccountSummary = ({ totals }: { totals: any }) => (
    <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Account Summary</Text>
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Previous Balance:</Text>
            <Text style={styles.summaryValue}>{formatStatementCurrency(totals.previousBalance)}</Text>
        </View>
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>New Charges:</Text>
            <Text style={styles.summaryValue}>{formatStatementCurrency(totals.newCharges)}</Text>
        </View>
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payments/Credits:</Text>
            <Text style={styles.summaryValue}>-{formatStatementCurrency(totals.paymentsCredits)}</Text>
        </View>
        <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>CURRENT BALANCE DUE:</Text>
            <Text style={styles.summaryTotalValue}>{formatStatementCurrency(totals.currentBalance)}</Text>
        </View>
    </View>
);

// Transaction Table
const TransactionTable = ({ statement }: { statement: StatementData }) => (
    <View style={styles.table}>
        <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.dateCol]}>Date</Text>
            <Text style={[styles.tableHeaderText, styles.refCol]}>Invoice #</Text>
            <Text style={[styles.tableHeaderText, styles.descCol]}>Description / Vehicle / Notes</Text>
            <Text style={[styles.tableHeaderText, styles.statusCol]}>Status</Text>
            <Text style={[styles.tableHeaderText, styles.chargesCol]}>Amount</Text>
            <Text style={[styles.tableHeaderText, styles.balanceCol]}>Balance</Text>
        </View>
        
        {/* Previous Balance Row */}
        <View style={styles.tableRowPrevBalance}>
            <Text style={styles.dateCol}></Text>
            <Text style={styles.refCol}></Text>
            <Text style={styles.descCol}>Previous Balance</Text>
            <Text style={styles.statusCol}></Text>
            <Text style={styles.chargesCol}></Text>
            <Text style={styles.balanceCol}>{formatStatementCurrency(statement.totals.previousBalance)}</Text>
        </View>
        
        {/* Transaction Rows */}
        {statement.transactions.map((transaction, index) => (
            <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.dateCol}>{formatStatementDate(transaction.date)}</Text>
                <View style={styles.refCol}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 1 }}>
                        {transaction.reference}
                    </Text>
                    {transaction.invoiceId && (
                        <Text style={{ 
                            fontSize: 4.5, 
                            color: '#9ca3af',
                            lineHeight: 1.2
                        }}>
                            {transaction.invoiceId.substring(0, 13)}{'\n'}
                            {transaction.invoiceId.substring(13, 26)}{'\n'}
                            {transaction.invoiceId.substring(26)}
                        </Text>
                    )}
                </View>
                <View style={styles.descCol}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 2 }}>
                        {transaction.description || 'Service Invoice'}
                    </Text>
                    {transaction.vehicle && (
                        <Text style={{ fontSize: 7, color: '#6b7280', marginBottom: 1 }}>
                            Vehicle: {transaction.vehicle}
                        </Text>
                    )}
                    {transaction.notes && (
                        <Text style={{ fontSize: 7, color: '#374151' }}>
                            Notes: {transaction.notes}
                        </Text>
                    )}
                </View>
                <Text style={[styles.statusCol, { 
                    color: transaction.status === 'PAID' ? '#16a34a' : '#dc2626',
                    fontWeight: 'bold'
                }]}>
                    {transaction.status}
                </Text>
                <Text style={styles.chargesCol}>
                    {formatStatementCurrency(transaction.charges)}
                </Text>
                <Text style={styles.balanceCol}>{formatStatementCurrency(transaction.balance)}</Text>
            </View>
        ))}
    </View>
);

// Footer Component
const StatementFooter = ({ statement }: { statement: StatementData }) => (
    <View style={styles.footer}>
        <Text style={styles.footerBold}>
            This statement reflects all transactions from {formatStatementDate(statement.dateRange.start)} to {formatStatementDate(statement.dateRange.end)}
        </Text>
        {/* <Text style={styles.footerText}>
            Please remit payment to the address above
        </Text> */}
        {/* <Text style={styles.footerText}>
            For questions, contact: {statement.shop.shop_phone} or {statement.shop.shop_email}
        </Text> */}
        <Text style={styles.footerText}>
            Thank you for your business!
        </Text>
    </View>
);

// Main Template Component
export const StatementTemplate = ({ statement }: { statement: StatementData }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <StatementHeader statement={statement} />
                
                <InfoSection statement={statement} />
                
                <AccountSummary totals={statement.totals} />
                
                <TransactionTable statement={statement} />
                
                <StatementFooter statement={statement} />
            </Page>
        </Document>
    );
};

