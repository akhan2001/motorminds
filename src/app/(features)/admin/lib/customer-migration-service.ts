import OpenAI from 'openai'
import { CSVAnalysis, ColumnMapping, MigrationPreview, ImportResult } from '../types/migrations'
import { CustomerMigrationFormData } from '../schemas/customer-migration'
import { createClient } from '@/utils/supabase/client'

interface StagingCustomer {
    id: string
    customer_name?: string
    customer_email?: string
    customer_phone?: string
    customer_address?: string
    license_plate?: string
    customer_source?: string
    shop_id: string
    import_status: string
    import_batch_id?: string
    validation_errors?: string[]
    created_at: string
}

class CustomerMigrationService {
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

        // Define available staging customer fields
        const stagingFields = [
            { field: 'customer_name', description: 'Full customer name', required: true },
            { field: 'customer_email', description: 'Customer email address', required: false },
            { field: 'customer_phone', description: 'Customer phone number', required: false },
            { field: 'customer_address', description: 'Customer address', required: false },
            { field: 'license_plate', description: 'Vehicle license plate', required: false },
            { field: 'customer_source', description: 'How customer was acquired', required: false },
        ]

        let suggestedMappings: ColumnMapping[] = []
        let confidenceScore = 0

        if (this.openai) {
            try {
                const prompt = `You are a data mapping expert. Analyze these CSV headers and suggest which staging customer fields they map to.

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
            'customer_name': ['name', 'customer_name', 'full_name', 'customer', 'client_name', 'fullname'],
            'customer_email': ['email', 'customer_email', 'email_address', 'e_mail', 'mail'],
            'customer_phone': ['phone', 'customer_phone', 'phone_number', 'telephone', 'mobile', 'cell'],
            'customer_address': ['address', 'customer_address', 'street', 'full_address', 'location'],
            'license_plate': ['license_plate', 'license', 'plate', 'vehicle_plate', 'reg_plate'],
            'customer_source': ['source', 'customer_source', 'referral', 'how_found', 'acquisition'],
        }

        const stagingFields = [
            { field: 'customer_name', required: true },
            { field: 'customer_email', required: false },
            { field: 'customer_phone', required: false },
            { field: 'customer_address', required: false },
            { field: 'license_plate', required: false },
            { field: 'customer_source', required: false },
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
        const hasCustomerName = mappings['customer_name'] && mappings['customer_name'] !== '_skip_' && mappings['customer_name'] !== ''
        if (!hasCustomerName) {
            errors.push('Customer Name field is required - please map a CSV column to it')
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    async generatePreview(
        file: File,
        mappings: Record<string, string>,
        formData: CustomerMigrationFormData
    ): Promise<MigrationPreview> {
        const { headers, rows } = await this.parseCSV(file)
        const previewRows: StagingCustomer[] = []
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
                    if (stagingField === 'customer_name' && !value) {
                        errors.push('Customer name is required')
                    }
                    if (stagingField === 'customer_email' && value && !this.isValidEmail(value)) {
                        errors.push('Invalid email format')
                    }
                    if (stagingField === 'customer_phone' && value && !this.isValidPhone(value)) {
                        errors.push('Invalid phone format')
                    }

                    stagingRow[stagingField] = value
                }
            })

            // Handle concatenation if enabled
            if (formData.concatName && formData.firstNameColumn && formData.lastNameColumn) {
                const firstName = row[formData.firstNameColumn] || ''
                const lastName = row[formData.lastNameColumn] || ''
                stagingRow.customer_name = `${firstName} ${lastName}`.trim()
            }

            if (formData.concatAddress && formData.streetColumn && formData.cityColumn) {
                const street = row[formData.streetColumn] || ''
                const city = row[formData.cityColumn] || ''
                const province = formData.provinceColumn ? row[formData.provinceColumn] || '' : ''
                const postalCode = formData.postalCodeColumn ? row[formData.postalCodeColumn] || '' : ''
                
                const addressParts = [street, city, province, postalCode].filter(Boolean)
                stagingRow.customer_address = addressParts.join(', ')
            }

            if (formData.concatPhone && formData.areaCodeColumn && formData.phoneNumberColumn) {
                const areaCode = row[formData.areaCodeColumn] || ''
                const phoneNumber = row[formData.phoneNumberColumn] || ''
                stagingRow.customer_phone = `${areaCode}${phoneNumber}`.trim()
            }

            if (errors.length > 0) {
                validationErrors[index] = errors
                invalidCount++
            } else {
                validCount++
            }

            previewRows.push(stagingRow as StagingCustomer)
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
        formData: CustomerMigrationFormData
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

            // Map CSV columns to staging fields
            Object.entries(mappings).forEach(([stagingField, csvColumn]) => {
                if (csvColumn && csvColumn !== '_skip_' && csvColumn !== '_none_') {
                    const value = row[csvColumn]
                    stagingRow[stagingField] = value || null
                }
            })

            // Handle concatenation if enabled
            if (formData.concatName && formData.firstNameColumn && formData.lastNameColumn) {
                const firstName = row[formData.firstNameColumn] || ''
                const lastName = row[formData.lastNameColumn] || ''
                stagingRow.customer_name = `${firstName} ${lastName}`.trim()
            }

            if (formData.concatAddress && formData.streetColumn && formData.cityColumn) {
                const street = row[formData.streetColumn] || ''
                const city = row[formData.cityColumn] || ''
                const province = formData.provinceColumn ? row[formData.provinceColumn] || '' : ''
                const postalCode = formData.postalCodeColumn ? row[formData.postalCodeColumn] || '' : ''
                
                const addressParts = [street, city, province, postalCode].filter(Boolean)
                stagingRow.customer_address = addressParts.join(', ')
            }

            if (formData.concatPhone && formData.areaCodeColumn && formData.phoneNumberColumn) {
                const areaCode = row[formData.areaCodeColumn] || ''
                const phoneNumber = row[formData.phoneNumberColumn] || ''
                stagingRow.customer_phone = `${areaCode}${phoneNumber}`.trim()
            }

            return stagingRow
        })

        // Insert records into staging table
        try {
            console.log('Attempting to insert customer records:', stagingRecords.length)
            console.log('Sample record:', stagingRecords[0])
            
            const { data, error } = await supabase
                .from('staging_customers')
                .insert(stagingRecords)
                .select()

            if (error) {
                console.error('Error inserting to staging:', error)
                throw new Error(`Failed to import to staging: ${error.message}`)
            }

            console.log('Successfully inserted customer records:', data?.length)
            
            return {
                success: true,
                imported_count: data?.length || stagingRecords.length,
                failed_count: 0,
                batch_id: batchId
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

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    private isValidPhone(phone: string): boolean {
        // Basic phone validation - can be enhanced
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
    }
}

export const customerMigrationService = new CustomerMigrationService()
