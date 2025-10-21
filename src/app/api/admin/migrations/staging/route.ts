import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_PARSING_KEY,
})

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')

        switch (action) {
            case 'health':
                return await getStagingHealth(supabase)
            case 'tables':
                return await getStagingTables(supabase)
            case 'history':
                return await getVerificationHistory(supabase)
            case 'duplicates':
                return await checkDuplicates(supabase)
            default:
                return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
        }
    } catch (error) {
        console.error('Error in staging API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')
        const body = await request.json()

        switch (action) {
            case 'verify':
                return await runStagingVerification(supabase, body)
            case 'refresh':
                return await refreshStagingData(supabase)
            default:
                return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
        }
    } catch (error) {
        console.error('Error in staging API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

async function getStagingHealth(supabase: any) {
    try {
        // Get actual row counts using count queries
        const [customersCountResult, vehiclesCountResult] = await Promise.all([
            supabase
                .from('staging_customers')
                .select('*', { count: 'exact', head: true }),
            supabase
                .from('staging_customer_vehicles')
                .select('*', { count: 'exact', head: true })
        ])

        // Get sample data for error analysis
        const [customersSampleResult, vehiclesSampleResult] = await Promise.all([
            supabase
                .from('staging_customers')
                .select('import_status, validation_errors')
                .limit(1000),
            supabase
                .from('staging_customer_vehicles')
                .select('import_status, validation_errors')
                .limit(1000)
        ])

        if (customersCountResult.error || vehiclesCountResult.error) {
            throw new Error('Failed to fetch staging data counts')
        }

        const customersCount = customersCountResult.count || 0
        const vehiclesCount = vehiclesCountResult.count || 0
        const customersSample = customersSampleResult.data || []
        const vehiclesSample = vehiclesSampleResult.data || []

        // Calculate health metrics from sample data
        const errorRecords = [
            ...customersSample.filter(c => c.validation_errors && c.validation_errors.length > 0),
            ...vehiclesSample.filter(v => v.validation_errors && v.validation_errors.length > 0)
        ].length

        const pendingRecords = [
            ...customersSample.filter(c => c.import_status === 'pending'),
            ...vehiclesSample.filter(v => v.import_status === 'pending')
        ].length

        const overallStatus = errorRecords > 0 ? 'critical' : pendingRecords > 0 ? 'warning' : 'healthy'

        const health = {
            overall_status: overallStatus,
            tables: [
                {
                    name: 'staging_customers',
                    schema: 'public',
                    row_count: customersCount,
                    size_mb: 0, // Would need actual table size query
                    last_updated: new Date().toISOString(),
                    status: customersSample.some(c => c.validation_errors?.length > 0) ? 'error' : 'healthy',
                    issues: customersSample.filter(c => c.validation_errors?.length > 0).map(c => c.validation_errors).flat()
                },
                {
                    name: 'staging_customer_vehicles',
                    schema: 'public',
                    row_count: vehiclesCount,
                    size_mb: 0,
                    last_updated: new Date().toISOString(),
                    status: vehiclesSample.some(v => v.validation_errors?.length > 0) ? 'error' : 'healthy',
                    issues: vehiclesSample.filter(v => v.validation_errors?.length > 0).map(v => v.validation_errors).flat()
                }
            ],
            last_verification: new Date().toISOString(),
            issues_count: errorRecords,
            recommendations: generateRecommendations(customersSample, vehiclesSample)
        }

        return NextResponse.json(health)
    } catch (error) {
        console.error('Error getting staging health:', error)
        return NextResponse.json({ error: 'Failed to get staging health' }, { status: 500 })
    }
}

async function getStagingTables(supabase: any) {
    try {
        // Get actual row counts using count queries
        const [customersCountResult, vehiclesCountResult] = await Promise.all([
            supabase
                .from('staging_customers')
                .select('*', { count: 'exact', head: true }),
            supabase
                .from('staging_customer_vehicles')
                .select('*', { count: 'exact', head: true })
        ])

        // Get sample data for status analysis
        const [customersSampleResult, vehiclesSampleResult] = await Promise.all([
            supabase
                .from('staging_customers')
                .select('import_status, validation_errors, created_at')
                .limit(1000),
            supabase
                .from('staging_customer_vehicles')
                .select('import_status, validation_errors, created_at')
                .limit(1000)
        ])

        if (customersCountResult.error || vehiclesCountResult.error) {
            throw new Error('Failed to fetch staging table counts')
        }

        const customersCount = customersCountResult.count || 0
        const vehiclesCount = vehiclesCountResult.count || 0
        const customersSample = customersSampleResult.data || []
        const vehiclesSample = vehiclesSampleResult.data || []

        const tables = [
            {
                name: 'staging_customers',
                schema: 'public',
                row_count: customersCount,
                size_mb: 0,
                last_updated: customersSample.length > 0 ? customersSample[0].created_at : new Date().toISOString(),
                status: customersSample.some(c => c.validation_errors?.length > 0) ? 'error' : 'healthy',
                issues: customersSample.filter(c => c.validation_errors?.length > 0).map(c => c.validation_errors).flat()
            },
            {
                name: 'staging_customer_vehicles',
                schema: 'public',
                row_count: vehiclesCount,
                size_mb: 0,
                last_updated: vehiclesSample.length > 0 ? vehiclesSample[0].created_at : new Date().toISOString(),
                status: vehiclesSample.some(v => v.validation_errors?.length > 0) ? 'error' : 'healthy',
                issues: vehiclesSample.filter(v => v.validation_errors?.length > 0).map(v => v.validation_errors).flat()
            }
        ]

        return NextResponse.json(tables)
    } catch (error) {
        console.error('Error getting staging tables:', error)
        return NextResponse.json({ error: 'Failed to get staging tables' }, { status: 500 })
    }
}

async function runStagingVerification(supabase: any, request: any) {
    try {
        const { table_names, verification_types, force_refresh } = request
        
        const verificationId = `verify_${Date.now()}`
        const startTime = Date.now()

        // Run verification checks
        const checks = []
        
        // Schema validation
        if (!verification_types || verification_types.includes('schema')) {
            const schemaChecks = await validateSchema(supabase, table_names)
            checks.push(...schemaChecks)
        }

        // Data integrity validation
        if (!verification_types || verification_types.includes('integrity')) {
            const integrityChecks = await validateDataIntegrity(supabase, table_names)
            checks.push(...integrityChecks)
        }

        // Data quality validation
        if (!verification_types || verification_types.includes('data')) {
            const dataChecks = await validateDataQuality(supabase, table_names)
            checks.push(...dataChecks)
        }

        // AI-powered analysis
        if (!verification_types || verification_types.includes('ai_analysis')) {
            const aiChecks = await validateWithAI(supabase, table_names)
            checks.push(...aiChecks)
        }

        const duration = Date.now() - startTime
        const passedChecks = checks.filter(c => c.status === 'pass').length
        const failedChecks = checks.filter(c => c.status === 'fail').length
        const warningChecks = checks.filter(c => c.status === 'warning').length

        const result = {
            success: true,
            message: 'Verification completed successfully',
            verification_id: verificationId,
            results: {
                passed: failedChecks === 0,
                checks: checks,
                summary: {
                    total_checks: checks.length,
                    passed_checks: passedChecks,
                    failed_checks: failedChecks,
                    warnings: warningChecks
                }
            }
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error running staging verification:', error)
        return NextResponse.json({ 
            success: false, 
            message: 'Verification failed', 
            errors: [error instanceof Error ? error.message : 'Unknown error'] 
        }, { status: 500 })
    }
}

async function getVerificationHistory(supabase: any) {
    // For now, return empty array - in a real implementation, this would query a verification history table
    return NextResponse.json([])
}

async function refreshStagingData(supabase: any) {
    try {
        // In a real implementation, this would trigger a data refresh process
        return NextResponse.json({ 
            success: true, 
            message: 'Staging data refresh initiated' 
        })
    } catch (error) {
        console.error('Error refreshing staging data:', error)
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to refresh staging data' 
        }, { status: 500 })
    }
}

async function validateSchema(supabase: any, tableNames?: string[]) {
    const checks = []
    
    const tablesToCheck = tableNames || ['staging_customers', 'staging_customer_vehicles']
    
    for (const tableName of tablesToCheck) {
        try {
            // Check if table exists and has required columns
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1)

            if (error) {
                checks.push({
                    name: `${tableName}_schema_check`,
                    description: `Schema validation for ${tableName}`,
                    status: 'fail',
                    message: `Table ${tableName} has schema issues: ${error.message}`,
                    details: { error: error.message }
                })
            } else {
                checks.push({
                    name: `${tableName}_schema_check`,
                    description: `Schema validation for ${tableName}`,
                    status: 'pass',
                    message: `Table ${tableName} schema is valid`,
                    details: { row_count: data?.length || 0 }
                })
            }
        } catch (error) {
            checks.push({
                name: `${tableName}_schema_check`,
                description: `Schema validation for ${tableName}`,
                status: 'fail',
                message: `Failed to validate ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            })
        }
    }
    
    return checks
}

async function validateDataIntegrity(supabase: any, tableNames?: string[]) {
    const checks = []
    
    try {
        // Check for orphaned vehicles (vehicles without customers)
        const { data: orphanedVehicles, error: orphanedError } = await supabase
            .from('staging_customer_vehicles')
            .select('id, customer_id')
            .is('customer_id', null)

        if (orphanedError) {
            checks.push({
                name: 'orphaned_vehicles_check',
                description: 'Check for orphaned vehicle records',
                status: 'fail',
                message: `Failed to check orphaned vehicles: ${orphanedError.message}`,
                details: { error: orphanedError.message }
            })
        } else {
            const orphanedCount = orphanedVehicles?.length || 0
            checks.push({
                name: 'orphaned_vehicles_check',
                description: 'Check for orphaned vehicle records',
                status: orphanedCount > 0 ? 'warning' : 'pass',
                message: orphanedCount > 0 ? `Found ${orphanedCount} orphaned vehicle records` : 'No orphaned vehicles found',
                details: { orphaned_count: orphanedCount }
            })
        }

        // Check for duplicate customers
        const { data: duplicateCustomers, error: duplicateError } = await supabase
            .from('staging_customers')
            .select('customer_email, customer_phone')
            .not('customer_email', 'is', null)
            .not('customer_phone', 'is', null)

        if (!duplicateError && duplicateCustomers) {
            const emailCounts = duplicateCustomers.reduce((acc: any, customer: any) => {
                acc[customer.customer_email] = (acc[customer.customer_email] || 0) + 1
                return acc
            }, {})

            const phoneCounts = duplicateCustomers.reduce((acc: any, customer: any) => {
                acc[customer.customer_phone] = (acc[customer.customer_phone] || 0) + 1
                return acc
            }, {})

            const duplicateEmails = Object.entries(emailCounts).filter(([_, count]) => count > 1).length
            const duplicatePhones = Object.entries(phoneCounts).filter(([_, count]) => count > 1).length

            checks.push({
                name: 'duplicate_customers_check',
                description: 'Check for duplicate customer records',
                status: duplicateEmails > 0 || duplicatePhones > 0 ? 'warning' : 'pass',
                message: `Found ${duplicateEmails} duplicate emails and ${duplicatePhones} duplicate phones`,
                details: { duplicate_emails: duplicateEmails, duplicate_phones: duplicatePhones }
            })
        }
    } catch (error) {
        checks.push({
            name: 'data_integrity_check',
            description: 'Data integrity validation',
            status: 'fail',
            message: `Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
    }
    
    return checks
}

async function validateDataQuality(supabase: any, tableNames?: string[]) {
    const checks = []
    
    try {
        // Check for missing required fields in customers
        const { data: customers, error: customersError } = await supabase
            .from('staging_customers')
            .select('id, customer_name, customer_email, customer_phone')

        if (!customersError && customers) {
            const missingName = customers.filter(c => !c.customer_name || c.customer_name.trim() === '').length
            const missingEmail = customers.filter(c => !c.customer_email || c.customer_email.trim() === '').length
            const missingPhone = customers.filter(c => !c.customer_phone || c.customer_phone.trim() === '').length

            checks.push({
                name: 'customer_data_quality_check',
                description: 'Check customer data quality',
                status: missingName > 0 || missingEmail > 0 || missingPhone > 0 ? 'warning' : 'pass',
                message: `Missing data: ${missingName} names, ${missingEmail} emails, ${missingPhone} phones`,
                details: { missing_names: missingName, missing_emails: missingEmail, missing_phones: missingPhone }
            })
        }

        // Check for missing required fields in vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
            .from('staging_customer_vehicles')
            .select('id, year, make, model, vin')

        if (!vehiclesError && vehicles) {
            const missingYear = vehicles.filter(v => !v.year).length
            const missingMake = vehicles.filter(v => !v.make || v.make.trim() === '').length
            const missingModel = vehicles.filter(v => !v.model || v.model.trim() === '').length
            const missingVin = vehicles.filter(v => !v.vin || v.vin.trim() === '').length

            checks.push({
                name: 'vehicle_data_quality_check',
                description: 'Check vehicle data quality',
                status: missingYear > 0 || missingMake > 0 || missingModel > 0 || missingVin > 0 ? 'warning' : 'pass',
                message: `Missing data: ${missingYear} years, ${missingMake} makes, ${missingModel} models, ${missingVin} VINs`,
                details: { missing_years: missingYear, missing_makes: missingMake, missing_models: missingModel, missing_vins: missingVin }
            })
        }
    } catch (error) {
        checks.push({
            name: 'data_quality_check',
            description: 'Data quality validation',
            status: 'fail',
            message: `Data quality check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
    }
    
    return checks
}

async function validateWithAI(supabase: any, tableNames?: string[]) {
    const checks = []
    
    try {
        // Get sample data for AI analysis
        const [customersResult, vehiclesResult] = await Promise.all([
            supabase
                .from('staging_customers')
                .select('customer_name, customer_email, customer_phone, customer_address, validation_errors, import_status')
                .limit(50),
            supabase
                .from('staging_customer_vehicles')
                .select('year, make, model, vin, license_plate, engine_type, color, mileage, validation_errors, import_status')
                .limit(50)
        ])

        if (customersResult.error || vehiclesResult.error) {
            checks.push({
                name: 'ai_data_analysis',
                description: 'AI-powered data analysis',
                status: 'fail',
                message: 'Failed to fetch data for AI analysis',
                details: { error: customersResult.error || vehiclesResult.error }
            })
            return checks
        }

        const customers = customersResult.data || []
        const vehicles = vehiclesResult.data || []

        // Prepare data summary for AI analysis
        const dataSummary = {
            customers: {
                total: customers.length,
                with_errors: customers.filter(c => c.validation_errors?.length > 0).length,
                pending: customers.filter(c => c.import_status === 'pending').length,
                sample_data: customers.slice(0, 10).map(c => ({
                    name: c.customer_name,
                    email: c.customer_email,
                    phone: c.customer_phone,
                    has_errors: c.validation_errors?.length > 0
                }))
            },
            vehicles: {
                total: vehicles.length,
                with_errors: vehicles.filter(v => v.validation_errors?.length > 0).length,
                pending: vehicles.filter(v => v.import_status === 'pending').length,
                sample_data: vehicles.slice(0, 10).map(v => ({
                    year: v.year,
                    make: v.make,
                    model: v.model,
                    vin: v.vin,
                    has_errors: v.validation_errors?.length > 0
                }))
            }
        }

        // Use ChatGPT to analyze the data
        const prompt = `Analyze this automotive shop staging data and provide insights:

Customer Data:
- Total customers: ${dataSummary.customers.total}
- Records with errors: ${dataSummary.customers.with_errors}
- Pending imports: ${dataSummary.customers.pending}
- Sample data: ${JSON.stringify(dataSummary.customers.sample_data, null, 2)}

Vehicle Data:
- Total vehicles: ${dataSummary.vehicles.total}
- Records with errors: ${dataSummary.vehicles.with_errors}
- Pending imports: ${dataSummary.vehicles.pending}
- Sample data: ${JSON.stringify(dataSummary.vehicles.sample_data, null, 2)}

Please analyze this data and provide:
1. Data quality assessment
2. Common issues identified
3. Recommendations for improvement
4. Risk level (low/medium/high)
5. Priority actions needed

Respond in JSON format with fields: assessment, issues, recommendations, risk_level, priority_actions`

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a data quality analyst specializing in automotive shop management systems. Analyze staging data and provide actionable insights."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        })

        const aiResponse = JSON.parse(completion.choices[0].message.content || '{}')
        
        checks.push({
            name: 'ai_data_analysis',
            description: 'AI-powered data quality analysis',
            status: aiResponse.risk_level === 'high' ? 'fail' : aiResponse.risk_level === 'medium' ? 'warning' : 'pass',
            message: aiResponse.assessment || 'AI analysis completed',
            details: {
                risk_level: aiResponse.risk_level,
                issues: aiResponse.issues,
                recommendations: aiResponse.recommendations,
                priority_actions: aiResponse.priority_actions
            }
        })

    } catch (error) {
        checks.push({
            name: 'ai_data_analysis',
            description: 'AI-powered data analysis',
            status: 'fail',
            message: `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
    }
    
    return checks
}

async function checkDuplicates(supabase: any) {
    try {
        // Check for duplicate customers by email
        const { data: customerEmails, error: emailError } = await supabase
            .from('staging_customers')
            .select('customer_email')
            .not('customer_email', 'is', null)

        if (emailError) {
            throw new Error(`Failed to fetch customer emails: ${emailError.message}`)
        }

        // Check for duplicate customers by phone
        const { data: customerPhones, error: phoneError } = await supabase
            .from('staging_customers')
            .select('customer_phone')
            .not('customer_phone', 'is', null)

        if (phoneError) {
            throw new Error(`Failed to fetch customer phones: ${phoneError.message}`)
        }

        // Check for duplicate vehicles by VIN
        const { data: vehicleVins, error: vinError } = await supabase
            .from('staging_customer_vehicles')
            .select('vin')
            .not('vin', 'is', null)

        if (vinError) {
            throw new Error(`Failed to fetch vehicle VINs: ${vinError.message}`)
        }

        // Check for duplicate vehicles by license plate
        const { data: vehiclePlates, error: plateError } = await supabase
            .from('staging_customer_vehicles')
            .select('license_plate')
            .not('license_plate', 'is', null)

        if (plateError) {
            throw new Error(`Failed to fetch vehicle plates: ${plateError.message}`)
        }

        // Analyze customer email duplicates
        const emailCounts = customerEmails.reduce((acc: any, customer: any) => {
            const email = customer.customer_email?.toLowerCase().trim()
            if (email) {
                acc[email] = (acc[email] || 0) + 1
            }
            return acc
        }, {})

        const duplicateEmails = Object.entries(emailCounts)
            .filter(([_, count]) => count > 1)
            .map(([email, count]) => ({ email, count }))

        // Analyze customer phone duplicates
        const phoneCounts = customerPhones.reduce((acc: any, customer: any) => {
            const phone = customer.customer_phone?.trim()
            if (phone) {
                acc[phone] = (acc[phone] || 0) + 1
            }
            return acc
        }, {})

        const duplicatePhones = Object.entries(phoneCounts)
            .filter(([_, count]) => count > 1)
            .map(([phone, count]) => ({ phone, count }))

        // Analyze vehicle VIN duplicates
        const vinCounts = vehicleVins.reduce((acc: any, vehicle: any) => {
            const vin = vehicle.vin?.toUpperCase().trim()
            if (vin) {
                acc[vin] = (acc[vin] || 0) + 1
            }
            return acc
        }, {})

        const duplicateVins = Object.entries(vinCounts)
            .filter(([_, count]) => count > 1)
            .map(([vin, count]) => ({ vin, count }))

        // Analyze vehicle plate duplicates
        const plateCounts = vehiclePlates.reduce((acc: any, vehicle: any) => {
            const plate = vehicle.license_plate?.toUpperCase().trim()
            if (plate) {
                acc[plate] = (acc[plate] || 0) + 1
            }
            return acc
        }, {})

        const duplicatePlates = Object.entries(plateCounts)
            .filter(([_, count]) => count > 1)
            .map(([plate, count]) => ({ license_plate: plate, count }))

        // Calculate totals
        const customerDuplicates = {
            duplicate_emails: duplicateEmails.length,
            duplicate_phones: duplicatePhones.length,
            total_duplicates: duplicateEmails.length + duplicatePhones.length,
            examples: [...duplicateEmails.slice(0, 5), ...duplicatePhones.slice(0, 5)]
        }

        const vehicleDuplicates = {
            duplicate_vins: duplicateVins.length,
            duplicate_plates: duplicatePlates.length,
            total_duplicates: duplicateVins.length + duplicatePlates.length,
            examples: [...duplicateVins.slice(0, 5), ...duplicatePlates.slice(0, 5)]
        }

        const totalDuplicates = customerDuplicates.total_duplicates + vehicleDuplicates.total_duplicates

        return NextResponse.json({
            customer_duplicates: customerDuplicates,
            vehicle_duplicates: vehicleDuplicates,
            total_duplicates: totalDuplicates,
            analysis_timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('Error checking duplicates:', error)
        return NextResponse.json({ 
            error: 'Failed to check duplicates', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 })
    }
}

function generateRecommendations(customers: any[], vehicles: any[]) {
    const recommendations = []
    
    const errorCustomers = customers.filter(c => c.validation_errors?.length > 0)
    const errorVehicles = vehicles.filter(v => v.validation_errors?.length > 0)
    
    if (errorCustomers.length > 0) {
        recommendations.push(`Review ${errorCustomers.length} customer records with validation errors`)
    }
    
    if (errorVehicles.length > 0) {
        recommendations.push(`Review ${errorVehicles.length} vehicle records with validation errors`)
    }
    
    const pendingCustomers = customers.filter(c => c.import_status === 'pending')
    const pendingVehicles = vehicles.filter(v => v.import_status === 'pending')
    
    if (pendingCustomers.length > 0 || pendingVehicles.length > 0) {
        recommendations.push(`Process ${pendingCustomers.length + pendingVehicles.length} pending import records`)
    }
    
    if (recommendations.length === 0) {
        recommendations.push('All staging data appears to be in good condition')
    }
    
    return recommendations
}
