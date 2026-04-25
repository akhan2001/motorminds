/**
 * Centralized type definitions for work order item forms
 * Used across create/edit modals and item components
 */

import type { WorkOrderItemTemplate } from './work-order-item-templates'

/**
 * Labor item form data
 */
export interface LaborFormItem {
    id: string
    description: string
    labor_hours: number
    unit_price: number
    total_price: number
    unit_cost?: number // Optional cost tracking
    line_discount?: number // Optional flat-dollar discount on this line
    category?: string
    notes?: string
    technician_id?: string
    active?: boolean // For edit mode tracking
}

/**
 * Part item form data
 */
export interface PartFormItem {
    id: string
    description: string
    part_number?: string
    quantity: number
    unit_price: number
    total_price: number
    unit_cost?: number // Optional cost tracking
    total_cost?: number // Optional cost tracking
    supplier?: string
    category?: string
    warranty_period?: string
    notes?: string
    active?: boolean // For edit mode tracking
}

/**
 * Expense item form data - mirrors one_time_costs fields for consistency
 * Expenses default to is_billable=false (internal shop costs not shown on invoices)
 * These fields align with one_time_costs schema for unified expense tracking
 */
export interface ExpenseFormItem {
    id: string
    description: string
    part_number?: string // Legacy field, use expense_invoice_number for new expenses
    quantity: number
    unit_price: number
    total_price: number
    unit_cost?: number // Optional cost tracking
    total_cost?: number // Optional cost tracking
    supplier?: string // Legacy field, use expense_vendor for new expenses
    category?: string
    warranty_period?: string // Maps to one_time_costs.warranty
    notes?: string
    active?: boolean // For edit mode tracking
    is_billable?: boolean // Always false for expenses (tracking only)
    
    // Expense-specific fields (mirror one_time_costs)
    expense_subtotal?: number // Pre-tax amount (maps to one_time_costs.subtotal)
    expense_tax_amount?: number // Tax amount (maps to one_time_costs.tax_amount)
    expense_tax_included?: boolean // Whether tax is included (maps to one_time_costs.tax_included)
    expense_payment_method?: 'credit_card' | 'debit_card' | 'cash' | 'check' | 'bank_transfer' | 'other' // Maps to one_time_costs.payment_method
    expense_vendor?: string // Vendor name (maps to one_time_costs.vendor, replaces supplier)
    expense_invoice_number?: string // Vendor invoice number (maps to one_time_costs.invoice_number)
    expense_parts_description?: string // Parts description (maps to one_time_costs.parts_description)
    expense_cost_date?: string // Date expense was incurred (maps to one_time_costs.cost_date, ISO date string)
}

/**
 * Generic item form data (used for Services, Fees, Discounts, Packages)
 */
export interface GenericFormItem {
    id: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
    unit_cost?: number // Optional cost tracking
    line_discount?: number // Optional flat-dollar discount on this line (services only)
    category?: string
    labor_hours?: number // Optional for packages and services
    notes?: string
    active?: boolean // For edit mode tracking
}

/**
 * Selected template with additional form fields
 */
export interface SelectedTemplate extends WorkOrderItemTemplate {
    selectedQuantity?: number
    selectedUnitPrice?: number
    selectedLaborHours?: number
    selectedTechnicianId?: string
}

/**
 * All work order items grouped by type
 */
export interface WorkOrderItemsByType {
    laborItems: LaborFormItem[]
    partsItems: PartFormItem[]
    expenseItems: ExpenseFormItem[]
    serviceItems: GenericFormItem[]
    feeItems: GenericFormItem[]
    discountItems: GenericFormItem[]
    packageItems: GenericFormItem[]
}

/**
 * Technician option for dropdowns
 */
export interface TechnicianOption {
    id: string
    name: string
}

/**
 * Type guard to check if an item is a LaborFormItem
 */
export function isLaborFormItem(item: any): item is LaborFormItem {
    return 'labor_hours' in item && 'technician_id' in item
}

/**
 * Type guard to check if an item is a PartFormItem
 */
export function isPartFormItem(item: any): item is PartFormItem {
    return 'part_number' in item && 'supplier' in item
}

/**
 * Type guard to check if an item is a GenericFormItem
 */
export function isGenericFormItem(item: any): item is GenericFormItem {
    return 'quantity' in item && 'unit_price' in item && !('labor_hours' in item) && !('part_number' in item)
}
