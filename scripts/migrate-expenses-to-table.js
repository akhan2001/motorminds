/**
 * Migration Script: Move expenses to dedicated expenses table
 * 
 * This script migrates expense data from:
 * 1. work_order_items (item_type = 'expense')
 * 2. invoice_items JSON array (item_type = 'expense')
 * 
 * to the dedicated expenses table for consolidation.
 * 
 * Run with: node scripts/migrate-expenses-to-table.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateWorkOrderExpenses() {
    console.log('=== Migrating expenses from work_order_items ===\n')

    // Get all expense items from work_order_items
    const { data: expenseItems, error: fetchError } = await supabase
        .from('work_order_items')
        .select(`
            *,
            work_orders!inner (
                id,
                shop_id
            )
        `)
        .eq('item_type', 'expense')

    if (fetchError) {
        console.error('Error fetching expense items:', fetchError)
        return { migrated: 0, skipped: 0, errors: 0 }
    }

    console.log(`Found ${expenseItems.length} expense items in work_order_items\n`)

    if (expenseItems.length === 0) {
        return { migrated: 0, skipped: 0, errors: 0 }
    }

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const item of expenseItems) {
        const shopId = item.shop_id || item.work_orders?.shop_id

        if (!shopId) {
            console.log(`  Skipping item ${item.id} - no shop_id`)
            skipped++
            continue
        }

        // Get invoice_id (UUID) from invoices_table if work order has an invoice
        let invoiceId = null
        if (item.work_order_id) {
            const { data: invoice } = await supabase
                .from('invoices_table')
                .select('id')
                .eq('work_order_id', item.work_order_id)
                .limit(1)
                .maybeSingle()
            
            if (invoice) {
                invoiceId = invoice.id
            }
        }

        // Check if this expense already exists in expenses table
        const { data: existing } = await supabase
            .from('expenses')
            .select('id')
            .eq('work_order_id', item.work_order_id)
            .eq('description', item.description)
            .gte('total', (item.total_cost || item.total_price || 0) - 0.01)
            .lte('total', (item.total_cost || item.total_price || 0) + 0.01)
            .limit(1)

        if (existing && existing.length > 0) {
            console.log(`  Skipping "${item.description}" - already exists`)
            skipped++
            continue
        }

        // Build expense record
        const expenseData = {
            shop_id: shopId,
            work_order_id: item.work_order_id,
            invoice_id: invoiceId,
            source_type: 'work_order',
            description: item.description,
            category: item.category || 'Parts & Supplies',
            subtotal: item.expense_subtotal || item.total_cost || item.total_price || 0,
            tax_amount: item.expense_tax_amount || 0,
            tax_rate: item.expense_tax_rate || 0.13,
            tax_included: item.expense_tax_included || false,
            total: item.total_cost || item.total_price || (item.expense_subtotal || 0) + (item.expense_tax_amount || 0),
            vendor: item.expense_vendor || null,
            invoice_number: item.expense_invoice_number || null,
            payment_method: item.expense_payment_method || null,
            parts_description: item.expense_parts_description || null,
            expense_date: item.expense_cost_date || new Date(item.created_at).toISOString().split('T')[0],
            warranty_period: item.warranty_period || null,
            notes: item.notes || null,
            is_billable: false,
            created_at: item.created_at,
            updated_at: item.updated_at,
            archived: item.active === false,
        }

        // Insert into expenses table
        const { error: insertError } = await supabase
            .from('expenses')
            .insert(expenseData)

        if (insertError) {
            console.error(`  Error migrating "${item.description}":`, insertError.message)
            errors++
        } else {
            console.log(`  Migrated: "${item.description}" ($${expenseData.total})`)
            migrated++
        }
    }

    return { migrated, skipped, errors, total: expenseItems.length }
}

async function migrateInvoiceExpenses() {
    console.log('\n=== Migrating expenses from invoice_items JSONB ===\n')

    // Get all invoices with invoice_items JSONB field
    const { data: invoices, error: fetchError } = await supabase
        .from('invoices_table')
        .select('id, invoice_number, shop_id, work_order_id, issue_date, created_at, updated_at, invoice_items')
        .not('invoice_items', 'is', null)

    if (fetchError) {
        console.error('Error fetching invoices:', fetchError)
        return { migrated: 0, skipped: 0, errors: 0 }
    }

    console.log(`Found ${invoices.length} invoices with invoice_items\n`)

    let migrated = 0
    let skipped = 0
    let errors = 0
    let totalExpenseItems = 0

    for (const invoice of invoices) {
        if (!invoice.shop_id) {
            continue
        }

        // Parse invoice_items JSONB
        let invoiceItems = []
        try {
            if (typeof invoice.invoice_items === 'string') {
                invoiceItems = JSON.parse(invoice.invoice_items)
            } else if (Array.isArray(invoice.invoice_items)) {
                invoiceItems = invoice.invoice_items
            } else {
                continue
            }
        } catch (e) {
            console.log(`  Skipping invoice ${invoice.invoice_number} - invalid JSON: ${e.message}`)
            continue
        }

        if (!Array.isArray(invoiceItems) || invoiceItems.length === 0) {
            continue
        }

        // Filter for expense items
        const expenseItems = invoiceItems.filter(item => 
            item && 
            item.item_type === 'expense' && 
            (item.active === undefined || item.active !== false)
        )

        totalExpenseItems += expenseItems.length

        for (const item of expenseItems) {
            // Check if this expense already exists (use invoice UUID id)
            const { data: existing } = await supabase
                .from('expenses')
                .select('id')
                .eq('invoice_id', invoice.id)
                .eq('description', item.description)
                .gte('total', (item.total_cost || item.total_price || item.expense_subtotal || 0) - 0.01)
                .lte('total', (item.total_cost || item.total_price || item.expense_subtotal || 0) + 0.01)
                .limit(1)

            if (existing && existing.length > 0) {
                console.log(`  Skipping "${item.description}" from invoice ${invoice.invoice_number} - already exists`)
                skipped++
                continue
            }

            // Build expense record
            const expenseData = {
                shop_id: invoice.shop_id,
                work_order_id: invoice.work_order_id || null,
                invoice_id: invoice.id, // Use UUID id, not invoice_number
                source_type: 'invoice',
                description: item.description,
                category: item.category || 'Parts & Supplies',
                subtotal: item.expense_subtotal || item.total_cost || item.total_price || 0,
                tax_amount: item.expense_tax_amount || 0,
                tax_rate: item.expense_tax_rate || 0.13,
                tax_included: item.expense_tax_included || false,
                total: item.total_cost || item.total_price || (item.expense_subtotal || 0) + (item.expense_tax_amount || 0),
                vendor: item.expense_vendor || item.supplier || null,
                invoice_number: item.expense_invoice_number || null,
                payment_method: item.expense_payment_method || null,
                parts_description: item.expense_parts_description || null,
                expense_date: item.expense_cost_date || invoice.issue_date || new Date(invoice.created_at).toISOString().split('T')[0],
                warranty_period: item.warranty_period || null,
                notes: item.notes || item.invoice_specific_notes || null,
                is_billable: false,
                created_at: item.created_at || invoice.created_at,
                updated_at: item.updated_at || invoice.updated_at,
                archived: item.active === false,
            }

            // Insert into expenses table
            const { error: insertError } = await supabase
                .from('expenses')
                .insert(expenseData)

            if (insertError) {
                console.error(`  Error migrating "${item.description}" from invoice ${invoice.invoice_number}:`, insertError.message)
                errors++
            } else {
                console.log(`  Migrated: "${item.description}" from invoice ${invoice.invoice_number} ($${expenseData.total})`)
                migrated++
            }
        }
    }

    return { migrated, skipped, errors, total: totalExpenseItems }
}

async function migrateExpenses() {
    console.log('Starting expense migration to dedicated expenses table...\n')

    const woResults = await migrateWorkOrderExpenses()
    const invResults = await migrateInvoiceExpenses()

    console.log('\n=== Final Migration Summary ===')
    console.log('\nWork Order Items:')
    console.log(`  Total found: ${woResults.total}`)
    console.log(`  Migrated: ${woResults.migrated}`)
    console.log(`  Skipped: ${woResults.skipped}`)
    console.log(`  Errors: ${woResults.errors}`)
    
    console.log('\nInvoice Items:')
    console.log(`  Total found: ${invResults.total}`)
    console.log(`  Migrated: ${invResults.migrated}`)
    console.log(`  Skipped: ${invResults.skipped}`)
    console.log(`  Errors: ${invResults.errors}`)
    
    console.log('\nOverall:')
    console.log(`  Total migrated: ${woResults.migrated + invResults.migrated}`)
    console.log(`  Total skipped: ${woResults.skipped + invResults.skipped}`)
    console.log(`  Total errors: ${woResults.errors + invResults.errors}`)
}

migrateExpenses()
    .then(() => {
        console.log('\nMigration complete!')
        process.exit(0)
    })
    .catch((err) => {
        console.error('Migration failed:', err)
        process.exit(1)
    })
