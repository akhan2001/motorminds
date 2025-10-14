import OpenAI from 'openai'
import { CSVAnalysis, ColumnMapping, MigrationPreview, ImportResult, StagingInvoice } from '../types/migrations'
import { InvoiceMigrationFormData } from '../schemas/invoice-migration'
import { createClient } from '@/utils/supabase/client'

class InvoiceMigrationService {
    private openai: OpenAI | null = null

    constructor() {
        // Initialize OpenAI only if API key is available
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_OPENAI_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
                dangerouslyAllowBrowser: true
            })
        }
    }

    async parseCSV(file: File): Promise<{ headers: string[], rows: any[] }> {
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length === 0) {
            throw new Error('CSV file is empty')
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const rows = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
            const row: any = {}
            headers.forEach((header, index) => {
                row[header] = values[index] || ''
            })
            return row
        })

        return { headers, rows }
    }

    async analyzeCSVHeaders(file: File): Promise<CSVAnalysis> {
        const { headers, rows } = await this.parseCSV(file)
        const sampleRows = rows.slice(0, 5)

        // Define available staging invoice fields
        const stagingFields = [
            { field: 'invoice_number', description: 'Invoice or order number', required: true },
            { field: 'invoice_date', description: 'Date of invoice', required: false },
            { field: 'due_date', description: 'Payment due date', required: false },
            { field: 'paid_date', description: 'Date invoice was paid', required: false },
            { field: 'status', description: 'Invoice status (paid, unpaid, pending)', required: false },
            { field: 'payment_method', description: 'How payment was made', required: false },
            { field: 'subtotal', description: 'Subtotal before tax', required: false },
            { field: 'tax_rate', description: 'Tax rate percentage', required: false },
            { field: 'tax_amount', description: 'Tax amount', required: false },
            { field: 'discount_amount', description: 'Discount applied', required: false },
            { field: 'total_amount', description: 'Total invoice amount', required: true },
            { field: 'labor_total', description: 'Labor charges', required: false },
            { field: 'parts_total', description: 'Parts charges', required: false },
            { field: 'services_total', description: 'Service charges', required: false },
            { field: 'fees_total', description: 'Additional fees', required: false },
            { field: 'notes', description: 'Additional notes', required: false },
        ]

        let suggestedMappings: ColumnMapping[] = []
        let confidenceScore = 0

        if (this.openai) {
            try {
                const prompt = `You are a data mapping expert. Analyze these CSV headers and suggest which staging invoice fields they map to.

CSV Headers: ${headers.join(', ')}

Sample Data (first row):
${JSON.stringify(sampleRows[0], null, 2)}

Available Staging Fields:
${stagingFields.map(f => `- ${f.field}: ${f.description} ${f.required ? '(REQUIRED)' : ''}`).join('\n')}

Return a JSON array of mappings with this exact structure:
[
  {
    "csv_column": "exact CSV header name",
    "suggested_field": "staging_field_name",
    "confidence": 0.95,
    "reason": "brief explanation"
  }
]

Only include fields you're confident about (>0.7 confidence). Return ONLY valid JSON, no markdown.`

                const completion = await this.openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: "You are a data mapping expert. Return only valid JSON arrays, no markdown formatting."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                })

                const content = completion.choices[0]?.message?.content || '[]'
                const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
                const aiMappings = JSON.parse(cleanContent)

                // Create mapping for each staging field
                suggestedMappings = stagingFields.map(stagingField => {
                    const aiMapping = aiMappings.find((m: any) => m.suggested_field === stagingField.field)
                    const csvColumn = aiMapping?.csv_column || ''
                    const sampleData = csvColumn ? sampleRows.map(row => row[csvColumn]).filter(Boolean).slice(0, 3) : []
                    
                    return {
                        staging_field: stagingField.field,
                        csv_column: csvColumn,
                        suggested_field: csvColumn,
                        confidence: aiMapping?.confidence || 0,
                        suggested: !!aiMapping && aiMapping.confidence > 0.3,
                        required: stagingField.required,
                        sample_data: sampleData
                    }
                })

                confidenceScore = aiMappings.reduce((sum: number, m: any) => sum + (m.confidence || 0), 0) / Math.max(aiMappings.length, 1)
            } catch (error) {
                console.error('AI analysis failed:', error)
                // Fall back to simple matching
                suggestedMappings = this.fallbackMapping(headers, sampleRows)
                confidenceScore = 0.5
            }
        } else {
            // No AI available, use fallback
            suggestedMappings = this.fallbackMapping(headers, sampleRows)
            confidenceScore = 0.5
        }

        return {
            headers,
            sample_rows: sampleRows,
            suggested_mappings: suggestedMappings,
            questions: [],
            confidence_score: confidenceScore
        }
    }

    private fallbackMapping(headers: string[], sampleRows: any[]): ColumnMapping[] {
        const commonMappings: Record<string, string[]> = {
            'invoice_number': ['invoice', 'invoice_number', 'invoice_no', 'order_number', 'invoice #', 'inv_no'],
            'invoice_date': ['date', 'invoice_date', 'invoice date', 'created', 'created_date'],
            'total_amount': ['total', 'total_amount', 'amount', 'grand_total', 'total amount'],
            'subtotal': ['subtotal', 'sub_total', 'sub total'],
            'tax_amount': ['tax', 'tax_amount', 'tax amount', 'hst', 'gst'],
            'tax_rate': ['tax_rate', 'tax rate', 'tax %', 'tax_percent'],
            'status': ['status', 'payment_status', 'invoice_status'],
            'payment_method': ['payment_method', 'payment method', 'payment_type'],
            'discount_amount': ['discount', 'discount_amount', 'discount amount'],
            'labor_total': ['labor', 'labor_total', 'labour', 'labor amount'],
            'parts_total': ['parts', 'parts_total', 'parts amount'],
            'services_total': ['services', 'services_total', 'service amount'],
            'fees_total': ['fees', 'fees_total', 'additional fees'],
            'notes': ['notes', 'comments', 'description', 'remarks'],
            'due_date': ['due_date', 'due date', 'payment_due'],
            'paid_date': ['paid_date', 'paid date', 'payment_date'],
        }

        const stagingFields = [
            { field: 'invoice_number', required: true },
            { field: 'invoice_date', required: false },
            { field: 'due_date', required: false },
            { field: 'paid_date', required: false },
            { field: 'status', required: false },
            { field: 'payment_method', required: false },
            { field: 'subtotal', required: false },
            { field: 'tax_rate', required: false },
            { field: 'tax_amount', required: false },
            { field: 'discount_amount', required: false },
            { field: 'total_amount', required: true },
            { field: 'labor_total', required: false },
            { field: 'parts_total', required: false },
            { field: 'services_total', required: false },
            { field: 'fees_total', required: false },
            { field: 'notes', required: false },
        ]

        return stagingFields.map(stagingField => {
            let matchedHeader = ''
            let confidence = 0

            // Find best matching CSV header for this staging field
            const possibleMatches = commonMappings[stagingField.field] || []
            for (const header of headers) {
                const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_')
                if (possibleMatches.some(match => lowerHeader.includes(match.toLowerCase().replace(/[^a-z0-9]/g, '_')))) {
                    matchedHeader = header
                    confidence = 0.7
                    break
                }
            }

            const sampleData = matchedHeader ? sampleRows.map(row => row[matchedHeader]).filter(Boolean).slice(0, 3) : []

            return {
                staging_field: stagingField.field,
                csv_column: matchedHeader,
                suggested_field: matchedHeader || undefined,
                confidence: confidence,
                suggested: !!matchedHeader,
                required: stagingField.required,
                sample_data: sampleData
            }
        })
    }

    validateMappings(mappings: Record<string, string>): { valid: boolean, errors: string[] } {
        const errors: string[] = []
        
        // Check required fields - mappings structure is { staging_field: csv_column }
        // So we check if the required staging fields have CSV columns assigned
        const hasInvoiceNumber = mappings['invoice_number'] && mappings['invoice_number'] !== '_skip_' && mappings['invoice_number'] !== ''
        if (!hasInvoiceNumber) {
            errors.push('Invoice Number field is required - please map a CSV column to it')
        }

        const hasTotalAmount = mappings['total_amount'] && mappings['total_amount'] !== '_skip_' && mappings['total_amount'] !== ''
        if (!hasTotalAmount) {
            errors.push('Total Amount field is required - please map a CSV column to it')
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    async generatePreview(
        file: File,
        mappings: Record<string, string>,
        formData: InvoiceMigrationFormData
    ): Promise<MigrationPreview> {
        const { headers, rows } = await this.parseCSV(file)
        const previewRows: StagingInvoice[] = []
        const validationErrors: Record<number, string[]> = {}
        let validCount = 0
        let invalidCount = 0

        // Take first 20 rows for preview
        const rowsToPreview = rows.slice(0, 20)

        rowsToPreview.forEach((row, index) => {
            const errors: string[] = []
            const stagingRow: any = {
                id: `preview-${index}`,
                shop_id: formData.shopId,
                import_status: 'pending',
                created_at: new Date().toISOString()
            }

            // Apply mappings
            Object.entries(mappings).forEach(([csvColumn, stagingField]) => {
                if (stagingField && stagingField !== '_skip_') {
                    const value = row[csvColumn]
                    
                    // Basic validation
                    if (stagingField === 'invoice_number' && !value) {
                        errors.push('Invoice number is required')
                    }
                    if (stagingField === 'total_amount' && !value) {
                        errors.push('Total amount is required')
                    }

                    // Type conversion
                    if (['subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'labor_total', 'parts_total', 'services_total', 'fees_total'].includes(stagingField)) {
                        stagingRow[stagingField] = parseFloat(value) || 0
                    } else if (['invoice_date', 'due_date', 'paid_date'].includes(stagingField)) {
                        stagingRow[stagingField] = value ? new Date(value).toISOString() : null
                    } else {
                        stagingRow[stagingField] = value
                    }
                }
            })

            // Add customer/vehicle references if configured
            if (formData.referenceCustomers && formData.customerIdColumn) {
                stagingRow.customer_identifier = row[formData.customerIdColumn]
            }
            if (formData.referenceVehicles && formData.vehicleIdColumn) {
                stagingRow.vehicle_identifier = row[formData.vehicleIdColumn]
            }

            if (errors.length > 0) {
                validationErrors[index] = errors
                invalidCount++
            } else {
                validCount++
            }

            previewRows.push(stagingRow as StagingInvoice)
        })

        return {
            total_records: rows.length,
            valid_records: validCount,
            invalid_records: invalidCount,
            preview_rows: previewRows,
            validation_errors: validationErrors
        }
    }

    async importToStaging(
        file: File,
        mappings: Record<string, string>,
        formData: InvoiceMigrationFormData
    ): Promise<ImportResult> {
        const { rows } = await this.parseCSV(file)
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const supabase = createClient()
        
        const stagingRecords = rows.map((row, index) => {
            const stagingRow: any = {
                shop_id: formData.shopId,
                import_batch_id: batchId,
                import_status: 'pending',
                created_at: new Date().toISOString()
            }

            // Map CSV columns to staging fields (note: mappings is { staging_field: csv_column })
            Object.entries(mappings).forEach(([stagingField, csvColumn]) => {
                if (csvColumn && csvColumn !== '_skip_' && csvColumn !== '_none_') {
                    const value = row[csvColumn]
                    
                    if (['subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'labor_total', 'parts_total', 'services_total', 'fees_total'].includes(stagingField)) {
                        stagingRow[stagingField] = value ? parseFloat(value) : null
                    } else if (['tax_rate'].includes(stagingField)) {
                        stagingRow[stagingField] = value ? parseFloat(value) : null
                    } else if (['invoice_date', 'due_date', 'paid_date'].includes(stagingField)) {
                        stagingRow[stagingField] = value ? new Date(value).toISOString() : null
                    } else {
                        stagingRow[stagingField] = value || null
                    }
                }
            })

            // Customer matching logic
            if (formData.referenceCustomers && formData.customerIdColumn && formData.customerMatchColumn) {
                const customerValue = row[formData.customerIdColumn]
                if (customerValue) {
                    // Store the identifier for later matching
                    stagingRow.custom_fields = {
                        ...(stagingRow.custom_fields || {}),
                        customer_identifier: customerValue,
                        customer_match_column: formData.customerMatchColumn
                    }
                }
            }
            if (formData.referenceVehicles && formData.vehicleIdColumn) {
                const vehicleIdValue = row[formData.vehicleIdColumn]
                if (vehicleIdValue) {
                    stagingRow.custom_fields = {
                        ...(stagingRow.custom_fields || {}),
                        vehicle_identifier: vehicleIdValue
                    }
                }
            }

            return stagingRow
        })

        // Insert records into staging table
        try {
            console.log('Attempting to insert records:', stagingRecords.length)
            console.log('Sample record:', stagingRecords[0])
            
            const { data, error } = await supabase
                .from('staging_customer_invoices')
                .insert(stagingRecords)
                .select()

            if (error) {
                console.error('Error inserting to staging:', error)
                console.error('Error details:', JSON.stringify(error, null, 2))
                console.error('Error code:', error.code)
                console.error('Error message:', error.message)
                console.error('Error hint:', error.hint)
                console.error('Error details:', error.details)
                throw new Error(`Failed to import to staging: ${error.message || JSON.stringify(error)}`)
            }

            console.log('Successfully inserted records:', data?.length)
            
            // If customer matching is enabled, run the matching process
            let customerMatchResults = { matched: 0, unmatched: 0 }
            if (formData.referenceCustomers && formData.customerIdColumn && formData.customerMatchColumn) {
                try {
                    console.log('Running customer matching...')
                    customerMatchResults = await this.matchCustomersToStaging(batchId)
                    console.log('Customer matching results:', customerMatchResults)
                } catch (error) {
                    console.error('Customer matching failed:', error)
                    // Don't fail the import if matching fails
                }
            }
            
            return {
                success: true,
                imported_count: data?.length || stagingRecords.length,
                failed_count: 0,
                batch_id: batchId,
                customer_matches: customerMatchResults
            }
        } catch (error: any) {
            console.error('Import error:', error)
            return {
                success: false,
                imported_count: 0,
                failed_count: stagingRecords.length,
                batch_id: batchId,
                errors: [error.message || 'Unknown error occurred']
            }
        }
    }

    async matchCustomersToStaging(batchId: string): Promise<{ matched: number, unmatched: number }> {
        const supabase = createClient()
        
        try {
            // Get all invoices in this batch that need customer matching
            const { data: invoices, error: invoicesError } = await supabase
                .from('staging_customer_invoices')
                .select('id, custom_fields, shop_id')
                .eq('import_batch_id', batchId)
                .not('custom_fields->customer_identifier', 'is', null)

            if (invoicesError) throw invoicesError

            let matched = 0
            let unmatched = 0

            for (const invoice of invoices || []) {
                const customerIdentifier = invoice.custom_fields?.customer_identifier
                const matchColumn = invoice.custom_fields?.customer_match_column

                if (!customerIdentifier || !matchColumn) {
                    unmatched++
                    continue
                }

                // Find matching customer in staging_customers
                const { data: customer, error: customerError } = await supabase
                    .from('staging_customers')
                    .select('id')
                    .eq('shop_id', invoice.shop_id)
                    .eq(matchColumn, customerIdentifier)
                    .limit(1)
                    .single()

                if (customerError || !customer) {
                    unmatched++
                    continue
                }

                // Update invoice with matched customer_id
                const { error: updateError } = await supabase
                    .from('staging_customer_invoices')
                    .update({ 
                        customer_id: customer.id,
                        import_status: 'matched'
                    })
                    .eq('id', invoice.id)

                if (updateError) {
                    console.error('Error updating invoice with customer:', updateError)
                    unmatched++
                } else {
                    matched++
                }
            }

            return { matched, unmatched }
        } catch (error: any) {
            console.error('Error matching customers:', error)
            throw error
        }
    }
}

export const invoiceMigrationService = new InvoiceMigrationService()

