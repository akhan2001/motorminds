/**
 * CSV Processing Utilities
 * Handles CSV file parsing, validation, and data transformation
 */

export interface CSVRow {
    [key: string]: string
}

export interface CSVParseResult {
    headers: string[]
    rows: CSVRow[]
    totalRows: number
    errors: string[]
}

export interface ColumnMapping {
    staging_field: string
    csv_column: string
    confidence?: number
    suggested?: boolean
    required?: boolean
}

/**
 * Parse CSV file content into structured data
 */
export function parseCSVFile(content: string): CSVParseResult {
    const lines = content.split('\n').filter(line => line.trim())
    const errors: string[] = []
    
    if (lines.length === 0) {
        errors.push('CSV file is empty')
        return { headers: [], rows: [], totalRows: 0, errors }
    }

    // Parse headers
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''))
    
    // Validate headers
    if (headers.some(header => !header)) {
        errors.push('Some column headers are empty')
    }

    // Parse data rows
    const rows: CSVRow[] = []
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''))
        
        if (values.length !== headers.length) {
            errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`)
            continue
        }

        const row: CSVRow = {}
        headers.forEach((header, index) => {
            row[header] = values[index] || ''
        })
        rows.push(row)
    }

    return {
        headers,
        rows,
        totalRows: rows.length,
        errors
    }
}

/**
 * Analyze CSV headers and suggest mappings to staging fields
 */
export function analyzeCSVHeaders(headers: string[]): ColumnMapping[] {
    const stagingFields = [
        { field: 'invoice_number', required: true, keywords: ['invoice', 'number', 'id', 'ref'] },
        { field: 'invoice_date', required: true, keywords: ['date', 'invoice_date', 'created'] },
        { field: 'due_date', required: false, keywords: ['due', 'due_date', 'payment_due'] },
        { field: 'paid_date', required: false, keywords: ['paid', 'payment_date', 'completed'] },
        { field: 'status', required: false, keywords: ['status', 'state', 'condition'] },
        { field: 'payment_method', required: false, keywords: ['payment', 'method', 'type'] },
        { field: 'total_amount', required: true, keywords: ['total', 'amount', 'sum', 'cost'] },
        { field: 'subtotal', required: false, keywords: ['subtotal', 'sub_total', 'before_tax'] },
        { field: 'tax_rate', required: false, keywords: ['tax_rate', 'tax%', 'rate'] },
        { field: 'tax_amount', required: false, keywords: ['tax', 'tax_amount', 'hst', 'gst'] },
        { field: 'discount_amount', required: false, keywords: ['discount', 'discount_amount', 'savings'] },
        { field: 'labor_total', required: false, keywords: ['labor', 'labour', 'work', 'service'] },
        { field: 'parts_total', required: false, keywords: ['parts', 'materials', 'components'] },
        { field: 'services_total', required: false, keywords: ['services', 'service_total'] },
        { field: 'fees_total', required: false, keywords: ['fees', 'fee_total', 'charges'] },
        { field: 'notes', required: false, keywords: ['notes', 'comments', 'description', 'remarks'] }
    ]

    const mappings: ColumnMapping[] = []

    stagingFields.forEach(stagingField => {
        let bestMatch = ''
        let bestScore = 0

        headers.forEach(header => {
            const score = calculateMatchScore(header, stagingField.keywords)
            if (score > bestScore) {
                bestScore = score
                bestMatch = header
            }
        })

        mappings.push({
            staging_field: stagingField.field,
            csv_column: bestMatch,
            confidence: bestScore,
            suggested: bestScore > 0.3,
            required: stagingField.required
        })
    })

    return mappings
}

/**
 * Calculate similarity score between header and keywords
 */
function calculateMatchScore(header: string, keywords: string[]): number {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    let maxScore = 0
    keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase().replace(/[^a-z0-9]/g, '')
        
        // Exact match
        if (normalizedHeader === normalizedKeyword) {
            maxScore = Math.max(maxScore, 1.0)
        }
        // Contains match
        else if (normalizedHeader.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedHeader)) {
            maxScore = Math.max(maxScore, 0.8)
        }
        // Partial match
        else if (normalizedHeader.includes(normalizedKeyword.substring(0, 4))) {
            maxScore = Math.max(maxScore, 0.6)
        }
    })

    return maxScore
}

/**
 * Validate CSV data against staging schema
 */
export function validateCSVData(rows: CSVRow[], mappings: ColumnMapping[]): {
    validRows: CSVRow[]
    invalidRows: { row: CSVRow; errors: string[] }[]
    validationErrors: Record<number, string[]>
} {
    const validRows: CSVRow[] = []
    const invalidRows: { row: CSVRow; errors: string[] }[] = []
    const validationErrors: Record<number, string[]> = {}

    rows.forEach((row, index) => {
        const errors: string[] = []

        // Check required fields
        mappings.forEach(mapping => {
            if (mapping.required && mapping.csv_column && !row[mapping.csv_column]) {
                errors.push(`Required field '${mapping.staging_field}' is missing`)
            }
        })

        // Validate invoice number
        const invoiceNumber = row[mappings.find(m => m.staging_field === 'invoice_number')?.csv_column || '']
        if (invoiceNumber && invoiceNumber.length < 3) {
            errors.push('Invoice number is too short')
        }

        // Validate amounts
        const totalAmount = row[mappings.find(m => m.staging_field === 'total_amount')?.csv_column || '']
        if (totalAmount && isNaN(parseFloat(totalAmount))) {
            errors.push('Total amount must be a valid number')
        }

        // Validate dates
        const invoiceDate = row[mappings.find(m => m.staging_field === 'invoice_date')?.csv_column || '']
        if (invoiceDate && !isValidDate(invoiceDate)) {
            errors.push('Invoice date is not valid')
        }

        if (errors.length > 0) {
            invalidRows.push({ row, errors })
            validationErrors[index] = errors
        } else {
            validRows.push(row)
        }
    })

    return { validRows, invalidRows, validationErrors }
}

/**
 * Check if date string is valid
 */
function isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
}

/**
 * Transform CSV row to staging invoice format
 */
export function transformRowToStagingInvoice(
    row: CSVRow, 
    mappings: ColumnMapping[], 
    shopId: string,
    batchId: string
): any {
    const stagingInvoice: any = {
        shop_id: shopId,
        import_batch_id: batchId,
        import_status: 'pending',
        created_at: new Date().toISOString()
    }

    mappings.forEach(mapping => {
        if (mapping.csv_column && row[mapping.csv_column]) {
            const value = row[mapping.csv_column]
            
            // Transform based on field type
            switch (mapping.staging_field) {
                case 'invoice_number':
                case 'status':
                case 'payment_method':
                case 'notes':
                    stagingInvoice[mapping.staging_field] = value
                    break
                    
                case 'invoice_date':
                case 'due_date':
                case 'paid_date':
                    stagingInvoice[mapping.staging_field] = new Date(value).toISOString()
                    break
                    
                case 'total_amount':
                case 'subtotal':
                case 'tax_amount':
                case 'discount_amount':
                case 'labor_total':
                case 'parts_total':
                case 'services_total':
                case 'fees_total':
                    stagingInvoice[mapping.staging_field] = parseFloat(value) || 0
                    break
                    
                case 'tax_rate':
                    stagingInvoice[mapping.staging_field] = parseFloat(value) || 0
                    break
                    
                default:
                    stagingInvoice[mapping.staging_field] = value
            }
        }
    })

    return stagingInvoice
}

/**
 * Generate preview data for import
 */
export function generateImportPreview(
    rows: CSVRow[],
    mappings: ColumnMapping[],
    shopId: string,
    batchId: string
): {
    total_records: number
    valid_records: number
    invalid_records: number
    preview_rows: any[]
    validation_errors: Record<number, string[]>
} {
    const { validRows, invalidRows, validationErrors } = validateCSVData(rows, mappings)
    
    const previewRows = validRows.slice(0, 10).map(row => 
        transformRowToStagingInvoice(row, mappings, shopId, batchId)
    )

    return {
        total_records: rows.length,
        valid_records: validRows.length,
        invalid_records: invalidRows.length,
        preview_rows: previewRows,
        validation_errors: validationErrors
    }
}
