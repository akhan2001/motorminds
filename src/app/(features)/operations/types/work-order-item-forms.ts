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
 * Expense item form data (duplicate of PartFormItem but stored as generic item type)
 * Expenses default to is_billable=false (internal shop costs not shown on invoices)
 */
export interface ExpenseFormItem {
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
    is_billable?: boolean // Whether to show on customer invoice (defaults to false for expenses)
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
