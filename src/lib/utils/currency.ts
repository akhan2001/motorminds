// Currency and number formatting utility functions

import { FINANCIAL_CURRENCY, FINANCIAL_LOCALE } from '@/lib/constants/financial'

/**
 * Format number as currency (CAD by default)
 * 
 * Uses centralized FINANCIAL_CURRENCY and FINANCIAL_LOCALE constants
 * to ensure consistent currency formatting across all financial components.
 */
export function formatCurrency(
    amount?: number, 
    currency: string = FINANCIAL_CURRENCY,
    locale: string = FINANCIAL_LOCALE
): string {
    if (!amount && amount !== 0) return '$0.00'
    
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Format currency with decimal places
 * 
 * Uses centralized FINANCIAL_CURRENCY and FINANCIAL_LOCALE constants
 * to ensure consistent currency formatting across all financial components.
 */
export function formatCurrencyDetailed(
    amount?: number, 
    currency: string = FINANCIAL_CURRENCY,
    locale: string = FINANCIAL_LOCALE
): string {
    if (!amount && amount !== 0) return '$0.00'
    
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatCompactNumber(num?: number): string {
    if (!num && num !== 0) return '0'
    
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
    }).format(num)
}

/**
 * Format percentage
 */
export function formatPercentage(value?: number, decimals: number = 1): string {
    if (!value && value !== 0) return '0%'
    
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value / 100)
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
    const cleaned = currencyString.replace(/[^0-9.-]+/g, '')
    return parseFloat(cleaned) || 0
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0
    return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Format number with thousands separators
 */
export function formatNumber(num?: number): string {
    if (!num && num !== 0) return '0'
    
    return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Calculate compound growth rate
 */
export function calculateCAGR(
    startValue: number, 
    endValue: number, 
    numberOfYears: number
): number {
    if (startValue <= 0 || numberOfYears <= 0) return 0
    return (Math.pow(endValue / startValue, 1 / numberOfYears) - 1) * 100
}
