interface InvoiceEmailProps {
    invoice: {
        invoice_number: string
        display_id?: string
        client_name: string
        amount: number
        issue_date: string
        due_date?: string
        notes?: string
        customer_notes?: string
        source?: string
        labour_total_price?: number
        parts_total_price?: number
        vehicle_information?: {
            year?: string
            make?: string
            model?: string
        }
    }
    shop: {
        shop_name: string
        shop_address?: string
        shop_email?: string
        shop_phone?: string
    }
    invoiceUrl: string
}

export function generateInvoiceEmailHTML({ invoice, shop, invoiceUrl }: InvoiceEmailProps): string {
    const formatCurrency = (amount: number | null | undefined): string => {
        if (amount === null || amount === undefined) return '$0.00'
        return `$${Number(amount).toFixed(2)}`
    }

    const isCustomerGenerated = invoice.source === 'customer_generated'
    const actualAmount = invoice.amount || 0
    const vehicleInfo = invoice.vehicle_information ? 
        `${invoice.vehicle_information.year || ''} ${invoice.vehicle_information.make || ''} ${invoice.vehicle_information.model || ''}`.trim() : 
        'Vehicle information not available'

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice Ready - ${shop.shop_name}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f8f9fa;
                }
                
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .email-card {
                    background-color: white;
                    padding: 40px 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .header h1 {
                    color: #b22222;
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                
                .header p {
                    color: #666;
                    font-size: 16px;
                }
                
                .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                    color: #333;
                }
                
                .intro {
                    font-size: 16px;
                    margin-bottom: 25px;
                    color: #555;
                }
                
                .customer-notes {
                    background-color: #e3f2fd;
                    border: 1px solid #bbdefb;
                    border-left: 4px solid #1976d2;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 25px 0;
                }
                
                .customer-notes h4 {
                    color: #1976d2;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                
                .customer-notes p {
                    color: #424242;
                    font-style: italic;
                    margin: 0;
                }
                
                .invoice-details {
                    background-color: #f8f9fa;
                    padding: 25px;
                    border-radius: 8px;
                    margin: 25px 0;
                }
                
                .invoice-details h3 {
                    color: #333;
                    margin-bottom: 20px;
                    font-size: 20px;
                }
                
                .details-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .details-table td {
                    padding: 12px 0;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .details-table td:first-child {
                    color: #666;
                    width: 30%;
                }
                
                .details-table td:last-child {
                    color: #333;
                    font-weight: 500;
                }
                
                .total-row td {
                    border-top: 2px solid #b22222;
                    border-bottom: none;
                    font-weight: 600;
                    font-size: 18px;
                    padding-top: 15px;
                }
                
                .total-row td:last-child {
                    color: #b22222;
                }
                
                .service-breakdown {
                    background-color: #fff8e1;
                    border: 1px solid #ffcc02;
                    border-left: 4px solid #ff9800;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 25px 0;
                }
                
                .service-breakdown h4 {
                    color: #e65100;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                
                .service-breakdown p {
                    color: #bf360c;
                    margin: 8px 0;
                }
                
                .service-notes {
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-left: 4px solid #6c757d;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 25px 0;
                }
                
                .service-notes h4 {
                    color: #495057;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                
                .service-notes p {
                    color: #6c757d;
                    margin: 0;
                }
                
                .cta-button {
                    text-align: center;
                    margin: 35px 0;
                }
                
                .cta-button a {
                    display: inline-block;
                    background-color: #b22222;
                    color: white;
                    padding: 15px 35px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: background-color 0.3s;
                }
                
                .cta-button a:hover {
                    background-color: #8b1a1a;
                }
                
                .shop-info {
                    border-top: 2px solid #e9ecef;
                    padding-top: 25px;
                    margin-top: 35px;
                }
                
                .shop-info h4 {
                    color: #333;
                    margin-bottom: 15px;
                    font-size: 18px;
                }
                
                .shop-info p {
                    color: #666;
                    margin: 8px 0;
                }
                
                .shop-info .shop-name {
                    color: #b22222;
                    font-weight: 600;
                    font-size: 16px;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 35px;
                    padding-top: 25px;
                    border-top: 1px solid #e9ecef;
                }
                
                .footer p {
                    color: #999;
                    font-size: 14px;
                }
                
                @media (max-width: 600px) {
                    .container {
                        padding: 10px;
                    }
                    
                    .email-card {
                        padding: 25px 20px;
                    }
                    
                    .header h1 {
                        font-size: 24px;
                    }
                    
                    .details-table td {
                        padding: 8px 0;
                        font-size: 14px;
                    }
                    
                    .details-table td:first-child {
                        width: 40%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-card">
                    <div class="header">
                        <h1>${shop.shop_name}</h1>
                        <p>Invoice Ready for Review</p>
                    </div>
                    
                    <p class="greeting">Hello ${invoice.client_name},</p>
                    
                    <p class="intro">Your service work has been completed and your invoice is ready for review.</p>
                    
                    ${isCustomerGenerated && invoice.customer_notes ? `
                        <div class="customer-notes">
                            <h4>Your Original Request:</h4>
                            <p>"${invoice.customer_notes}"</p>
                        </div>
                    ` : ''}
                    
                    <div class="invoice-details">
                        <h3>Invoice Details</h3>
                        <table class="details-table">
                            <tr>
                                <td>Invoice #:</td>
                                <td>${invoice.display_id || invoice.invoice_number}</td>
                            </tr>
                            <tr>
                                <td>Vehicle:</td>
                                <td>${vehicleInfo}</td>
                            </tr>
                            <tr>
                                <td>Service Date:</td>
                                <td>${formatDate(invoice.issue_date)}</td>
                            </tr>
                            ${invoice.due_date ? `
                                <tr>
                                    <td>Due Date:</td>
                                    <td>${formatDate(invoice.due_date)}</td>
                                </tr>
                            ` : ''}
                            <tr class="total-row">
                                <td>Total Amount:</td>
                                <td>${formatCurrency(actualAmount)}</td>
                            </tr>
                        </table>
                    </div>
                    
                    ${invoice.labour_total_price || invoice.parts_total_price ? `
                        <div class="service-breakdown">
                            <h4>Service Breakdown:</h4>
                            ${invoice.labour_total_price ? `<p>Labor: ${formatCurrency(invoice.labour_total_price)}</p>` : ''}
                            ${invoice.parts_total_price ? `<p>Parts: ${formatCurrency(invoice.parts_total_price)}</p>` : ''}
                        </div>
                    ` : ''}
                    
                    ${invoice.notes ? `
                        <div class="service-notes">
                            <h4>Service Notes:</h4>
                            <p>${invoice.notes}</p>
                        </div>
                    ` : ''}
                    
                    <div class="cta-button">
                        <a href="${invoiceUrl}">View Full Invoice</a>
                    </div>
                    
                    <div class="shop-info">
                        <h4>Payment & Contact Information:</h4>
                        <p>Please visit us at:</p>
                        <p class="shop-name">${shop.shop_name}</p>
                        ${shop.shop_address ? `<p>${shop.shop_address}</p>` : ''}
                        ${shop.shop_phone ? `<p>Phone: ${shop.shop_phone}</p>` : ''}
                        ${shop.shop_email ? `<p>Email: ${shop.shop_email}</p>` : ''}
                    </div>
                    
                    <div class="footer">
                        <p>Thank you for choosing ${shop.shop_name}. We appreciate your business!</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `
}

export function generateInvoiceEmailSubject(shopName: string, invoiceId?: string): string {
    const invoiceRef = invoiceId ? ` - ${invoiceId}` : ''
    return `Invoice Ready${invoiceRef} - ${shopName}`
}
