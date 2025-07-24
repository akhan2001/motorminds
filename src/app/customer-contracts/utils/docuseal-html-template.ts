// HTML template generator for DocuSeal contracts
export function generateContractHTML(contract: any, shop: any): string {
    const contractParagraphs = contract?.content?.split('\n').filter((p: string) => p.trim() !== '') || [];
    const limitedParagraphs = contractParagraphs.slice(0, 8); // Limit content to fit one page

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${contract.title || 'Service Contract'}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px;
            font-size: 11pt;
            line-height: 1.4;
            color: #333;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 24pt;
            margin: 0 0 10px 0;
            text-decoration: underline;
            font-weight: bold;
        }
        .shop-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .shop-info h3 {
            margin: 0 0 10px 0;
            color: #2563eb;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-section {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
        }
        .info-section h4 {
            margin: 0 0 8px 0;
            color: #1e40af;
            font-size: 12pt;
        }
        .info-row {
            margin: 5px 0;
            font-size: 10pt;
        }
        .content {
            margin: 20px 0;
        }
        .content p {
            margin: 0 0 12px 0;
            text-align: justify;
            font-size: 10pt;
            line-height: 1.3;
        }
        .signature-section {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
        }
        .signature-container {
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        .signature-block {
            text-align: center;
            width: 300px;
        }
        .signature-label {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 12pt;
        }
        .signature-field {
            margin: 15px 0;
        }
        .date-field {
            margin: 10px 0;
        }
        .print-name {
            margin-top: 10px;
            font-size: 9pt;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>${contract.title || 'Service Contract'}</h1>
        </div>

        <!-- Shop Information -->
        <div class="shop-info">
            <h3>${shop.shop_name || 'Auto Service Shop'}</h3>
            ${shop.shop_address ? `<p><strong>Address:</strong> ${shop.shop_address}</p>` : ''}
            ${shop.shop_phone ? `<p><strong>Phone:</strong> ${shop.shop_phone}</p>` : ''}
            ${shop.shop_email ? `<p><strong>Email:</strong> ${shop.shop_email}</p>` : ''}
        </div>

        <!-- Customer and Vehicle Information -->
        <div class="info-grid">
            <div class="info-section">
                <h4>Customer Information</h4>
                <div class="info-row"><strong>Name:</strong> ${contract.customer?.customer_name || 'N/A'}</div>
                <div class="info-row"><strong>Email:</strong> ${contract.customer?.customer_email || 'N/A'}</div>
                <div class="info-row"><strong>Phone:</strong> ${contract.customer?.customer_phone || 'N/A'}</div>
            </div>
            ${contract.vehicle ? `
            <div class="info-section">
                <h4>Vehicle Information</h4>
                <div class="info-row"><strong>Year:</strong> ${contract.vehicle.year || 'N/A'}</div>
                <div class="info-row"><strong>Make:</strong> ${contract.vehicle.make || 'N/A'}</div>
                <div class="info-row"><strong>Model:</strong> ${contract.vehicle.model || 'N/A'}</div>
                <div class="info-row"><strong>VIN:</strong> ${contract.vehicle.vin || 'N/A'}</div>
            </div>
            ` : ''}
        </div>

        <!-- Contract Content -->
        <div class="content">
            <p><strong>This service contract outlines the terms and conditions for automotive services provided by ${shop.shop_name} to the customer named above.</strong></p>
            
            ${limitedParagraphs.map((paragraph: string) => {
                if (paragraph.includes('**') && paragraph.includes('**')) {
                    // Handle bold text
                    const boldText = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    return `<p>${boldText}</p>`;
                }
                return `<p>${paragraph}</p>`;
            }).join('')}
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-container">
                <div class="signature-block">
                    <div class="signature-label">Customer Signature</div>
                    
                    <div class="signature-field">
                        <signature-field 
                            name="customer_signature" 
                            role="Customer" 
                            required="true"
                            style="width: 250px; height: 80px; border: 1px solid #ccc; display: block; margin: 0 auto;">
                        </signature-field>
                    </div>
                    
                    <div class="date-field">
                        <span>Date: </span>
                        <date-field 
                            name="customer_date" 
                            role="Customer" 
                            required="true"
                            format="MM/DD/YYYY"
                            style="width: 120px; height: 25px; border: 1px solid #ccc; display: inline-block;">
                        </date-field>
                    </div>
                    
                    <div class="print-name">
                        <text-field 
                            name="customer_print_name" 
                            role="Customer" 
                            default="${contract.customer?.customer_name || ''}"
                            placeholder="Print Name"
                            style="width: 200px; height: 25px; border: 1px solid #ccc; display: inline-block;">
                        </text-field>
                        <br><small>Print Name</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
} 