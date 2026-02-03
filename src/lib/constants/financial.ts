/**
 * Centralized financial constants for timezone and currency handling.
 * 
 * These constants ensure consistent financial calculations across:
 * - Daily reports
 * - Expense reports
 * - Financial aggregations
 * - Invoice generation
 * 
 * All financial date calculations should use FINANCIAL_TIMEZONE to avoid
 * UTC rollover issues where late-evening EST activity appears as the next day.
 */

// Canonical timezone for all financial calculations (Canada/Toronto = EST/EDT)
export const FINANCIAL_TIMEZONE = 'America/Toronto' as const

// Canonical currency for all financial formatting
export const FINANCIAL_CURRENCY = 'CAD' as const

// Canonical locale for currency and date formatting
export const FINANCIAL_LOCALE = 'en-CA' as const

// Type exports for stricter typing
export type FinancialTimezone = typeof FINANCIAL_TIMEZONE
export type FinancialCurrency = typeof FINANCIAL_CURRENCY
export type FinancialLocale = typeof FINANCIAL_LOCALE
