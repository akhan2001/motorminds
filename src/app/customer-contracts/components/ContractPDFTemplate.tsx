import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 11,
        padding: 40,
        lineHeight: 1.5,
    },
    header: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
        textDecoration: 'underline',
    },
    shopInfo: {
        textAlign: 'center',
        fontSize: 9,
        color: 'grey',
        marginBottom: 25,
    },
    paragraph: {
        textAlign: 'justify',
        marginBottom: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    bold: {
        fontWeight: 'bold',
    },
    horizontalRule: {
        borderBottomColor: '#c0c0c0',
        borderBottomWidth: 1,
        marginVertical: 10,
    },
    signatureContainer: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBlock: {
        width: '45%',
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        height: 20,
        marginBottom: 5,
    },
    signatureLabel: {
        fontSize: 9,
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        padding: 10,
        border: '1px solid #c0c0c0',
        borderRadius: 5,
    },
    infoBlock: {
        width: '48%',
    },
    infoTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        textDecoration: 'underline',
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
    
    const contractParagraphs = contract?.content?.split('\\n').filter((p: string) => p.trim() !== '') || [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>{contract?.title || 'Service Contract'}</Text>
                {shop && (
                    <Text style={styles.shopInfo}>
                        {shop.shop_name} | {shop.shop_address} | {shop.shop_phone} | {shop.shop_email}
                    </Text>
                )}

                <View style={styles.infoSection}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoTitle}>Customer Information</Text>
                        <Text>{contract?.customer?.customer_name || 'N/A'}</Text>
                        <Text>{contract?.customer?.customer_email || ''}</Text>
                        <Text>{contract?.customer?.customer_phone || ''}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoTitle}>Vehicle Information</Text>
                        {contract?.vehicle ? (
                            <>
                                <Text>{`${contract.vehicle.year} ${contract.vehicle.make} ${contract.vehicle.model}`}</Text>
                                <Text>VIN: {contract.vehicle.vin || 'N/A'}</Text>
                            </>
                        ) : (
                            <Text>N/A</Text>
                        )}
                    </View>
                </View>

                <Text style={{ marginBottom: 15 }}>
                    This service contract is made on {creationDate} between {shop?.shop_name || 'the shop'} and {contract?.customer?.customer_name || 'the customer'}. Both parties agree to the terms and conditions outlined below.
                </Text>

                {contractParagraphs.map((paragraph: string, index: number) => {
                    if (paragraph.trim() === '---') {
                        return <View key={index} style={styles.horizontalRule} />;
                    }
                    return (
                        <Text key={index} style={styles.paragraph}>
                            {renderTextWithBold(paragraph)}
                        </Text>
                    );
                })}
            </Page>
        </Document>
    );
}; 