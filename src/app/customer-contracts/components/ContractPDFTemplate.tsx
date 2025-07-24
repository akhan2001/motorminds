import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 11,
        padding: 40,
        lineHeight: 1.4,
        position: 'relative',
        height: '100%',
    },
    header: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 15,
        fontWeight: 'bold',
        textDecoration: 'underline',
    },
    shopInfo: {
        textAlign: 'center',
        fontSize: 9,
        color: 'grey',
        marginBottom: 20,
    },
    contentContainer: {
        // Reserve space for signature section at bottom (120px)
        maxHeight: 640, // Total page height ~750px - 40px padding top/bottom - 120px signature = 550px available
        overflow: 'hidden',
    },
    paragraph: {
        textAlign: 'justify',
        marginBottom: 8,
        fontSize: 10,
        lineHeight: 1.3,
    },
    bold: {
        fontWeight: 'bold',
    },
    horizontalRule: {
        borderBottomColor: '#c0c0c0',
        borderBottomWidth: 1,
        marginVertical: 8,
    },
    signatureContainer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        justifyContent: 'center', // Center the single signature block
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    signatureBlock: {
        width: '50%', // Take half the width, centered
        alignItems: 'center',
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        height: 20,
        marginBottom: 5,
        marginTop: 10,
    },
    signatureLabel: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        padding: 8,
        border: '1px solid #c0c0c0',
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
    },
    infoBlock: {
        width: '48%',
    },
    infoTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 3,
        textDecoration: 'underline',
    },
    introText: {
        marginBottom: 12,
        fontSize: 10,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 3,
    }
});

const renderTextWithBold = (text: string) => {
    if (!text) return <Text></Text>;
    
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <Text key={index} style={styles.bold}>{part.slice(2, -2)}</Text>;
                }
                return <Text key={index}>{part}</Text>;
            })}
        </>
    );
};

export const ContractPDFTemplate = ({ contract, shop }: { contract: any, shop: any }) => {
    const creationDate = contract?.created_at ? format(new Date(contract.created_at), 'MMMM d, yyyy') : '________________';
    
    // Limit content to prevent overflow
    const contractParagraphs = contract?.content?.split('\\n').filter((p: string) => p.trim() !== '') || [];
    const limitedParagraphs = contractParagraphs.slice(0, 8); // Limit to 8 paragraphs max

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.contentContainer}>
                    <Text style={styles.header}>{contract?.title || 'Service Contract'}</Text>
                    
                    {shop && (
                        <Text style={styles.shopInfo}>
                            {shop.shop_name} | {shop.shop_address} | {shop.shop_phone} | {shop.shop_email}
                        </Text>
                    )}

                    <View style={styles.infoSection}>
                        <View style={styles.infoBlock}>
                            <Text style={styles.infoTitle}>Customer Information</Text>
                            <Text style={{ fontSize: 9 }}>{contract?.customer?.customer_name || 'N/A'}</Text>
                            <Text style={{ fontSize: 9 }}>{contract?.customer?.customer_email || ''}</Text>
                            <Text style={{ fontSize: 9 }}>{contract?.customer?.customer_phone || ''}</Text>
                        </View>
                        <View style={styles.infoBlock}>
                            <Text style={styles.infoTitle}>Vehicle Information</Text>
                            {contract?.vehicle ? (
                                <>
                                    <Text style={{ fontSize: 9 }}>{`${contract.vehicle.year} ${contract.vehicle.make} ${contract.vehicle.model}`}</Text>
                                    <Text style={{ fontSize: 9 }}>VIN: {contract.vehicle.vin || 'N/A'}</Text>
                                </>
                            ) : (
                                <Text style={{ fontSize: 9 }}>N/A</Text>
                            )}
                        </View>
                    </View>

                    <Text style={styles.introText}>
                        This service contract is made on {creationDate} between {shop?.shop_name || 'the shop'} and {contract?.customer?.customer_name || 'the customer'}. Both parties agree to the terms and conditions outlined below.
                    </Text>

                    {limitedParagraphs.map((paragraph: string, index: number) => {
                        if (paragraph.trim() === '---') {
                            return <View key={index} style={styles.horizontalRule} />;
                        }
                        return (
                            <Text key={index} style={styles.paragraph}>
                                {renderTextWithBold(paragraph)}
                            </Text>
                        );
                    })}
                </View>

                {/* Fixed signature section at bottom */}
                <View style={styles.signatureContainer}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Customer Signature</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Date: ________________</Text>
                        <Text style={{ fontSize: 8, marginTop: 5 }}>
                            Print Name: ________________________________
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}; 