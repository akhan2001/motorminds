/**
 * Migration Script: Migrate general expenses from one_time_costs to expenses table
 * 
 * This script migrates general business expenses from the one_time_costs table
 * to the dedicated expenses table with source_type = 'general'.
 * 
 * Run with: node scripts/migrate-general-expenses.js
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

async function migrateGeneralExpenses() {
    console.log('Starting general expenses migration from one_time_costs to expenses table...\n')

    // Get all general expenses from one_time_costs table
    const { data: generalExpenses, error: fetchError } = await supabase
        .from('one_time_costs')
        .select('*')

    if (fetchError) {
        console.error('Error fetching general expenses:', fetchError)
        process.exit(1)
    }

    console.log(`Found ${generalExpenses.length} general expenses in one_time_costs\n`)

    if (generalExpenses.length === 0) {
        console.log('No general expenses to migrate.')
        return
    }

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const expense of generalExpenses) {
        if (!expense.shop_id) {
            console.log(`  Skipping expense ${expense.id} - no shop_id`)
            skipped++
            continue
        }

        // Calculate total - one_time_costs has amount, subtotal, and tax_amount
        const subtotal = expense.subtotal || expense.amount || 0
        const taxAmount = expense.tax_amount || 0
        const total = expense.subtotal 
            ? (expense.subtotal + taxAmount)
            : expense.amount || 0

        // Calculate tax rate if we have both subtotal and tax
        const taxRate = subtotal > 0 && taxAmount > 0 
            ? taxAmount / subtotal 
            : 0.13

        // Check if this expense already exists
        const { data: existing } = await supabase
            .from('expenses')
            .select('id')
            .eq('shop_id', expense.shop_id)
            .eq('source_type', 'general')
            .eq('description', expense.cost_name)
            .gte('total', total - 0.01)
            .lte('total', total + 0.01)
            .eq('expense_date', expense.cost_date)
            .limit(1)

        if (existing && existing.length > 0) {
            console.log(`  Skipping "${expense.cost_name}" - already exists`)
            skipped++
            continue
        }

        // Build expense record
        const expenseData = {
            shop_id: expense.shop_id,
            work_order_id: null,
            invoice_id: null,
            source_type: 'general',
            description: expense.cost_name,
            category: expense.category || 'Other',
            subtotal: subtotal,
            tax_amount: taxAmount,
            tax_rate: taxRate,
            tax_included: expense.tax_included || false,
            total: total,
            vendor: expense.vendor || null,
            invoice_number: expense.invoice_number || null,
            payment_method: expense.payment_method || null,
            parts_description: expense.parts_description || null,
            expense_date: expense.cost_date,
            warranty_period: expense.warranty || null,
            notes: expense.notes || null,
            is_billable: false,
            created_at: expense.created_at,
            updated_at: expense.updated_at,
            archived: false,
        }

        // Insert into expenses table
        const { error: insertError } = await supabase
            .from('expenses')
            .insert(expenseData)

        if (insertError) {
            console.error(`  Error migrating "${expense.cost_name}":`, insertError.message)
            errors++
        } else {
            console.log(`  Migrated: "${expense.cost_name}" ($${total})`)
            migrated++
        }
    }

    console.log('\n=== Migration Summary ===')
    console.log(`Total found: ${generalExpenses.length}`)
    console.log(`Migrated: ${migrated}`)
    console.log(`Skipped (already exists): ${skipped}`)
    console.log(`Errors: ${errors}`)
}

migrateGeneralExpenses()
    .then(() => {
        console.log('\nMigration complete!')
        process.exit(0)
    })
    .catch((err) => {
        console.error('Migration failed:', err)
        process.exit(1)
    })
