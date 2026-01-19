/**
 * Invoice Email HTML Template Generator
 * Generates beautiful, responsive HTML emails for invoices
 */

export interface InvoiceEmailTemplateData {
    shopName: string
    shopEmail?: string
    customerName: string
    invoiceNumber: string
    totalAmount: number
    vehicleInfo?: string
    messageBody: string
    hasPdfAttachment?: boolean
}

/**
 * Generate HTML email template for invoice
 */
export function generateInvoiceEmailHTML(data: InvoiceEmailTemplateData): string {
    const {
        shopName,
        shopEmail,
        customerName,
        invoiceNumber,
        totalAmount,
        vehicleInfo,
        messageBody,
        hasPdfAttachment = false
    } = data

    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'CAD'
    }).format(totalAmount)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Invoice #${invoiceNumber} from ${shopName}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f4f4f5;
            padding: 40px 0;
        }
        .main {
            background-color: #ffffff;
            margin: 0 auto;
            width: 100%;
            max-width: 600px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .invoice-badge {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 24px;
        }
        .amount-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }
        .amount-label {
            color: #64748b;
            font-size: 14px;
            margin: 0 0 8px 0;
        }
        .amount-value {
            color: #0f172a;
            font-size: 32px;
            font-weight: 700;
            margin: 0;
        }
        .message {
            color: #374151;
            font-size: 16px;
            line-height: 1.6;
            white-space: pre-wrap;
            margin: 24px 0;
        }
        .vehicle-info {
            background-color: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 12px 16px;
            margin: 16px 0;
            border-radius: 0 8px 8px 0;
        }
        .vehicle-label {
            color: #166534;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin: 0 0 4px 0;
        }
        .vehicle-value {
            color: #15803d;
            font-size: 14px;
            margin: 0;
        }
        .pdf-notice {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
        }
        .pdf-notice p {
            color: #1e40af;
            font-size: 14px;
            margin: 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            color: #64748b;
            font-size: 12px;
            margin: 4px 0;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .content, .header, .footer {
                padding: 24px !important;
            }
            .amount-value {
                font-size: 28px !important;
            }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <table class="main" cellpadding="0" cellspacing="0" role="presentation">
            <!-- Header -->
            <tr>
                <td class="header">
                    <h1>${shopName}</h1>
                </td>
            </tr>
            
            <!-- Content -->
            <tr>
                <td class="content">
                    <span class="invoice-badge">Invoice #${invoiceNumber}</span>
                    
                    <p style="color: #374151; font-size: 18px; margin: 0 0 8px 0;">
                        Hello ${customerName},
                    </p>
                    
                    <!-- Amount Box -->
                    <div class="amount-box">
                        <p class="amount-label">Total Amount</p>
                        <p class="amount-value">${formattedAmount}</p>
                    </div>
                    
                    ${vehicleInfo ? `
                    <!-- Vehicle Info -->
                    <div class="vehicle-info">
                        <p class="vehicle-label">Vehicle</p>
                        <p class="vehicle-value">${vehicleInfo}</p>
                    </div>
                    ` : ''}
                    
                    <!-- Message -->
                    <div class="message">${messageBody}</div>
                    
                    ${hasPdfAttachment ? `
                    <!-- PDF Attachment Notice -->
                    <div class="pdf-notice">
                        <p>📎 Your detailed invoice is attached as a PDF document.</p>
                    </div>
                    ` : ''}
                </td>
            </tr>
            
            <!-- Footer -->
            <tr>
                <td class="footer">
                    <p>This email was sent from <strong>${shopName}</strong></p>
                    <p style="margin-top: 16px; color: #94a3b8;">
                        Powered by MotorMinds
                    </p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
    `.trim()
}

/**
 * Generate plain text version of the email
 */
export function generateInvoiceEmailText(data: InvoiceEmailTemplateData): string {
    const {
        shopName,
        customerName,
        invoiceNumber,
        totalAmount,
        vehicleInfo,
        messageBody,
        hasPdfAttachment = false
    } = data

    const formattedAmount = new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD'
    }).format(totalAmount)

    let text = `
${shopName}
${'='.repeat(shopName.length)}

Invoice #${invoiceNumber}

Hello ${customerName},

Total Amount: ${formattedAmount}
${vehicleInfo ? `Vehicle: ${vehicleInfo}` : ''}

${messageBody}
${hasPdfAttachment ? '\n📎 Your detailed invoice is attached as a PDF document.\n' : ''}
---
This email was sent from ${shopName}
    `.trim()

    return text
}
