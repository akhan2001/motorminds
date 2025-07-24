# DocuSeal Integration Guide

## Overview

MotorMinds uses DocuSeal's HTML-based submission system for digital contract signing. This approach eliminates the need for pre-created templates and provides better control over document layout.

## How It Works

### 1. HTML Generation
- Contracts are dynamically generated as HTML using `generateContractHTML()`
- HTML includes DocuSeal field tags: `<signature-field>`, `<date-field>`, `<text-field>`
- Responsive design with CSS styling for professional appearance

### 2. Direct Submission Creation
- Uses DocuSeal's `/submissions/html` API endpoint
- Creates fillable PDF directly from HTML content
- No need for pre-created templates

### 3. Signature Fields
- **Customer Signature**: `<signature-field name="customer_signature" role="Customer">`
- **Date Field**: `<date-field name="customer_date" role="Customer">`
- **Print Name**: `<text-field name="customer_print_name" role="Customer">`

## API Endpoints

### Send for Signature
```
POST /api/contracts/send-signing-email
Body: { contractId: string }
```

### Preview HTML Contract
```
GET /api/contracts/preview-html?contractId={id}
```

### Webhook Handler
```
POST /api/webhooks/docuseal
```

## Environment Variables

```bash
# Required
DOCUSEAL_API_KEY=your_docuseal_api_key
RESEND_API_KEY=your_resend_api_key

# Optional (defaults provided)
DOCUSEAL_API_URL=https://api.docuseal.com
NEXT_PUBLIC_DOCUSEAL_URL=https://docuseal.com
NEXT_PUBLIC_APP_URL=https://app.motorminds.ca
```

## Webhook Configuration

**DocuSeal Webhook URL**: `https://app.motorminds.ca/api/webhooks/docuseal`

**Enabled Events**:
- `submission.viewed` → Updates status to "viewed"
- `submission.completed` → Updates status to "completed"
- `submission.declined` → Updates status to "declined"

## Contract Workflow

1. **Create Contract** → Generate content using AI
2. **Send for Signature** → Create HTML submission via DocuSeal API
3. **Send Email** → Customer receives signing link
4. **Customer Signs** → DocuSeal webhook updates status
5. **Download Signed PDF** → Available after completion

## HTML Template Features

### Customer Information
- Pre-filled customer name, email, phone
- Vehicle details (year, make, model, VIN)
- Shop information and branding

### Signature Section
- Centered customer signature field
- Date picker with MM/DD/YYYY format
- Print name field (pre-filled with customer name)

### Responsive Design
- Professional layout with CSS Grid
- Print-friendly styling
- Consistent with MotorMinds branding

## Benefits Over Template Approach

1. **Dynamic Content** - Each contract can have unique content
2. **Better Maintenance** - HTML/CSS easier to modify than coordinates
3. **No Template Management** - Direct submission creation
4. **Responsive Layout** - Works on all devices
5. **Rich Formatting** - Support for complex layouts and styling

## Testing

### Preview Contract HTML
Use the "Preview Signing Form" option in contract cards to see the HTML output before sending.

### Development Testing
```bash
# For local development, set environment variable:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Test webhook locally with ngrok
ngrok http 3000
# Update DocuSeal webhook URL to ngrok endpoint for local testing
```

## Migration Notes

- **Removed**: `docuseal_template_id`, `docuseal_template_url` columns
- **Kept**: `docuseal_submission_id`, `signature_status`, signature timestamps
- **Updated**: All signing flows now use HTML-based submissions

## File Structure

```
src/app/customer-contracts/utils/
├── docuseal-utils.ts          # Main DocuSeal integration
├── docuseal-html-template.ts  # HTML template generator
└── contract-utils.ts          # Status management

src/app/api/
├── contracts/send-signing-email/route.ts
├── contracts/preview-html/route.ts
└── webhooks/docuseal/route.ts
```

## Support

For DocuSeal-specific issues:
- [DocuSeal Documentation](https://docs.docuseal.com)
- [HTML Field Tags Reference](https://docs.docuseal.com/html-field-tags)
- [API Reference](https://docs.docuseal.com/api) 